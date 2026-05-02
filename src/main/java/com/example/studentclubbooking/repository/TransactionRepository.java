package com.example.studentclubbooking.repository;

import com.example.studentclubbooking.model.Transaction;
import com.example.studentclubbooking.model.TransactionStatus;
import com.example.studentclubbooking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    /** All transactions for a specific user, newest first */
    List<Transaction> findByUserOrderByTimestampDesc(User user);

    /** All transactions with a given status */
    List<Transaction> findByStatusOrderByTimestampDesc(TransactionStatus status);

    /** Sum of all SUCCESS transaction amounts — used for totalRevenue */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = 'SUCCESS'")
    BigDecimal sumSuccessfulRevenue();

    /** Count by status */
    long countByStatus(TransactionStatus status);

    /**
     * Top 5 events by number of SUCCESS transactions (seat occupancy proxy).
     * Returns Object[]{eventTitle, count}.
     */
    @Query("SELECT t.event.title, COUNT(t) FROM Transaction t " +
           "WHERE t.status = 'SUCCESS' " +
           "GROUP BY t.event.title ORDER BY COUNT(t) DESC")
    List<Object[]> findPopularEvents();

    /**
     * Revenue grouped by department — for registrationsByDept stat.
     * Returns Object[]{departmentName, count}.
     */
    @Query("SELECT t.event.department.name, COUNT(t) FROM Transaction t " +
           "WHERE t.status = 'SUCCESS' " +
           "GROUP BY t.event.department.name")
    List<Object[]> countSuccessByDepartment();
}
