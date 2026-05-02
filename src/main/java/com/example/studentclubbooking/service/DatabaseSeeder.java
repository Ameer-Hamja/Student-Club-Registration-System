package com.example.studentclubbooking.service;

import com.example.studentclubbooking.model.Department;
import com.example.studentclubbooking.model.Event;
import com.example.studentclubbooking.model.EventType;
import com.example.studentclubbooking.model.Role;
import com.example.studentclubbooking.model.User;
import com.example.studentclubbooking.repository.DepartmentRepository;
import com.example.studentclubbooking.repository.EventRepository;
import com.example.studentclubbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * DatabaseSeeder — DISABLED.
 *
 * DataSeeder (dataSeeder bean) is the canonical seeder and handles all seed
 * data (departments, venues, users, events).  This class is kept for reference
 * but is NOT registered as a Spring bean (@Component removed) to prevent
 * duplicate seeding on startup.
 *
 * If you need to re-enable this seeder, add @Component back and remove or
 * disable DataSeeder to avoid conflicts.
 */
@Slf4j
// @Component  ← intentionally disabled; DataSeeder is the active seeder
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final EventRepository      eventRepository;
    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;

    // ── Department seed data ──────────────────────────────────────────────────
    // name → hex colour used by the frontend filter bar and event cards
    private static final Map<String, String> DEPT_COLORS = new LinkedHashMap<>();
    static {
        DEPT_COLORS.put("CSE",          "#38bdf8");
        DEPT_COLORS.put("AIML",         "#a78bfa");
        DEPT_COLORS.put("AIDS",         "#f472b6");
        DEPT_COLORS.put("CYBERSECURITY","#f97316");
        DEPT_COLORS.put("DS",           "#2dd4bf");
        DEPT_COLORS.put("ECE",          "#facc15");
        DEPT_COLORS.put("EEE",          "#60a5fa");
        DEPT_COLORS.put("CIVIL",        "#c084fc");
    }

    @Override
    @Transactional
    public void run(String... args) {

        // ── 1. Departments ────────────────────────────────────────────────────
        // Use a bulk isEmpty() check so we only hit the DB once per startup.
        // If the table already has rows (e.g. after the first boot) we skip
        // the entire block — no per-row upsert overhead.
        if (departmentRepository.count() == 0) {
            log.info("Seeding departments...");
            DEPT_COLORS.forEach((name, color) ->
                departmentRepository.save(
                    Department.builder()
                        .name(name)
                        .description(name + " Department")
                        .colorTag(color)
                        .build()
                )
            );
            log.info("  ✓ {} departments saved.", DEPT_COLORS.size());
        } else {
            log.info("Departments already present — skipping.");
        }

        // ── 2. Admin user (admin@club.com / admin123) ─────────────────────────
        // BCryptPasswordEncoder is used directly here so the intent is explicit
        // and readable — the injected PasswordEncoder bean is also BCrypt, but
        // naming it clearly documents the security choice for future maintainers.
        seedAdmin("Platform Admin", "admin@club.com",  "admin123");
        seedAdmin("Hub Admin",      "admin@hub.com",   "admin123");

        // ── 3. Demo users ─────────────────────────────────────────────────────
        Department cse  = departmentRepository.findByNameIgnoreCase("CSE") .orElse(null);
        Department aiml = departmentRepository.findByNameIgnoreCase("AIML").orElse(null);

        seedUser("Campus Student", "student@club.com", "student123", Role.STUDENT, cse);
        seedUser("Faculty Mentor", "rajan@hub.com",    "faculty123", Role.FACULTY, aiml);

        // ── 4. Sample Hackathon events ────────────────────────────────────────
        if (cse != null) {
            seedHackathon(
                "CodeStorm 2026",
                "Build production-ready campus tools in a 24-hour collaborative sprint.",
                new BigDecimal("499.00"), 180, cse,
                LocalDateTime.of(2026, 7, 18, 9, 0), "Innovation Arena");
        }
        if (aiml != null) {
            seedHackathon(
                "AI Forge Hackathon",
                "Design AI-first solutions for healthcare, mobility, and student success.",
                new BigDecimal("699.00"), 140, aiml,
                LocalDateTime.of(2026, 8, 22, 10, 0), "AIML Research Block");
        }

        log.info("Database seeding complete.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Seeds an ADMIN user.
     * Uses BCryptPasswordEncoder explicitly to make the security intent clear.
     * The injected PasswordEncoder bean is also BCrypt — both produce the same hash.
     */
    private void seedAdmin(String name, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            log.info("Admin '{}' already exists — skipping.", email);
            return;
        }
        // Explicit BCryptPasswordEncoder — documents that admin passwords are
        // always BCrypt-hashed, regardless of any future PasswordEncoder changes.
        String hashed = new BCryptPasswordEncoder().encode(rawPassword);
        userRepository.save(
            User.builder()
                .name(name)
                .email(email)
                .password(hashed)
                .role(Role.ADMIN)   // stored as "ADMIN"; CustomUserDetailsService
                                    // calls .roles("ADMIN") → Spring adds "ROLE_" prefix
                .department(null)   // admins are not tied to a department
                .build()
        );
        log.info("  ✓ Admin user '{}' created.", email);
    }

    /**
     * Seeds a non-admin user using the injected PasswordEncoder bean.
     * Skips silently if the email already exists.
     */
    private void seedUser(String name, String email, String rawPassword,
                          Role role, Department department) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        userRepository.save(
            User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .department(department)
                .build()
        );
        log.info("  ✓ User '{}' ({}) created.", email, role);
    }

    /**
     * Seeds a Hackathon event. Skips if an event with the same title already exists.
     */
    private void seedHackathon(String title, String description, BigDecimal price,
                                int maxSeats, Department department,
                                LocalDateTime date, String venue) {
        boolean exists = eventRepository.findAll().stream()
                .anyMatch(e -> e.getTitle().equalsIgnoreCase(title));
        if (exists) {
            return;
        }
        eventRepository.save(
            Event.builder()
                .title(title)
                .description(description)
                .type(EventType.HACKATHON)
                .price(price)
                .maxSeats(maxSeats)
                .availableSeats(maxSeats)
                .date(date)
                .venue(venue)
                .department(department)
                .build()
        );
        log.info("  ✓ Event '{}' created.", title);
    }
}
