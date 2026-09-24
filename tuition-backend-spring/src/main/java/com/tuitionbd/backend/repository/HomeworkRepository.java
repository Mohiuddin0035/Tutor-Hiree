package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, String> {
    List<Homework> findByJobId(String jobId);
    List<Homework> findByProgressUpdateId(String progressUpdateId);
}
