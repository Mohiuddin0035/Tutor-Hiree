package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.entity.TuitionJob;
import com.tuitionbd.backend.repository.PaymentRepository;
import com.tuitionbd.backend.repository.TuitionJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reset")
public class ResetController {

    @Autowired
    private TuitionJobRepository tuitionJobRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping("/jobs")
    public ResponseEntity<?> resetJobs() {
        paymentRepository.deleteAll(); // Delete all payments so they don't interfere
        List<TuitionJob> jobs = tuitionJobRepository.findAll();
        for (TuitionJob job : jobs) {
            if ("CONFIRMED".equals(job.getStatus()) || "PAYMENT_PENDING".equals(job.getStatus())) {
                job.setStatus("ASSIGNED");
                job.setCommissionPaid(false);
                job.setLocationUnlocked(false);
                job.setTutorDetailsReleased(false);
                tuitionJobRepository.save(job);
            }
        }
        return ResponseEntity.ok("Jobs reset to ASSIGNED and payments cleared.");
    }
}
