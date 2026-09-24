package com.tuitionbd.backend.controller;
import com.tuitionbd.backend.payload.request.ProfileRequest;


import com.tuitionbd.backend.entity.Profile;
import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.repository.ProfileRepository;
import com.tuitionbd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<Profile> getProfileByUserId(@PathVariable String userId) {
        Optional<Profile> profile = profileRepository.findByUserId(userId);
        return profile.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createOrUpdateProfile(@PathVariable String userId, @RequestBody Profile profileRequest) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Profile profile = profileRepository.findByUserId(userId).orElse(new Profile());
        profile.setUser(userOptional.get());
        profile.setBio(profileRequest.getBio());
        profile.setAddress(profileRequest.getAddress());
        profile.setPhone(profileRequest.getPhone());
        profile.setEducation(profileRequest.getEducation());
        
        Profile savedProfile = profileRepository.save(profile);
        return ResponseEntity.ok(savedProfile);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return profileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody ProfileRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ProfileRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        profileRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}