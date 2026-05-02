package com.example.studentclubbooking.security;

import com.example.studentclubbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * CustomUserDetailsService — loads users from the `users` table for Spring Security.
 *
 * ── ROLE_ prefix contract ────────────────────────────────────────────────────
 * The Role enum stores bare values: ADMIN, STUDENT, FACULTY.
 *
 * We use SimpleGrantedAuthority and manually prepend "ROLE_" so the mapping is
 * explicit and visible — no magic from UserBuilder.roles():
 *
 *   "ADMIN"   → new SimpleGrantedAuthority("ROLE_ADMIN")
 *   "STUDENT" → new SimpleGrantedAuthority("ROLE_STUDENT")
 *   "FACULTY" → new SimpleGrantedAuthority("ROLE_FACULTY")
 *
 * SecurityConfig uses .hasRole("ADMIN"), which internally checks for the
 * authority "ROLE_ADMIN" — so the two sides always match.
 *
 * ✅ Correct:  SimpleGrantedAuthority("ROLE_ADMIN")  ← what we do here
 * ❌ Wrong:    SimpleGrantedAuthority("ADMIN")        → 403 on /api/admin/** (missing prefix)
 * ❌ Wrong:    .roles("ROLE_ADMIN")                   → "ROLE_ROLE_ADMIN" (double prefix, also 403)
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Service("customUserDetailsService")
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        com.example.studentclubbooking.model.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found with email: " + email));

        // FIX: Map the database role to a SimpleGrantedAuthority with explicit
        // "ROLE_" prefix.  e.g. Role.ADMIN.name() = "ADMIN" → "ROLE_ADMIN"
        // This is what SecurityConfig.hasRole("ADMIN") expects.
        String authority = "ROLE_" + user.getRole().name();

        return new User(
                user.getEmail(),
                user.getPassword(),   // BCrypt-encoded from DB
                List.of(new SimpleGrantedAuthority(authority))
        );
    }
}
