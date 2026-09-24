package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class PaymentRequest {
    private Integer amount;
    private String status;
    private String type;
    private String trxId;
    private String jobId;
    private String tutorId;
    private String payerRole;
    private LocalDateTime refundRequestedAt;
    private String refundStatus;
    private String refundReason;
}
