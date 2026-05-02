package com.example.studentclubbooking.repository;

import com.example.studentclubbooking.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    Optional<Department> findByNameIgnoreCase(String name);
    boolean existsByName(String name);
}
