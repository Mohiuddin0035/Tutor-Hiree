package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class UserRequest {
    private String name;
    private String email;
    private LocalDateTime emailVerified;
    private String image;
    private String password;
    private String role;
    private String profileId;
}
