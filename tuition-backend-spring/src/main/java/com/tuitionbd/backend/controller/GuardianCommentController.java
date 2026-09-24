package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.payload.request.GuardianCommentRequest;
import org.springframework.http.ResponseEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tuitionbd.backend.repository.GuardianCommentRepository;

@RestController
@RequestMapping("/api/guardiancomments")
public class GuardianCommentController {

    @Autowired
    private GuardianCommentRepository guardianCommentRepository;



    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return guardianCommentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody GuardianCommentRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody GuardianCommentRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        guardianCommentRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

}
