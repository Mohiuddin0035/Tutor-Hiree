package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByTargetId(String targetId);
    List<Review> findByAuthorId(String authorId);
}
