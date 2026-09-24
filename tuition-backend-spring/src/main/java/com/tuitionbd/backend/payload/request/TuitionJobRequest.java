package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class TuitionJobRequest {
    private Integer jobSeq;
    private String title;
    private String description;
    private String subject;
    private String classLevel;
    private Integer salary;
    private String parentId;
    private String tutorId;
    private String status;
    private Double latitude;
    private Double longitude;
    private Double approxLatitude;
    private Double approxLongitude;
    private Boolean locationUnlocked;
    private Boolean tutorDetailsReleased;
    private Boolean commissionPaid;
    private Integer commissionAmount;
    private String tutorRequirement;
}
