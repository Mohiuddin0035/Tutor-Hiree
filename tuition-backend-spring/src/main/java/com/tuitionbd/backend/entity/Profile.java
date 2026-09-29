package com.tuitionbd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(referencedColumnName = "id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("profile")
    private User user;

    @Column(unique = true, insertable = false, updatable = false, columnDefinition = "serial")
    private Integer tutorSeq;

    private String phone;
    private String address;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    private String education;
    
    @Column(columnDefinition = "TEXT")
    private String pendingBio;
    
    
    private String pendingEducation;

    @Builder.Default
    private String verificationStatus = "UNVERIFIED";

    
    private String nidImageUrl;
    
    private String universityIdImageUrl;
    
    private String selfieImageUrl;
    private String gender;
    
    private String preferableTime;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean reactivationRequested = false;

    
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

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    
    private LocalDateTime updatedAt;
}
