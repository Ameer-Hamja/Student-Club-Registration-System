package com.example.studentclubbooking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event entity.
 *
 * Key fixes:
 *  - @PrePersist ensures price defaults to ₹200 and availableSeats defaults
 *    to maxSeats when not explicitly supplied — prevents NPE from @NotNull
 *    price and ensures seat tracking starts correctly.
 *  - venueEntity FK is retained (maps to the `venues` table).
 *  - availableSeats is used by EventRepository.decrementAvailableSeats()
 *    for atomic, race-condition-safe seat deduction on ticket purchase.
 */
@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Date is required")
    private LocalDateTime date;

    /**
     * Ticket price in INR.
     *
     * FIX: defaults to ₹200 via @PrePersist when not set.
     * BigDecimal used for financial precision (avoids floating-point errors).
     * @DecimalMin enforces non-negative prices.
     */
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Min(value = 1, message = "Max seats must be at least 1")
    private int maxSeats;

    /**
     * Remaining purchasable seats.
     *
     * FIX: initialised to maxSeats in @PrePersist.
     * Decremented atomically by EventRepository.decrementAvailableSeats()
     * (JPQL UPDATE with WHERE availableSeats > 0 — DB-level race-condition guard).
     */
    private int availableSeats;

    /** Event category: TECHNICAL_SYMPOSIUM, WORKSHOP, GUEST_LECTURE, FDP, HACKATHON */
    @Enumerated(EnumType.STRING)
    private EventType type;

    private String imageUrl;
    private String tags;

    /** Display-name string for the venue (shown on event cards / list views). */
    private String venue;

    /**
     * FIX: FK to the venues table.
     * Every event should have a venueEntity assigned so the admin can enforce
     * capacity limits (maxSeats ≤ venueEntity.capacity).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "venue_id")
    private Venue venueEntity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    /**
     * @PrePersist hook — runs before INSERT.
     *
     * Guarantees two invariants for every new event:
     *   1. price is never null (defaults to ₹200).
     *   2. availableSeats mirrors maxSeats on creation (before any purchases).
     *
     * This is a safety net; callers (DataSeeder, EventService) should set
     * these explicitly, but @PrePersist catches any slip-through.
     */
    @PrePersist
    private void applyDefaults() {
        if (price == null) {
            price = new BigDecimal("200.00");
        }
        if (availableSeats == 0 && maxSeats > 0) {
            availableSeats = maxSeats;
        }
    }
}
