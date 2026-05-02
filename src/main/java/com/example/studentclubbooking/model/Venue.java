package com.example.studentclubbooking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Physical venue where an event is held.
 * An event's maxSeats cannot exceed the venue's capacity.
 */
@Entity
@Table(name = "venues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Room name is required")
    private String roomName;

    @NotBlank(message = "Building is required")
    private String building;

    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;
}
