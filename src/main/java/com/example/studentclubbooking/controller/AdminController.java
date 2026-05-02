package com.example.studentclubbooking.controller;

import com.example.studentclubbooking.dto.AdminStatsDTO;
import com.example.studentclubbooking.dto.EventDTO;
import com.example.studentclubbooking.dto.EventUpdateRequest;
import com.example.studentclubbooking.dto.TransactionDTO;
import com.example.studentclubbooking.model.Department;
import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.PaymentStatus;
import com.example.studentclubbooking.model.TransactionStatus;
import com.example.studentclubbooking.repository.EventRepository;
import com.example.studentclubbooking.repository.TransactionRepository;
import com.example.studentclubbooking.service.DepartmentService;
import com.example.studentclubbooking.service.EventService;
import com.example.studentclubbooking.service.RegistrationService;
import com.example.studentclubbooking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private EventService         eventService;
    @Autowired private DepartmentService    departmentService;
    @Autowired private UserService          userService;
    @Autowired private RegistrationService  registrationService;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private EventRepository      eventRepository;

    @Value("${app.upload.dir:uploads/events}")
    private String uploadDir;

    // ─── Events ───────────────────────────────────────────────────────────────

    @GetMapping("/events")
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        return ResponseEntity.ok(
                eventService.getAllEvents().stream().map(EventDTO::new).collect(Collectors.toList()));
    }

    @PostMapping("/events")
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody Event event) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new EventDTO(eventService.saveEvent(event)));
    }

    /**
     * PUT /api/admin/events/{id}
     * Partial update — price (BigDecimal), title, seats, description, venue, type.
     * Returns 200 OK or 400 Bad Request.
     */
    @PutMapping("/events/{id}")
    public ResponseEntity<EventDTO> updateEvent(
            @PathVariable Long id,
            @RequestBody EventUpdateRequest req) {
        return ResponseEntity.ok(new EventDTO(eventService.patchEvent(id, req)));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
    }

    // ─── Image Upload ─────────────────────────────────────────────────────────

    @PostMapping("/events/{id}/image")
    public ResponseEntity<Map<String, String>> uploadEventImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Event event = eventService.getEventByIdOrThrow(id);
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String filename = "event_" + id + "_" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), uploadPath.resolve(filename));
        event.setImageUrl("/uploads/events/" + filename);
        eventService.saveEvent(event);

        return ResponseEntity.ok(Map.of("message", "Image uploaded", "imageUrl", event.getImageUrl()));
    }

    // ─── Departments ──────────────────────────────────────────────────────────

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(@Valid @RequestBody Department department) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentService.saveDepartment(department));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<Department> updateDepartment(
            @PathVariable Long id, @Valid @RequestBody Department department) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, department));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    /**
     * GET /api/admin/transactions
     * Returns all transactions ordered by timestamp desc.
     * Optionally filter by status: ?status=SUCCESS|FAILED|REFUNDED
     */
    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionDTO>> getTransactions(
            @RequestParam(required = false) TransactionStatus status) {

        List<TransactionDTO> dtos;
        if (status != null) {
            dtos = transactionRepository.findByStatusOrderByTimestampDesc(status)
                    .stream().map(TransactionDTO::new).collect(Collectors.toList());
        } else {
            dtos = transactionRepository.findAll().stream()
                    .sorted(Comparator.comparing(
                            com.example.studentclubbooking.model.Transaction::getTimestamp,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .map(TransactionDTO::new)
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(dtos);
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/stats
     * Returns:
     *   totalRevenue         — sum of all SUCCESS transaction amounts (BigDecimal)
     *   registrationsByDept  — count of SUCCESS transactions per department
     *   popularEvents        — top 5 events by seat occupancy %
     *   topEvents            — top 5 events by SUCCESS transaction count
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        AdminStatsDTO stats = new AdminStatsDTO();

        stats.setTotalUsers(userService.countAll());
        stats.setTotalEvents(eventService.countAll());
        stats.setTotalRegistrations(registrationService.countAll());
        stats.setPaidRegistrations(registrationService.countByPaymentStatus(PaymentStatus.PAID));
        stats.setFailedRegistrations(registrationService.countByPaymentStatus(PaymentStatus.FAILED));

        // Revenue from Transaction table (precise BigDecimal)
        BigDecimal revenue = transactionRepository.sumSuccessfulRevenue();
        stats.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);

        // Registrations by department (from Transaction table)
        List<Map<String, Object>> deptStats = transactionRepository.countSuccessByDepartment()
                .stream().map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("department", row[0]);
                    m.put("count", row[1]);
                    return m;
                }).collect(Collectors.toList());
        stats.setRegistrationsByDepartment(deptStats);

        // Top events by transaction count
        List<Map<String, Object>> topEvents = transactionRepository.findPopularEvents()
                .stream().limit(5).map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("event", row[0]);
                    m.put("count", row[1]);
                    return m;
                }).collect(Collectors.toList());
        stats.setTopEvents(topEvents);

        // Popular events by seat occupancy %
        List<Map<String, Object>> popularEvents = eventRepository.findAll().stream()
                .filter(e -> e.getMaxSeats() > 0)
                .sorted(Comparator.comparingDouble(
                        e -> -((double)(e.getMaxSeats() - e.getAvailableSeats()) / e.getMaxSeats())))
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("event", e.getTitle());
                    m.put("department", e.getDepartment() != null ? e.getDepartment().getName() : "—");
                    m.put("occupancy", Math.round(
                            ((double)(e.getMaxSeats() - e.getAvailableSeats()) / e.getMaxSeats()) * 100));
                    m.put("availableSeats", e.getAvailableSeats());
                    m.put("maxSeats", e.getMaxSeats());
                    return m;
                }).collect(Collectors.toList());
        stats.setPopularEvents(popularEvents);

        return ResponseEntity.ok(stats);
    }
}
