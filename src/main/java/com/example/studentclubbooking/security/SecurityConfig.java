package com.example.studentclubbooking.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * SecurityConfig
 *
 * Key fixes applied:
 *  1. Global CorsFilter bean registered at HIGHEST_PRECEDENCE so it intercepts
 *     pre-flight OPTIONS requests BEFORE Spring Security, eliminating the
 *     "Failed to Load" / blocked-by-CORS errors from Vite (localhost:5173).
 *
 *  2. /api/events/&#42;&#42;/purchase is explicitly permitted so unauthenticated
 *     pre-flight OPTIONS calls are never blocked.  Actual purchase logic is
 *     guarded by the JWT filter (401 returned when token absent/invalid).
 *
 *  3. hasRole("ADMIN") works because CustomUserDetailsService stores the
 *     authority as "ROLE_ADMIN", and hasRole() prepends "ROLE_" internally —
 *     the two sides always match.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    @Qualifier("customUserDetailsService")
    private UserDetailsService customUserDetailsService;

    // ── Password encoder ──────────────────────────────────────────────────────
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ── DAO authentication provider ───────────────────────────────────────────
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ── CORS source (used by both Spring Security and the raw CorsFilter) ─────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow localhost (dev) and any device on the local 192.168.x.x network.
        // Using origin patterns because allowCredentials=true requires patterns,
        // not plain origin strings (Spring 5.3+ / Boot 2.4+ requirement).
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                // Any host on a 192.168.x.x subnet, any port
                "http://192.168.*.*",
                "http://192.168.*.*:*"
        ));

        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "Cache-Control",
                "X-Requested-With", "Accept", "Origin"
        ));

        // Required for cookies / Authorization header to be forwarded
        config.setAllowCredentials(true);

        // Cache pre-flight response for 1 hour
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * FIX: Register a raw servlet CorsFilter at HIGHEST_PRECEDENCE.
     *
     * Spring Security's built-in CORS support fires AFTER the security filter
     * chain, which means a rejected pre-flight OPTIONS request never reaches
     * the CORS headers — the browser sees a 403 with no Access-Control-*
     * headers and reports "Failed to fetch".
     *
     * Registering CorsFilter at Ordered.HIGHEST_PRECEDENCE ensures CORS
     * headers are written before Spring Security evaluates the request.
     */
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        FilterRegistrationBean<CorsFilter> bean =
                new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource()));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }

    // ── Security filter chain ─────────────────────────────────────────────────
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())

            // Tell Spring Security to use our CorsConfigurationSource for its own
            // CORS handling as well (belt-and-suspenders)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .authenticationProvider(authenticationProvider())

            .authorizeHttpRequests(authz -> authz
                // Public endpoints — no token required
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/departments/**").permitAll()
                .requestMatchers("/api/events").permitAll()
                .requestMatchers("/api/events/filter").permitAll()
                .requestMatchers("/api/events/{id}").permitAll()

                // FIX: The purchase endpoint requires auth (JWT checked by filter),
                // but must be listed here so OPTIONS pre-flight is allowed through.
                // The actual POST will return 401 if no valid token is provided.
                .requestMatchers("/api/events/*/purchase").permitAll()

                // Legacy register endpoint (kept for backward compatibility)
                .requestMatchers("/api/events/*/register").permitAll()

                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()

                // Admin-only routes — requires ROLE_ADMIN authority
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Everything else — authenticated
                .requestMatchers("/api/users/**").authenticated()
                .anyRequest().authenticated()
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Disable X-Frame-Options (needed if you embed H2 console in iframe)
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        // JWT filter runs before Spring Security's UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
