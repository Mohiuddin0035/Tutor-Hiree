package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.entity.TuitionJob;
import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.entity.Profile;
import com.tuitionbd.backend.repository.TuitionJobRepository;
import com.tuitionbd.backend.repository.UserRepository;
import com.tuitionbd.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TuitionJobRepository tuitionJobRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/jobs")
    public List<TuitionJob> getAllJobs() {
        return tuitionJobRepository.findAll();
    }

    @DeleteMapping("/user/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted");
    }

    @GetMapping("/verify")
    public ResponseEntity<?> getVerify() {
        List<Profile> pendingProfiles = profileRepository.findAll().stream()
                .filter(p -> p.getUser() != null && "TUTOR".equals(p.getUser().getRole()) && "UNVERIFIED".equals(p.getVerificationStatus()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(pendingProfiles);
    }

    @PatchMapping("/verify")
    public ResponseEntity<?> updateVerify(@RequestBody java.util.Map<String, String> request) {
        String profileId = request.get("profileId");
        String status = request.get("status");
        String rejectionReason = request.get("rejectionReason");

        return profileRepository.findById(profileId).map(profile -> {
            profile.setVerificationStatus(status);
            if ("REJECTED".equals(status)) {
                profile.setRejectionReason(rejectionReason);
            }
            profileRepository.save(profile);
            return ResponseEntity.ok("Verification status updated successfully");
        }).orElse(ResponseEntity.badRequest().body("Profile not found"));
    }

    @GetMapping("/profiles")
    public ResponseEntity<?> getProfiles() {
        return ResponseEntity.ok(profileRepository.findAll());
    }

    @PatchMapping("/profiles")
    public ResponseEntity<?> updateProfileStatus(@RequestBody java.util.Map<String, Object> request) {
        String profileId = (String) request.get("profileId");
        Boolean isActive = (Boolean) request.get("is_active");
        Boolean reactivationRequested = (Boolean) request.get("reactivationRequested");

        return profileRepository.findById(profileId).map(profile -> {
            if (isActive != null) {
                profile.setIsActive(isActive);
            }
            if (reactivationRequested != null) {
                profile.setReactivationRequested(reactivationRequested);
            }
            profileRepository.save(profile);
            return ResponseEntity.ok("Profile status updated successfully");
        }).orElse(ResponseEntity.badRequest().body("Profile not found"));
    }

    @GetMapping("/blacklist")
    public ResponseEntity<?> getBlacklist() {
        return ResponseEntity.ok(java.util.List.of());
    }

    @GetMapping("/search/user")
    public ResponseEntity<?> searchUser(@RequestParam(required = false) String registration_number) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/search/tuition")
    public ResponseEntity<?> searchTuition(@RequestParam(required = false) String tuition_id) {
        return ResponseEntity.ok(null);
    }
}
