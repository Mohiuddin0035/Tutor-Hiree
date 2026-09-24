package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.ProgressUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressUpdateRepository extends JpaRepository<ProgressUpdate, String> {
    List<ProgressUpdate> findByJobId(String jobId);
    List<ProgressUpdate> findByTutorId(String tutorId);
    List<ProgressUpdate> findByGuardianId(String guardianId);
}
