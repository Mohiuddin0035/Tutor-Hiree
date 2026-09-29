package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.entity.Profile;
import com.tuitionbd.backend.payload.request.LoginRequest;
import com.tuitionbd.backend.payload.request.SignupRequest;
import com.tuitionbd.backend.payload.response.JwtResponse;
import com.tuitionbd.backend.payload.response.MessageResponse;
import com.tuitionbd.backend.repository.UserRepository;
import com.tuitionbd.backend.repository.ProfileRepository;
import com.tuitionbd.backend.security.jwt.JwtUtils;
import com.tuitionbd.backend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ProfileRepository profileRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(signUpRequest.getRole() == null ? "PARENT" : signUpRequest.getRole())
                .build();

        User savedUser = userRepository.save(user);

        Profile profile = new Profile();
        profile.setUser(savedUser);
        profile.setPhone(signUpRequest.getPhone());
        profile.setAddress(signUpRequest.getAddress());
        profile.setEducation(signUpRequest.getEducation());
        profile.setBio(signUpRequest.getBio());
        profile.setLatitude(signUpRequest.getLatitude());
        profile.setLongitude(signUpRequest.getLongitude());
        profile.setActualLatitude(signUpRequest.getActualLatitude());
        profile.setActualLongitude(signUpRequest.getActualLongitude());
        profile.setGender(signUpRequest.getGender());
        profile.setPreferableTime(signUpRequest.getPreferable_time());
        profile.setNidImageUrl(signUpRequest.getNidImageUrl());
        profile.setUniversityIdImageUrl(signUpRequest.getUniversityIdImageUrl());
        profile.setSelfieImageUrl(signUpRequest.getSelfieImageUrl());

        // Default verification status
        if ("PARENT".equals(savedUser.getRole())) {
            profile.setVerificationStatus("VERIFIED");
        } else {
            profile.setVerificationStatus("UNVERIFIED");
        }

        profileRepository.save(profile);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
