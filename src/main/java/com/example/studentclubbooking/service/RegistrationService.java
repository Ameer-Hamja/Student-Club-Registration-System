package com.example.studentclubbooking.service;

import com.example.studentclubbooking.exception.DuplicateRegistrationException;
import com.example.studentclubbooking.exception.NoSeatsAvailableException;
import com.example.studentclubbooking.model.*;
import com.example.studentclubbooking.repository.RegistrationRepository;
import com.example.studentclubbooking.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * RegistrationService — handles ticket purchase (seat booking) for events.
 *
 * Key fixes:
 *  1. @Transactional(isolation = SERIALIZABLE) on registerForEvent prevents
 *     two concurrent threads from both passing the "seats > 0" check and both
 *     decrementing — critical for high-traffic Hackathon registrations.
 *
 *  2. eventService.reduceAvailableSeats(id) executes an atomic JPQL UPDATE:
 *       UPDATE Event SET availableSeats = availableSeats - 1
 *       WHERE id = :id AND availableSeats > 0
 *     Returns 0 when already full → throws NoSeatsAvailableException.
 *     No gap between "read availableSeats" and "write availableSeats - 1".
 *
 *  3. Payment failure path: Transaction(FAILED) is recorded, seats are NOT
 *     decremented, and the outer @Transactional still commits the failure
 *     ledger entry (because we do NOT throw — we return the Registration).
 *     If an unexpected exception occurs, the whole DB transaction rolls back.
 */
@Service
public class RegistrationService {

    @Autowired private RegistrationRepository  registrationRepository;
    @Autowired private TransactionRepository   transactionRepository;
    @Autowired private PaymentService          paymentService;
    @Autowired private EventService            eventService;
    @Autowired private EmailNotificationService emailNotificationService;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Purchase a ticket (register) for the given event.
     *
     * Transaction isolation = SERIALIZABLE ensures that no two concurrent
     * callers can both read availableSeats > 0 and both decrement — the second
     * caller's UPDATE will see 0 rows affected and throw NoSeatsAvailableException.
     *
     * @param user  the authenticated user making the purchase
     * @param event the target event (re-fetched inside to get fresh seat count)
     * @return the persisted Registration record
     * @throws DuplicateRegistrationException if the user already holds a ticket
     * @throws NoSeatsAvailableException      if the event is sold out
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Registration registerForEvent(User user, Event event) {

        // ── Gate 1: duplicate ticket check ────────────────────────────────────
        Optional<Registration> existing = registrationRepository.findByUserAndEvent(user, event);
        if (existing.isPresent()) {
            throw new DuplicateRegistrationException(
                    "You already hold a ticket for this event.");
        }

        // ── Gate 2: seat availability check (application-level) ───────────────
        // The DB-level guard in reduceAvailableSeats() is the hard guarantee;
        // this check provides a friendlier early-exit message.
        if (event.getAvailableSeats() <= 0) {
            throw new NoSeatsAvailableException(
                    "Sorry, this event is sold out.");
        }

        // ── Payment simulation ────────────────────────────────────────────────
        // Simulates 80% success / 20% failure to mimic a real payment gateway.
        PaymentService.PaymentResult paymentResult =
                paymentService.simulatePayment(event.getPrice());

        // ── Ledger: always persist a Transaction record ────────────────────────
        // Records both SUCCESS and FAILURE for audit / reconciliation.
        Transaction transaction = Transaction.builder()
                .user(user)
                .event(event)
                .amount(event.getPrice())
                .status(paymentResult.getStatus())
                .paymentGatewayRef(paymentResult.getGatewayRef())
                .build();
        transactionRepository.save(transaction);

        // ── Map to legacy PaymentStatus ───────────────────────────────────────
        PaymentStatus legacyStatus = paymentResult.isSuccess()
                ? PaymentStatus.PAID
                : PaymentStatus.FAILED;

        if (paymentResult.isSuccess()) {
            // FIX: Atomic DB decrement — only when payment succeeds.
            // Uses JPQL UPDATE with WHERE availableSeats > 0 (no race condition).
            // Throws NoSeatsAvailableException if another thread grabbed the last seat.
            eventService.reduceAvailableSeats(event.getId());

            emailNotificationService.sendRegistrationConfirmation(
                    user, event, transaction.getId());
        } else {
            // Payment failed — seats unchanged, failure email dispatched.
            emailNotificationService.sendPaymentFailureNotification(user, event);
        }

        // ── Persist and return Registration ───────────────────────────────────
        // Re-fetch the event so the Registration holds the updated availableSeats.
        Event refreshedEvent = eventService.getEventByIdOrThrow(event.getId());

        Registration registration = Registration.builder()
                .user(user)
                .event(refreshedEvent)
                .paymentStatus(legacyStatus)
                .transactionId(transaction.getId())
                .build();

        return registrationRepository.save(registration);
    }

    /** Returns all registrations for a user, newest first. */
    public List<Registration> getUserRegistrations(User user) {
        return registrationRepository.findByUserOrderByIdDesc(user);
    }

    public long countByPaymentStatus(PaymentStatus status) {
        return registrationRepository.countByPaymentStatus(status);
    }

    public long countAll() {
        return registrationRepository.count();
    }
}
