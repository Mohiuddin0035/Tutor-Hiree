package com.tuitionbd.backend.controller;
import com.tuitionbd.backend.payload.request.JobTrackingSubscriptionRequest;


import com.tuitionbd.backend.entity.JobTrackingSubscription;
import com.tuitionbd.backend.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private com.tuitionbd.backend.repository.JobTrackingSubscriptionRepository jobTrackingSubscriptionRepository;

    @PostMapping("/jobs/{jobId}")
    public ResponseEntity<?> subscribeToJobTracking(@PathVariable String jobId, @RequestBody Map<String, String> payload, Authentication authentication) {
        String trxId = payload.get("trxId");
        
        String guardianId = payload.get("guardianId");
        
        try {
            JobTrackingSubscription sub = subscriptionService.subscribe(jobId, guardianId, trxId);
            return ResponseEntity.ok(sub);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/jobs/{jobId}/status")
    public ResponseEntity<?> checkSubscriptionStatus(@PathVariable String jobId, @RequestParam String guardianId) {
        boolean active = subscriptionService.hasActiveSubscription(jobId, guardianId);
        return ResponseEntity.ok(Map.of("active", active));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return jobTrackingSubscriptionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody JobTrackingSubscriptionRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody JobTrackingSubscriptionRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        jobTrackingSubscriptionRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}