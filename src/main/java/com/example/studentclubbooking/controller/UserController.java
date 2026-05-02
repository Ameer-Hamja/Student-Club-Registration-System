package com.example.studentclubbooking.controller;

import com.example.studentclubbooking.dto.RegistrationDTO;
import com.example.studentclubbooking.model.Registration;
import com.example.studentclubbooking.model.User;
import com.example.studentclubbooking.service.RegistrationService;
import com.example.studentclubbooking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RegistrationService registrationService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(new java.util.HashMap<String, Object>() {{
            put("id", user.getId());
            put("name", user.getName());
            put("email", user.getEmail());
            put("role", user.getRole());
        }});
    }

    @GetMapping("/me/events")
    public ResponseEntity<List<RegistrationDTO>> getMyEvents(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email).orElseThrow();
        List<Registration> registrations = registrationService.getUserRegistrations(user);
        List<RegistrationDTO> dtos = registrations.stream()
                .map(RegistrationDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
