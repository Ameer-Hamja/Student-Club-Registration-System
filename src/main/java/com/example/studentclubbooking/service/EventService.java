package com.example.studentclubbooking.service;

import com.example.studentclubbooking.dto.EventUpdateRequest;
import com.example.studentclubbooking.exception.ResourceNotFoundException;
import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.EventType;
import com.example.studentclubbooking.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByDateAsc();
    }

    public List<Event> searchEvents(String query) {
        return eventRepository.searchEvents(query);
    }

    public List<Event> getEventsByDepartment(Long departmentId) {
        return eventRepository.findByDepartmentId(departmentId);
    }

    /** Filter by department name — supports GET /api/events/filter?dept=CSE */
    public List<Event> getEventsByDepartmentName(String deptName) {
        return eventRepository.findByDepartmentNameIgnoreCase(deptName);
    }

    public List<Event> getEventsByType(EventType type) {
        return eventRepository.findByType(type);
    }

    public List<Event> getEventsByMaxPrice(BigDecimal maxPrice) {
        return eventRepository.findByPriceLessThanEqual(maxPrice);
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public Event getEventByIdOrThrow(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    public Event saveEvent(Event event) {
        if (event.getId() == null && event.getAvailableSeats() == 0 && event.getMaxSeats() > 0) {
            event.setAvailableSeats(event.getMaxSeats());
        }
        return eventRepository.save(event);
    }

    /**
     * Partial update — only non-null fields in the request are applied.
     * Wired to PUT /api/admin/events/{id}
     */
    @Transactional
    public Event patchEvent(Long id, EventUpdateRequest req) {
        Event event = getEventByIdOrThrow(id);

        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            event.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            event.setDescription(req.getDescription());
        }
        if (req.getVenue() != null) {
            event.setVenue(req.getVenue());
        }
        if (req.getType() != null) {
            event.setType(req.getType());
        }
        if (req.getPrice() != null) {
            if (req.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price cannot be negative");
            }
            event.setPrice(req.getPrice());
        }
        if (req.getMaxSeats() != null) {
            if (req.getMaxSeats() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max seats must be positive");
            }
            int bookedSeats = event.getMaxSeats() - event.getAvailableSeats();
            int newAvailable = Math.max(0, req.getMaxSeats() - bookedSeats);
            event.setMaxSeats(req.getMaxSeats());
            event.setAvailableSeats(newAvailable);
        }
        return eventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
    }

    @Transactional
    public void reduceAvailableSeats(Long eventId) {
        int updatedRows = eventRepository.decrementAvailableSeats(eventId);
        if (updatedRows == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No seats available for this event");
        }
    }

    public long countAll() {
        return eventRepository.count();
    }
}
