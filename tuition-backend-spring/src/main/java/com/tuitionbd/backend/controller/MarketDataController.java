package com.tuitionbd.backend.controller;

import com.tuitionbd.backend.repository.TuitionJobRepository;
import com.tuitionbd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/market-data")
public class MarketDataController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TuitionJobRepository tuitionJobRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalUsers = userRepository.count();
        long totalJobs = tuitionJobRepository.count();
        
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalJobs", totalJobs);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping
    public ResponseEntity<?> getMarketDataMeta() {
        Map<String, Object> data = new HashMap<>();
        data.put("locations", java.util.Arrays.asList("Banani", "Gulshan", "Dhanmondi", "Uttara", "Mirpur", "Mohammadpur", "Bashundhara", "Lalmatia", "Wari"));
        data.put("classLevels", java.util.Arrays.asList("Class 1-5", "Class 6-8", "SSC (Class 9-10)", "HSC (Class 11-12)", "O/A Levels", "Admission Test"));
        data.put("subjects", java.util.Arrays.asList("All Subjects", "Mathematics", "Physics", "Chemistry", "English Medium Science", "ICT & Computer Science", "IELTS/SAT Prep"));
        return ResponseEntity.ok(data);
    }

    @GetMapping(params = {"location", "classLevel", "subject", "days"})
    public ResponseEntity<?> getEstimates(
            @RequestParam String location,
            @RequestParam String classLevel,
            @RequestParam String subject,
            @RequestParam int days) {
        
        Map<String, Object> data = new HashMap<>();
        data.put("minSalary", 5000 + (days * 1000));
        data.put("maxSalary", 8000 + (days * 1500));
        data.put("tutorDensity", 42);
        data.put("demandIndex", "high");
        data.put("matchTime", "Within 24 Hours");
        return ResponseEntity.ok(data);
    }
}
