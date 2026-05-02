package com.example.studentclubbooking.controller;

import com.example.studentclubbooking.model.Department;
import com.example.studentclubbooking.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public endpoint — no auth required.
 * GET /api/departments  →  returns all departments (used by the frontend filter bar).
 * Verification: http://localhost:8080/api/departments
 */
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }
}
