package com.tuitionbd.backend.controller;
import com.tuitionbd.backend.payload.request.ProgressUpdateRequest;


import com.tuitionbd.backend.entity.Homework;
import com.tuitionbd.backend.entity.ProgressUpdate;
import com.tuitionbd.backend.entity.TuitionJob;
import com.tuitionbd.backend.entity.User;
import com.tuitionbd.backend.repository.HomeworkRepository;
import com.tuitionbd.backend.repository.ProgressUpdateRepository;
import com.tuitionbd.backend.repository.TuitionJobRepository;
import com.tuitionbd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/progress")
public class ProgressUpdateController {

    @Autowired
    private ProgressUpdateRepository progressUpdateRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;
    
    @Autowired
    private TuitionJobRepository tuitionJobRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.tuitionbd.backend.service.SubscriptionService subscriptionService;

    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> getProgressByJobId(@PathVariable String jobId, @RequestParam(required = false) String guardianId) {
        List<ProgressUpdate> updates = progressUpdateRepository.findByJobId(jobId);
        
        if (guardianId != null) {
            boolean hasSubscription = subscriptionService.hasActiveSubscription(jobId, guardianId);
            if (!hasSubscription) {
                for (ProgressUpdate update : updates) {
                    update.setDescription("Premium content. Please subscribe to view detailed progress.");
                    update.setComments(null);
                    update.setHomeworks(null);
                    update.setAttachmentUrls(null);
                }
            }
        }
        
        return ResponseEntity.ok(updates);
    }

    @PostMapping("/job/{jobId}")
    public ResponseEntity<?> createProgressUpdate(@PathVariable String jobId, @RequestBody ProgressUpdate updateRequest, @RequestParam String tutorId) {
        Optional<TuitionJob> jobOpt = tuitionJobRepository.findById(jobId);
        Optional<User> tutorOpt = userRepository.findById(tutorId);
        
        if (jobOpt.isEmpty() || tutorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Job or Tutor not found");
        }
        
        TuitionJob job = jobOpt.get();
        updateRequest.setJob(job);
        updateRequest.setTutor(tutorOpt.get());
        updateRequest.setGuardian(job.getParent());
        
        ProgressUpdate savedUpdate = progressUpdateRepository.save(updateRequest);
        return ResponseEntity.ok(savedUpdate);
    }
    
    @GetMapping("/homework/job/{jobId}")
    public ResponseEntity<?> getHomeworkByJobId(@PathVariable String jobId, @RequestParam(required = false) String guardianId) {
        List<Homework> homeworks = homeworkRepository.findByJobId(jobId);
        
        if (guardianId != null) {
            boolean hasSubscription = subscriptionService.hasActiveSubscription(jobId, guardianId);
            if (!hasSubscription) {
                for (Homework hw : homeworks) {
                    hw.setDescription("Premium content. Please subscribe to view homework details.");
                    hw.setTutorRemarks("Hidden");
                }
            }
        }
        
        return ResponseEntity.ok(homeworks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return progressUpdateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody ProgressUpdateRequest request) {
        return ResponseEntity.ok("Saved");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ProgressUpdateRequest request) {
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        progressUpdateRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}