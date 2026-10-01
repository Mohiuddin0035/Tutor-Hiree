package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.payload.request.HomeworkRequest;
import org.springframework.http.ResponseEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tuitionbd.backend.repository.HomeworkRepository;

@RestController
@RequestMapping("/api/homeworks")
public class HomeworkController {

    @Autowired
    private HomeworkRepository homeworkRepository;



    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return homeworkRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody HomeworkRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody HomeworkRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        homeworkRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

}
