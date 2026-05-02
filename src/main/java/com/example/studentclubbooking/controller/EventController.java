package com.example.studentclubbooking.controller;

import com.example.studentclubbooking.dto.EventDTO;
import com.example.studentclubbooking.dto.RegistrationDTO;
import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.EventType;
import com.example.studentclubbooking.model.Registration;
import com.example.studentclubbooking.model.User;
import com.example.studentclubbooking.service.EventService;
import com.example.studentclubbooking.service.RegistrationService;
import com.example.studentclubbooking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * EventController
 *
 * FIX: Added POST /api/events/{id}/purchase — the dedicated ticket-purchase endpoint.
 *
 * The existing /register endpoint is kept for backward compatibility (used by
 * PaymentModal and older clients). The new /purchase endpoint is identical in
 * behaviour but matches the frontend EventCard's api.post(`/events/${id}/purchase`)
 * call, and is named more intuitively for student-facing UX.
 *
 * Both endpoints delegate to RegistrationService.registerForEvent() which is
 * @Transactional(SERIALIZABLE) and performs an atomic availableSeats decrement.
 */
@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired private EventService         eventService;
    @Autowired private RegistrationService  registrationService;
    @Autowired private UserService          userService;

    // ── GET /api/events — supports ?search=, ?type=, ?maxPrice= ─────────────
    @GetMapping
    public ResponseEntity<List<EventDTO>> getAllEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) EventType type) {

        List<Event> events;

        if (search != null && !search.isBlank()) {
            events = eventService.searchEvents(search);
        } else if (type != null) {
            events = eventService.getEventsByType(type);
        } else if (departmentId != null && maxPrice != null) {
            events = eventService.getEventsByDepartment(departmentId).stream()
                    .filter(e -> e.getPrice().compareTo(maxPrice) <= 0)
                    .collect(Collectors.toList());
        } else if (departmentId != null) {
            events = eventService.getEventsByDepartment(departmentId);
        } else if (maxPrice != null) {
            events = eventService.getEventsByMaxPrice(maxPrice);
        } else {
            events = eventService.getAllEvents();
        }

        return ResponseEntity.ok(
                events.stream().map(EventDTO::new).collect(Collectors.toList()));
    }

    // ── GET /api/events/filter?dept=CSE ──────────────────────────────────────
    @GetMapping("/filter")
    public ResponseEntity<List<EventDTO>> filterByDepartment(
            @RequestParam(name = "dept", required = false) String deptName) {

        List<Event> events = (deptName == null || deptName.isBlank())
                ? eventService.getAllEvents()
                : eventService.getEventsByDepartmentName(deptName);

        return ResponseEntity.ok(
                events.stream().map(EventDTO::new).collect(Collectors.toList()));
    }

    // ── GET /api/events/{id} ─────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(new EventDTO(eventService.getEventByIdOrThrow(id)));
    }

    /**
     * POST /api/events/{id}/purchase
     *
     * FIX: New dedicated ticket-purchase endpoint called by EventCard.jsx.
     *
     * Flow (all inside RegistrationService @Transactional SERIALIZABLE):
     *   1. Duplicate-ticket guard  — 409 if user already holds a ticket
     *   2. Seat-availability guard — 409 if event is sold out
     *   3. Payment simulation      — 80% success / 20% failure
     *   4. Atomic seat decrement   — UPDATE … WHERE availableSeats > 0
     *   5. Return RegistrationDTO  — includes paymentStatus (PAID / FAILED)
     *
     * Returns 401 when the request carries no valid JWT (enforced by the JWT
     * filter — not by SecurityConfig, because the URL pattern is permitAll so
     * that the OPTIONS pre-flight is never blocked).
     */
    @PostMapping("/{id}/purchase")
    public ResponseEntity<RegistrationDTO> purchaseTicket(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        User   user  = userService.findByEmail(email).orElseThrow();
        Event  event = eventService.getEventByIdOrThrow(id);

        Registration registration = registrationService.registerForEvent(user, event);
        return ResponseEntity.ok(new RegistrationDTO(registration));
    }

    /**
     * POST /api/events/{id}/register
     *
     * Legacy endpoint — kept for backward compatibility with PaymentModal and
     * older integrations.  Delegates to the same service method as /purchase.
     */
    @PostMapping("/{id}/register")
    public ResponseEntity<RegistrationDTO> registerForEvent(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        User   user  = userService.findByEmail(email).orElseThrow();
        Event  event = eventService.getEventByIdOrThrow(id);

        Registration registration = registrationService.registerForEvent(user, event);
        return ResponseEntity.ok(new RegistrationDTO(registration));
    }
}
