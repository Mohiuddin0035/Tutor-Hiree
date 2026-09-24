package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class GuardianCommentRequest {
    private String progressUpdateId;
    private String guardianId;
    private String comment;
}
