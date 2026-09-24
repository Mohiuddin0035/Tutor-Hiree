package com.tuitionbd.backend.payload.request;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class ProfileRequest {
    private String userId;
    private Integer tutorSeq;
    private String phone;
    private String address;
    private String bio;
    private String education;
    private String pendingBio;
    private String pendingEducation;
    private String verificationStatus;
    private String nidImageUrl;
    private String universityIdImageUrl;
    private String selfieImageUrl;
    private String gender;
    private String preferableTime;
    private Boolean isActive;
    private Boolean reactivationRequested;
    private String studentClass;
    private String hoursRequired;
    private String tutorGenderPreference;
    private String salary;
    private String numberOfChildren;
    private Double latitude;
    private Double longitude;
    private Double approxLatitude;
    private Double approxLongitude;
    private Double actualLatitude;
    private Double actualLongitude;
    private String rejectionReason;
    private LocalDateTime rejectedAt;
}
