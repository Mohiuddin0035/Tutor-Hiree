package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.payload.request.PaymentRequest;
import com.tuitionbd.backend.entity.Payment;
import com.tuitionbd.backend.entity.TuitionJob;
import com.tuitionbd.backend.repository.PaymentRepository;
import com.tuitionbd.backend.repository.TuitionJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TuitionJobRepository tuitionJobRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(paymentRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return paymentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody PaymentRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approvePayment(@PathVariable String id) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            payment.setStatus("COMPLETED");
            paymentRepository.save(payment);

            TuitionJob job = payment.getJob();
            if (job != null) {
                if ("PROGRESS_FEE".equals(payment.getType())) {
                    job.setTutorDetailsReleased(true);
                } else {
                    job.setCommissionPaid(true);
                    job.setStatus("CONFIRMED");
                }
                tuitionJobRepository.save(job);
            }
            return ResponseEntity.ok(payment);
        }
        return ResponseEntity.badRequest().body("Payment not found");
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectPayment(@PathVariable String id) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            payment.setStatus("REJECTED");
            paymentRepository.save(payment);

            TuitionJob job = payment.getJob();
            if (job != null) {
                job.setStatus("ASSIGNED"); // Revert back to ASSIGNED so they can retry
                tuitionJobRepository.save(job);
            }
            return ResponseEntity.ok(payment);
        }
        return ResponseEntity.badRequest().body("Payment not found");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        paymentRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}
