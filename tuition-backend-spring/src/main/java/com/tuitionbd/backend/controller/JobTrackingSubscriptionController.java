package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.payload.request.JobTrackingSubscriptionRequest;
import org.springframework.http.ResponseEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tuitionbd.backend.repository.JobTrackingSubscriptionRepository;

@RestController
@RequestMapping("/api/jobtrackingsubscriptions")
public class JobTrackingSubscriptionController {

    @Autowired
    private JobTrackingSubscriptionRepository jobTrackingSubscriptionRepository;



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
