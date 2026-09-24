package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.JobTrackingSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobTrackingSubscriptionRepository extends JpaRepository<JobTrackingSubscription, String> {
    
    Optional<JobTrackingSubscription> findTopByJobIdAndGuardianIdOrderByValidUntilDesc(String jobId, String guardianId);
    
    boolean existsByJobIdAndGuardianIdAndStatus(String jobId, String guardianId, String status);
}
