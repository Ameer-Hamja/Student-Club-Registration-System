package com.example.studentclubbooking.dto;

import com.example.studentclubbooking.model.EventType;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Partial-update payload for PUT /api/admin/events/{id}.
 * Only non-null fields are applied.
 */
@Data
public class EventUpdateRequest {
    private String title;

    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    private BigDecimal price;

    private Integer maxSeats;
    private String description;
    private String venue;
    private EventType type;
}
