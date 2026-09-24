package com.tuitionbd.backend.controller;
import com.tuitionbd.backend.payload.request.ReviewRequest;


import com.tuitionbd.backend.entity.Review;
import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.repository.ReviewRepository;
import com.tuitionbd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/target/{targetId}")
    public List<Review> getReviewsForTarget(@PathVariable String targetId) {
        return reviewRepository.findByTargetId(targetId);
    }

    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Review reviewRequest, @RequestParam String authorId, @RequestParam String targetId) {
        Optional<User> authorOpt = userRepository.findById(authorId);
        Optional<User> targetOpt = userRepository.findById(targetId);
        
        if (authorOpt.isEmpty() || targetOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Author or Target user not found");
        }
        
        reviewRequest.setAuthor(authorOpt.get());
        reviewRequest.setTarget(targetOpt.get());
        
        Review savedReview = reviewRepository.save(reviewRequest);
        return ResponseEntity.ok(savedReview);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return reviewRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody ReviewRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ReviewRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        reviewRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}