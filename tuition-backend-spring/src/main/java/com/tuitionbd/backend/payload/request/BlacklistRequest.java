package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class BlacklistRequest {
    private String phone;
    private String name;
    private String email;
    private String role;
    private String reason;
}
