package com.example.studentclubbooking.dto;

import com.example.studentclubbooking.model.EventType;
import com.example.studentclubbooking.model.PaymentStatus;
import com.example.studentclubbooking.model.Registration;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class RegistrationDTO {

    private Long id;
    private Long eventId;
    private String eventTitle;
    private String eventDescription;
    private LocalDateTime eventDate;
    private BigDecimal eventPrice;     // BigDecimal for precision
    private EventType eventType;
    private String departmentName;
    private String departmentColor;
    private String venue;
    private PaymentStatus paymentStatus;
    private String transactionId;
    private LocalDateTime timestamp;

    public RegistrationDTO(Registration registration) {
        this.id = registration.getId();
        this.paymentStatus = registration.getPaymentStatus();
        this.transactionId = registration.getTransactionId();
        this.timestamp = registration.getTimestamp();
        if (registration.getEvent() != null) {
            this.eventId          = registration.getEvent().getId();
            this.eventTitle       = registration.getEvent().getTitle();
            this.eventDescription = registration.getEvent().getDescription();
            this.eventDate        = registration.getEvent().getDate();
            this.eventPrice       = registration.getEvent().getPrice();
            this.eventType        = registration.getEvent().getType();
            this.venue            = registration.getEvent().getVenue();
            if (registration.getEvent().getDepartment() != null) {
                this.departmentName  = registration.getEvent().getDepartment().getName();
                this.departmentColor = registration.getEvent().getDepartment().getColorTag();
            }
        }
    }
}
