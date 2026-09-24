package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.payload.request.BlacklistRequest;
import org.springframework.http.ResponseEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tuitionbd.backend.repository.BlacklistRepository;

@RestController
@RequestMapping("/api/blacklists")
public class BlacklistController {

    @Autowired
    private BlacklistRepository blacklistRepository;



    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return blacklistRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody BlacklistRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody BlacklistRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        blacklistRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

}
