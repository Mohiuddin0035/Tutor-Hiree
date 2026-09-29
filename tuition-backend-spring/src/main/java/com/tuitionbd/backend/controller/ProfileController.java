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

    @Autowired
    private com.tuitionbd.backend.repository.TuitionJobRepository tuitionJobRepository;

    @Autowired
    private com.tuitionbd.backend.repository.PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<?> getMyProfile(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        com.tuitionbd.backend.security.services.UserDetailsImpl userDetails = 
            (com.tuitionbd.backend.security.services.UserDetailsImpl) authentication.getPrincipal();
            
        Optional<Profile> profileOpt = profileRepository.findByUserId(userDetails.getId());
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Profile profile = profileOpt.get();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        
        // Basic profile fields
        response.put("id", profile.getId());
        response.put("tutorSeq", profile.getTutorSeq());
        response.put("latitude", profile.getLatitude());
        response.put("longitude", profile.getLongitude());
        response.put("actualLatitude", profile.getActualLatitude());
        response.put("actualLongitude", profile.getActualLongitude());
        
        // Fetch jobs for this tutor
        java.util.List<com.tuitionbd.backend.entity.TuitionJob> jobs = tuitionJobRepository.findByTutorId(userDetails.getId());
        response.put("tutorJobs", jobs);
        
        // Pass role so frontend can know
        response.put("role", userDetails.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("TUTOR"));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getProfileByUserId(@PathVariable String userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Profile profile = profileOpt.get();
        
        // Build a response map with all profile fields
        java.util.Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("id", profile.getId());
        response.put("tutorSeq", profile.getTutorSeq());
        response.put("phone", profile.getPhone());
        response.put("address", profile.getAddress());
        response.put("bio", profile.getBio());
        response.put("education", profile.getEducation());
        response.put("pendingBio", profile.getPendingBio());
        response.put("pendingEducation", profile.getPendingEducation());
        response.put("verificationStatus", profile.getVerificationStatus());
        response.put("nidImageUrl", profile.getNidImageUrl());
        response.put("universityIdImageUrl", profile.getUniversityIdImageUrl());
        response.put("selfieImageUrl", profile.getSelfieImageUrl());
        response.put("gender", profile.getGender());
        response.put("preferableTime", profile.getPreferableTime());
        response.put("is_active", profile.getIsActive());
        response.put("reactivationRequested", profile.getReactivationRequested());
        response.put("studentClass", profile.getStudentClass());
        response.put("hoursRequired", profile.getHoursRequired());
        response.put("tutorGenderPreference", profile.getTutorGenderPreference());
        response.put("salary", profile.getSalary());
        response.put("numberOfChildren", profile.getNumberOfChildren());
        response.put("latitude", profile.getLatitude());
        response.put("longitude", profile.getLongitude());
        response.put("approxLatitude", profile.getApproxLatitude());
        response.put("approxLongitude", profile.getApproxLongitude());
        response.put("actualLatitude", profile.getActualLatitude());
        response.put("actualLongitude", profile.getActualLongitude());
        response.put("rejectionReason", profile.getRejectionReason());
        response.put("rejectedAt", profile.getRejectedAt());
        
        // Include tutor jobs so the dashboard can show them
        java.util.List<com.tuitionbd.backend.entity.TuitionJob> jobs = tuitionJobRepository.findByTutorId(userId);
        response.put("tutorJobs", jobs);
        
        // Include role
        if (profile.getUser() != null) {
            String role = profile.getUser().getRole();
            response.put("role", role);
            
            if ("PARENT".equals(role)) {
                java.util.List<com.tuitionbd.backend.entity.TuitionJob> parentJobs = tuitionJobRepository.findByParentId(userId);
                java.util.List<java.util.Map<String, Object>> assignedTutors = new java.util.ArrayList<>();
                java.util.List<java.util.Map<String, Object>> paymentHistory = new java.util.ArrayList<>();
                
                for (com.tuitionbd.backend.entity.TuitionJob j : parentJobs) {
                    java.util.List<com.tuitionbd.backend.entity.Payment> jobPayments = paymentRepository.findByJobId(j.getId());
                    for (com.tuitionbd.backend.entity.Payment p : jobPayments) {
                        if ("PROGRESS_FEE".equals(p.getType())) {
                            java.util.Map<String, Object> pInfo = new java.util.HashMap<>();
                            pInfo.put("id", p.getId());
                            pInfo.put("transactionId", p.getTrxId());
                            pInfo.put("amount", p.getAmount());
                            pInfo.put("status", p.getStatus());
                            pInfo.put("type", p.getType());
                            pInfo.put("createdAt", p.getCreatedAt());
                            paymentHistory.add(pInfo);
                        }
                    }

                    if (("ASSIGNED".equals(j.getStatus()) || "CONFIRMED".equals(j.getStatus()) || "PAYMENT_PENDING".equals(j.getStatus())) && j.getTutor() != null) {
                        java.util.Map<String, Object> tInfo = new java.util.HashMap<>();
                        tInfo.put("jobId", j.getId());
                        tInfo.put("jobTitle", j.getTitle());
                        tInfo.put("subject", j.getSubject());
                        tInfo.put("commissionPaid", j.getCommissionPaid());
                        tInfo.put("progressUnlocked", j.getTutorDetailsReleased() != null ? j.getTutorDetailsReleased() : false);
                        
                        boolean progressFeePending = paymentRepository.findByJobId(j.getId()).stream()
                            .anyMatch(p -> "PROGRESS_FEE".equals(p.getType()) && "PENDING".equals(p.getStatus()));
                        tInfo.put("progressFeePending", progressFeePending);

                        tInfo.put("commissionAmount", j.getCommissionAmount());
                        tInfo.put("status", j.getStatus());
                        
                        Optional<Profile> tutorProfileOpt = profileRepository.findByUserId(j.getTutor().getId());
                        if (tutorProfileOpt.isPresent()) {
                            Profile tp = tutorProfileOpt.get();
                            tInfo.put("id", tp.getUser() != null ? tp.getUser().getId() : null);
                            tInfo.put("tutorSeq", tp.getTutorSeq());
                            tInfo.put("education", tp.getEducation());
                            if (tp.getUser() != null) {
                                tInfo.put("name", tp.getUser().getName());
                                tInfo.put("email", tp.getUser().getEmail());
                            }
                            tInfo.put("phone", tp.getPhone());
                        }
                        assignedTutors.add(tInfo);
                    }
                }
                response.put("assignedTutors", assignedTutors);
                response.put("paymentHistory", paymentHistory);
            }
        }
        
        return ResponseEntity.ok(response);
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
        
        if ("PARENT".equals(userOptional.get().getRole())) {
            profile.setVerificationStatus("VERIFIED");
        }
        
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