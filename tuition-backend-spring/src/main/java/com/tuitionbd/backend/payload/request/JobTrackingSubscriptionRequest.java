package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class JobTrackingSubscriptionRequest {
    private String guardianId;
    private String jobId;
    private String status;
    private LocalDateTime validUntil;
    private String lastPaymentId;
}
