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
        
        int baseMin = 2000;
        int baseMax = 3000;
        
        switch (classLevel) {
            case "Class 1-5": baseMin = 1000; baseMax = 1500; break;
            case "Class 6-8": baseMin = 1500; baseMax = 2500; break;
            case "SSC (Class 9-10)": baseMin = 2500; baseMax = 3500; break;
            case "HSC (Class 11-12)": baseMin = 4000; baseMax = 5500; break;
            case "O/A Levels": baseMin = 6000; baseMax = 8000; break;
            case "Admission Test": baseMin = 8000; baseMax = 12000; break;
        }

        double multiplier = 1.0;
        if (location.equals("Gulshan") || location.equals("Banani") || location.equals("Dhanmondi") || location.equals("Bashundhara")) {
            multiplier = 1.5;
        } else if (location.equals("Uttara") || location.equals("Lalmatia")) {
            multiplier = 1.2;
        }

        int minSalary = (int) ((baseMin + (days * 400)) * multiplier);
        int maxSalary = (int) ((baseMax + (days * 600)) * multiplier);

        // Round to nearest 500
        minSalary = Math.round(minSalary / 500.0f) * 500;
        maxSalary = Math.round(maxSalary / 500.0f) * 500;

        Map<String, Object> data = new HashMap<>();
        data.put("minSalary", minSalary);
        data.put("maxSalary", maxSalary);
        data.put("tutorDensity", (int)(Math.random() * 50) + 10);
        data.put("demandIndex", multiplier > 1.2 ? "critical" : (multiplier > 1.0 ? "high" : "moderate"));
        data.put("matchTime", multiplier > 1.2 ? "Within 48 Hours" : "Within 24 Hours");
        return ResponseEntity.ok(data);
    }
}
