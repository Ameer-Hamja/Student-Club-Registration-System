package com.example.studentclubbooking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Dedicated financial ledger entry for every payment attempt.
 * One Transaction is created per registration attempt (SUCCESS or FAILED).
 */
@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    /** UUID primary key — globally unique payment reference */
    @Id
    @Column(name = "id", updatable = false, nullable = false, length = 36)
    private String id;

    /** The student who initiated the payment */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The event being paid for */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /**
     * Amount captured at the time of booking (BigDecimal for financial precision).
     * @Min(0) prevents negative prices from being stored.
     */
    @DecimalMin(value = "0.0", message = "Transaction amount cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** SUCCESS | FAILED | REFUNDED */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    /** Mock payment gateway reference (UUID string on success, null on failure) */
    @Column(name = "payment_gateway_ref")
    private String paymentGatewayRef;

    /** Exact moment the money movement was recorded */
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
