package com.example.studentclubbooking.repository;

import com.example.studentclubbooking.model.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {
    Optional<Venue> findByRoomNameAndBuilding(String roomName, String building);
    boolean existsByRoomNameAndBuilding(String roomName, String building);
}
