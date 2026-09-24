package com.tuitionbd.backend.controller;
import com.tuitionbd.backend.payload.request.TuitionJobRequest;


import com.tuitionbd.backend.entity.TuitionJob;
import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.repository.TuitionJobRepository;
import com.tuitionbd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/jobs")
public class TuitionJobController {

    @Autowired
    private TuitionJobRepository tuitionJobRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<TuitionJob> getAllJobs() {
        return tuitionJobRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TuitionJob> getJobById(@PathVariable String id) {
        Optional<TuitionJob> job = tuitionJobRepository.findById(id);
        return job.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('PARENT') or hasRole('ADMIN')")
    public ResponseEntity<?> createJob(@RequestBody TuitionJob job, @RequestParam String parentId) {
        Optional<User> parent = userRepository.findById(parentId);
        if (parent.isEmpty()) {
            return ResponseEntity.badRequest().body("Parent not found");
        }
        job.setParent(parent.get());
        TuitionJob savedJob = tuitionJobRepository.save(job);
        return ResponseEntity.ok(savedJob);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return tuitionJobRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody TuitionJobRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody TuitionJobRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        tuitionJobRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}