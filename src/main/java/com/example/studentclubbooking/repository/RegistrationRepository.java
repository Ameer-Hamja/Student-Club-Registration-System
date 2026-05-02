package com.example.studentclubbooking.repository;

import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.PaymentStatus;
import com.example.studentclubbooking.model.Registration;
import com.example.studentclubbooking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByUserAndEvent(User user, Event event);

    List<Registration> findByUser(User user);

    List<Registration> findByUserOrderByIdDesc(User user);

    long countByPaymentStatus(PaymentStatus status);

    @Query("SELECT r.event.department.name, COUNT(r) FROM Registration r " +
           "WHERE r.paymentStatus = 'PAID' GROUP BY r.event.department.name")
    List<Object[]> countRegistrationsByDepartment();

    @Query("SELECT r.event.title, COUNT(r) FROM Registration r " +
           "WHERE r.paymentStatus = 'PAID' GROUP BY r.event.title ORDER BY COUNT(r) DESC")
    List<Object[]> findTopEventsByRegistrations();
}
