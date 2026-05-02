package com.example.studentclubbooking.dto;

import com.example.studentclubbooking.model.Department;
import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.EventType;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class EventDTO {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime date;
    private BigDecimal price;          // BigDecimal for financial precision
    private int maxSeats;
    private int availableSeats;
    private EventType type;
    private String imageUrl;
    private String tags;
    private String venue;
    private Department department;
    private double seatFillPercentage;

    public EventDTO(Event event) {
        this.id = event.getId();
        this.title = event.getTitle();
        this.description = event.getDescription();
        this.date = event.getDate();
        this.price = event.getPrice();
        this.maxSeats = event.getMaxSeats();
        this.availableSeats = event.getAvailableSeats();
        this.type = event.getType();
        this.imageUrl = event.getImageUrl();
        this.tags = event.getTags();
        this.venue = event.getVenue();
        this.department = event.getDepartment();
        this.seatFillPercentage = event.getMaxSeats() > 0
                ? ((double) (event.getMaxSeats() - event.getAvailableSeats()) / event.getMaxSeats()) * 100
                : 0;
    }
}
