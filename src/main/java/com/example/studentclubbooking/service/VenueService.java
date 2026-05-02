package com.example.studentclubbooking.service;

import com.example.studentclubbooking.exception.ResourceNotFoundException;
import com.example.studentclubbooking.model.Venue;
import com.example.studentclubbooking.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class VenueService {

    @Autowired
    private VenueRepository venueRepository;

    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    public Optional<Venue> getVenueById(Long id) {
        return venueRepository.findById(id);
    }

    public Venue getVenueByIdOrThrow(Long id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));
    }

    public Venue saveVenue(Venue venue) {
        if (venueRepository.existsByRoomNameAndBuilding(venue.getRoomName(), venue.getBuilding())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Venue already exists: " + venue.getRoomName() + " in " + venue.getBuilding());
        }
        return venueRepository.save(venue);
    }

    public Venue updateVenue(Long id, Venue updated) {
        Venue existing = getVenueByIdOrThrow(id);
        existing.setRoomName(updated.getRoomName());
        existing.setBuilding(updated.getBuilding());
        existing.setCapacity(updated.getCapacity());
        return venueRepository.save(existing);
    }

    public void deleteVenue(Long id) {
        if (!venueRepository.existsById(id)) {
            throw new ResourceNotFoundException("Venue not found with id: " + id);
        }
        venueRepository.deleteById(id);
    }
}
