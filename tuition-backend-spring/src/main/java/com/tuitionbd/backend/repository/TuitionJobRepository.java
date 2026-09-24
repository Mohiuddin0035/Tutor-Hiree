package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.TuitionJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TuitionJobRepository extends JpaRepository<TuitionJob, String> {
    List<TuitionJob> findByParentId(String parentId);
    List<TuitionJob> findByTutorId(String tutorId);
}
