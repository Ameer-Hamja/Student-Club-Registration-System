package com.example.studentclubbooking.service;

import com.example.studentclubbooking.exception.ResourceNotFoundException;
import com.example.studentclubbooking.model.Department;
import com.example.studentclubbooking.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    public Department getDepartmentByIdOrThrow(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    public Department saveDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, Department updated) {
        Department existing = getDepartmentByIdOrThrow(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setColorTag(updated.getColorTag());
        return departmentRepository.save(existing);
    }

    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found with id: " + id);
        }
        departmentRepository.deleteById(id);
    }
}
