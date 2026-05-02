package com.example.studentclubbooking.service;

import com.example.studentclubbooking.model.*;
import com.example.studentclubbooking.repository.*;
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
 * DataSeeder — populates the database with required seed data on every startup.
 *
 * Strategy: check-before-insert (idempotent). Safe to run on every boot.
 *
 * Seeds (in order):
 *   1. Departments  — CSE, AIML, AIDS, CYBERSECURITY, DS, ECE, EEE, CIVIL
 *   2. Venues       — one default venue per department + a General Hall
 *   3. Admin user   — admin@club.com / admin123 (BCrypt, ROLE_ADMIN)
 *   4. Demo users   — student@club.com, faculty@club.com
 *   5. Sample events — one Hackathon per major department (price = 200 default)
 *
 * ROLE_ prefix note
 * -----------------
 * Role enum stores "ADMIN" / "STUDENT" / "FACULTY".
 * CustomUserDetailsService prepends "ROLE_" → "ROLE_ADMIN".
 * SecurityConfig uses hasRole("ADMIN") which also adds "ROLE_" internally.
 * → The two sides always match. No manual "ROLE_" prefix needed in the seeder.
 */
@Slf4j
@Component("dataSeeder")       // bean name matches the task requirement "DataSeeder"
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final VenueRepository      venueRepository;
    private final EventRepository      eventRepository;
    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;

    // ── Department seed data ──────────────────────────────────────────────────
    // name → hex colour (used by the frontend filter-bar and event cards)
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

    /** Default ticket price when no price is explicitly supplied (₹200). */
    private static final BigDecimal DEFAULT_PRICE = new BigDecimal("200.00");

    @Override
    @Transactional
    public void run(String... args) {

        // ── 1. Departments ────────────────────────────────────────────────────
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

        // ── 2. Default Venues ─────────────────────────────────────────────────
        // Each department gets a seminar-hall venue.  A shared General Hall is
        // also created as a fallback for events without a department venue.
        seedVenue("General Hall",      "Main Block",   500);
        seedVenue("CSE Seminar Hall",  "CSE Block",    200);
        seedVenue("AIML Lab",          "AIML Block",   120);
        seedVenue("ECE Auditorium",    "ECE Block",    300);
        seedVenue("Innovation Arena",  "Tech Block",   400);
        seedVenue("AIML Research Block","AIML Block",  140);

        // ── 3. Admin users ────────────────────────────────────────────────────
        // FIX: admin@club.com / admin123 — BCrypt encoded, ROLE_ADMIN
        seedAdmin("Platform Admin", "admin@club.com", "admin123");
        seedAdmin("Hub Admin",      "admin@hub.com",  "admin123");

        // ── 4. Demo users ─────────────────────────────────────────────────────
        Department cse  = departmentRepository.findByNameIgnoreCase("CSE") .orElse(null);
        Department aiml = departmentRepository.findByNameIgnoreCase("AIML").orElse(null);

        seedUser("Campus Student", "student@club.com", "student123", Role.STUDENT, cse);
        seedUser("Faculty Mentor", "rajan@hub.com",    "faculty123", Role.FACULTY, aiml);

        // ── 5. Sample events (default price = ₹200) ───────────────────────────
        Venue generalHall    = venueRepository.findByRoomNameAndBuilding("General Hall",       "Main Block" ).orElse(null);
        Venue innovArena     = venueRepository.findByRoomNameAndBuilding("Innovation Arena",   "Tech Block" ).orElse(null);
        Venue aimlResearch   = venueRepository.findByRoomNameAndBuilding("AIML Research Block","AIML Block" ).orElse(null);

        if (cse != null) {
            seedEvent(
                "CodeStorm 2026",
                "Build production-ready campus tools in a 24-hour collaborative sprint.",
                DEFAULT_PRICE,   // ← ₹200 default
                180,
                cse,
                LocalDateTime.of(2026, 7, 18, 9, 0),
                innovArena,
                "Innovation Arena",
                EventType.HACKATHON
            );
        }
        if (aiml != null) {
            seedEvent(
                "AI Forge Hackathon",
                "Design AI-first solutions for healthcare, mobility, and student success.",
                new BigDecimal("699.00"),
                140,
                aiml,
                LocalDateTime.of(2026, 8, 22, 10, 0),
                aimlResearch,
                "AIML Research Block",
                EventType.HACKATHON
            );
        }

        // General workshop with default ₹200 price
        Department ds = departmentRepository.findByNameIgnoreCase("DS").orElse(null);
        if (ds != null) {
            seedEvent(
                "Data Science Bootcamp",
                "Hands-on workshop covering pandas, visualization, and ML pipelines.",
                DEFAULT_PRICE,   // ← ₹200 default
                60,
                ds,
                LocalDateTime.of(2026, 6, 10, 10, 0),
                generalHall,
                "General Hall",
                EventType.WORKSHOP
            );
        }

        log.info("Database seeding complete.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Creates an ADMIN user with BCrypt-hashed password. */
    private void seedAdmin(String name, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            log.info("Admin '{}' already exists — skipping.", email);
            return;
        }
        // FIX: BCryptPasswordEncoder ensures admin password is always hashed,
        // regardless of any future PasswordEncoder bean changes.
        String hashed = new BCryptPasswordEncoder().encode(rawPassword);
        userRepository.save(
            User.builder()
                .name(name)
                .email(email)
                .password(hashed)
                .role(Role.ADMIN)   // stored as "ADMIN"; CustomUserDetailsService
                                    // adds "ROLE_" prefix → "ROLE_ADMIN"
                .department(null)   // admins are not tied to a department
                .build()
        );
        log.info("  ✓ Admin '{}' created.", email);
    }

    /** Creates a non-admin user using the injected PasswordEncoder bean. */
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

    /** Creates a Venue if one with the same roomName+building doesn't exist. */
    private void seedVenue(String roomName, String building, int capacity) {
        if (!venueRepository.existsByRoomNameAndBuilding(roomName, building)) {
            venueRepository.save(
                Venue.builder()
                    .roomName(roomName)
                    .building(building)
                    .capacity(capacity)
                    .build()
            );
            log.info("  ✓ Venue '{} / {}' created.", roomName, building);
        }
    }

    /**
     * Creates an event if no event with the same title already exists.
     *
     * FIX — Venue/Price logic:
     *   • price defaults to ₹200 if null
     *   • venueEntity FK is set so the event has an assigned Venue
     *   • availableSeats is initialised to maxSeats (so seat tracking works)
     */
    private void seedEvent(String title, String description, BigDecimal price,
                           int maxSeats, Department department,
                           LocalDateTime date, Venue venueEntity,
                           String venueDisplayName, EventType type) {

        boolean exists = eventRepository.findAll().stream()
                .anyMatch(e -> e.getTitle().equalsIgnoreCase(title));
        if (exists) {
            return;
        }

        // FIX: default price = ₹200 when null
        BigDecimal effectivePrice = (price == null) ? DEFAULT_PRICE : price;

        eventRepository.save(
            Event.builder()
                .title(title)
                .description(description)
                .type(type)
                .price(effectivePrice)          // ← always non-null
                .maxSeats(maxSeats)
                .availableSeats(maxSeats)       // ← tracks ticket sales from full capacity
                .date(date)
                .venue(venueDisplayName)        // legacy display string
                .venueEntity(venueEntity)       // FIX: FK to venues table
                .department(department)
                .build()
        );
        log.info("  ✓ Event '{}' (price=₹{}, seats={}) created.", title, effectivePrice, maxSeats);
    }
}
