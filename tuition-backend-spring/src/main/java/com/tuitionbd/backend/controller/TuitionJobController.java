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

    @Autowired
    private com.tuitionbd.backend.repository.PaymentRepository paymentRepository;

    @GetMapping
    public List<TuitionJob> getAllJobs(@RequestParam(required = false) String parentId) {
        if (parentId != null) {
            return tuitionJobRepository.findByParentId(parentId);
        }
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
        if (job.getStatus() == null) {
            job.setStatus("PENDING");
        }
        
        if (job.getLatitude() != null && job.getLongitude() != null && job.getApproxLatitude() == null) {
            // Apply a random offset of roughly up to 200-300 meters for privacy
            double latOffset = (Math.random() * 0.005) - 0.0025;
            double lngOffset = (Math.random() * 0.005) - 0.0025;
            job.setApproxLatitude(job.getLatitude() + latOffset);
            job.setApproxLongitude(job.getLongitude() + lngOffset);
        }
        
        TuitionJob savedJob = tuitionJobRepository.save(job);
        return ResponseEntity.ok(savedJob);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody TuitionJobRequest request) {
        Optional<TuitionJob> optionalJob = tuitionJobRepository.findById(id);
        if (optionalJob.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TuitionJob job = optionalJob.get();
        if (request.getStatus() != null) {
            job.setStatus(request.getStatus());
        }
        if (request.getTutorRequirement() != null) {
            job.setTutorRequirement(request.getTutorRequirement());
        }
        tuitionJobRepository.save(job);
        return ResponseEntity.ok(job);
    }

    @PatchMapping
    public ResponseEntity<?> patchJobAction(@RequestBody java.util.Map<String, String> payload) {
        String jobId = payload.get("jobId");
        String tutorId = payload.get("tutorId");
        String action = payload.get("action");

        if (jobId == null || action == null) {
            return ResponseEntity.badRequest().body("Missing jobId or action");
        }

        // Parent requests a tutor
        if ("request".equals(action) && tutorId != null) {
            java.util.Optional<TuitionJob> optionalJob = tuitionJobRepository.findById(jobId);
            java.util.Optional<User> optionalTutor = userRepository.findById(tutorId);

            if (optionalJob.isPresent() && optionalTutor.isPresent()) {
                TuitionJob job = optionalJob.get();
                job.setTutor(optionalTutor.get());
                job.setStatus("REQUESTED");
                tuitionJobRepository.save(job);
                return ResponseEntity.ok(job);
            }
            return ResponseEntity.badRequest().body("Job or tutor not found");
        }

        // Tutor accepts a request
        if ("accept".equals(action)) {
            java.util.Optional<TuitionJob> optionalJob = tuitionJobRepository.findById(jobId);
            if (optionalJob.isPresent()) {
                TuitionJob job = optionalJob.get();
                job.setStatus("ACCEPTED");
                job.setCommissionAmount((int) Math.ceil(job.getSalary() * 0.10));
                tuitionJobRepository.save(job);
                return ResponseEntity.ok(job);
            }
            return ResponseEntity.badRequest().body("Job not found");
        }

        // Tutor pays commission
        if ("pay-commission".equals(action)) {
            java.util.Optional<TuitionJob> optionalJob = tuitionJobRepository.findById(jobId);
            if (optionalJob.isPresent()) {
                TuitionJob job = optionalJob.get();
                // Instead of confirming immediately, we just create the payment as PENDING
                job.setStatus("PAYMENT_PENDING");
                tuitionJobRepository.save(job);
                
                String trxId = payload.get("trxId");
                com.tuitionbd.backend.entity.Payment payment = new com.tuitionbd.backend.entity.Payment();
                payment.setAmount(job.getCommissionAmount() != null ? job.getCommissionAmount() : 0);
                payment.setStatus("PENDING");
                payment.setType("COMMISSION");
                payment.setTrxId(trxId != null ? trxId : "UNKNOWN-" + System.currentTimeMillis());
                payment.setJob(job);
                payment.setTutorId(job.getTutor() != null ? job.getTutor().getId() : null);
                payment.setPayerRole("TUTOR");
                paymentRepository.save(payment);
                
                return ResponseEntity.ok(job);
            }
            return ResponseEntity.badRequest().body("Job not found");
        }
        
        // Parent pays for progress update
        if ("pay-progress".equals(action)) {
            java.util.Optional<TuitionJob> optionalJob = tuitionJobRepository.findById(jobId);
            if (optionalJob.isPresent()) {
                TuitionJob job = optionalJob.get();
                
                String trxId = payload.get("trxId");
                com.tuitionbd.backend.entity.Payment payment = new com.tuitionbd.backend.entity.Payment();
                payment.setAmount(500); // fixed 500 BDT
                payment.setStatus("PENDING");
                payment.setType("PROGRESS_FEE");
                payment.setTrxId(trxId != null ? trxId : "UNKNOWN-" + System.currentTimeMillis());
                payment.setJob(job);
                payment.setPayerRole("PARENT");
                paymentRepository.save(payment);
                
                return ResponseEntity.ok(job);
            }
            return ResponseEntity.badRequest().body("Job not found");
        }

        return ResponseEntity.badRequest().body("Unknown action: " + action);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        tuitionJobRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}