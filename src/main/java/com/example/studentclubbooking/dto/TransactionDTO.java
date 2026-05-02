package com.example.studentclubbooking.dto;

import com.example.studentclubbooking.model.Transaction;
import com.example.studentclubbooking.model.TransactionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class TransactionDTO {

    private String id;
    private String studentName;
    private String studentEmail;
    private String eventTitle;
    private String eventType;
    private String departmentName;
    private BigDecimal amount;
    private TransactionStatus status;
    private String paymentGatewayRef;
    private LocalDateTime timestamp;

    public TransactionDTO(Transaction tx) {
        this.id = tx.getId();
        this.amount = tx.getAmount();
        this.status = tx.getStatus();
        this.paymentGatewayRef = tx.getPaymentGatewayRef();
        this.timestamp = tx.getTimestamp();

        if (tx.getUser() != null) {
            this.studentName  = tx.getUser().getName();
            this.studentEmail = tx.getUser().getEmail();
        }
        if (tx.getEvent() != null) {
            this.eventTitle = tx.getEvent().getTitle();
            this.eventType  = tx.getEvent().getType() != null
                    ? tx.getEvent().getType().name() : null;
            if (tx.getEvent().getDepartment() != null) {
                this.departmentName = tx.getEvent().getDepartment().getName();
            }
        }
    }
}
