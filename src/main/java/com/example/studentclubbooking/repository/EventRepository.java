package com.example.studentclubbooking.repository;

import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findAllByOrderByDateAsc();

    List<Event> findByDepartmentId(Long departmentId);

    List<Event> findByDepartmentNameIgnoreCase(String departmentName);

    List<Event> findByType(EventType type);

    List<Event> findByPriceLessThanEqual(BigDecimal maxPrice);

    @Query("SELECT e FROM Event e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.tags) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.venue) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Event> searchEvents(@Param("query") String query);

    @Query("SELECT e FROM Event e WHERE e.department.id = :deptId AND e.price <= :maxPrice")
    List<Event> findByDepartmentAndMaxPrice(@Param("deptId") Long deptId,
                                            @Param("maxPrice") BigDecimal maxPrice);

    /**
     * Atomic seat decrement using @Modifying — avoids race conditions.
     * Only decrements when availableSeats > 0 (safe guard at DB level).
     * Returns number of rows updated (1 = success, 0 = already full).
     */
    @Modifying
    @Query("UPDATE Event e SET e.availableSeats = e.availableSeats - 1 " +
           "WHERE e.id = :eventId AND e.availableSeats > 0")
    int decrementAvailableSeats(@Param("eventId") Long eventId);
}
