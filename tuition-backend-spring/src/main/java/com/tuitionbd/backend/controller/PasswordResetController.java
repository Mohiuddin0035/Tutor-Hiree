package com.tuitionbd.backend.controller;

import org.springframework.http.ResponseEntity;
import com.tuitionbd.backend.payload.request.PasswordResetRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tuitionbd.backend.repository.PasswordResetRepository;

@RestController
@RequestMapping("/api/passwordresets")
public class PasswordResetController {

    @Autowired
    private PasswordResetRepository passwordResetRepository;



    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return passwordResetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody PasswordResetRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody PasswordResetRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        passwordResetRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

}
