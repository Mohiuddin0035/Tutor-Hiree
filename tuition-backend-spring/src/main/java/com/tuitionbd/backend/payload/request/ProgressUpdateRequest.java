package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class ProgressUpdateRequest {
    private String jobId;
    private String tutorId;
    private String guardianId;
    private String type;
    private String title;
    private String description;
    private LocalDateTime sessionDate;
    private Integer rating;
    private String attachmentUrlsId;
    private Boolean seen;
    private LocalDateTime seenAt;
    private String commentsId;
    private String homeworksId;
}
