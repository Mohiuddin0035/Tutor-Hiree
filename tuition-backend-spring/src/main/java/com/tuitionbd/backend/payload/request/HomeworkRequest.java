package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class HomeworkRequest {
    private String jobId;
    private String tutorId;
    private String progressUpdateId;
    private String title;
    private String description;
    private String subject;
    private LocalDateTime assignedDate;
    private LocalDateTime dueDate;
    private String status;
    private LocalDateTime completedAt;
    private String tutorRemarks;
}
