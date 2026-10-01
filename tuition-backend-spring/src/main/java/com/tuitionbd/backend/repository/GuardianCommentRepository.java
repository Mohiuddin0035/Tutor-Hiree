package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.GuardianComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuardianCommentRepository extends JpaRepository<GuardianComment, String> {
    List<GuardianComment> findByProgressUpdateId(String progressUpdateId);
}
