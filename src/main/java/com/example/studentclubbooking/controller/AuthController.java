package com.example.studentclubbooking.controller;

import com.example.studentclubbooking.dto.AuthRequest;
import com.example.studentclubbooking.dto.AuthResponse;
import com.example.studentclubbooking.dto.RegisterRequest;
import com.example.studentclubbooking.model.Department;
import com.example.studentclubbooking.model.User;
import com.example.studentclubbooking.security.JwtUtil;
import com.example.studentclubbooking.service.DepartmentService;
import com.example.studentclubbooking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserService userService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private DepartmentService departmentService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentService.getDepartmentById(request.getDepartmentId()).orElse(null);
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(request.getPassword())
                .role(request.getRole())
                .department(dept)
                .build();
        userService.registerUser(user);
        return ResponseEntity.ok(Map.of("message", "Registration successful! Please login."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);

        User user = userService.findByEmail(request.getEmail()).orElseThrow();
        return ResponseEntity.ok(new AuthResponse(token, user.getName(), user.getEmail(), user.getRole()));
    }
}
