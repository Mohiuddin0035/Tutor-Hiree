package com.tuitionbd.backend.service;

import com.tuitionbd.backend.entity.JobTrackingSubscription;
import com.tuitionbd.backend.entity.TuitionJob;
import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.repository.JobTrackingSubscriptionRepository;
import com.tuitionbd.backend.repository.TuitionJobRepository;
import com.tuitionbd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SubscriptionService {

    @Autowired
    private JobTrackingSubscriptionRepository subscriptionRepository;

    @Autowired
    private TuitionJobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    public boolean hasActiveSubscription(String jobId, String guardianId) {
        Optional<JobTrackingSubscription> subOpt = subscriptionRepository
                .findTopByJobIdAndGuardianIdOrderByValidUntilDesc(jobId, guardianId);
        
        if (subOpt.isPresent()) {
            JobTrackingSubscription sub = subOpt.get();
            if (sub.getStatus().equals("ACTIVE") && sub.getValidUntil().isAfter(LocalDateTime.now())) {
                return true;
            } else if (sub.getStatus().equals("ACTIVE") && sub.getValidUntil().isBefore(LocalDateTime.now())) {
                // Auto-expire
                sub.setStatus("EXPIRED");
                subscriptionRepository.save(sub);
            }
        }
        return false;
    }

    public JobTrackingSubscription subscribe(String jobId, String guardianId, String paymentId) {
        TuitionJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        User guardian = userRepository.findById(guardianId)
                .orElseThrow(() -> new RuntimeException("Guardian not found"));

        JobTrackingSubscription subscription = JobTrackingSubscription.builder()
                .job(job)
                .guardian(guardian)
                .validUntil(LocalDateTime.now().plusDays(30))
                .status("ACTIVE")
                .lastPaymentId(paymentId)
                .build();

        return subscriptionRepository.save(subscription);
    }
}
