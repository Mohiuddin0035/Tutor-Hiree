package com.tuitionbd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "tuition_jobs")
public class TuitionJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, insertable = false, updatable = false, columnDefinition = "serial")
    private Integer jobSeq;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String subject;
    
    private String classLevel;
    private Integer salary;
    private String duration;
    private String studentGender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    @JsonIgnoreProperties({"postedJobs", "appliedJobs", "hibernateLazyInitializer", "handler"})
    private User parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    @JsonIgnoreProperties({"postedJobs", "appliedJobs", "hibernateLazyInitializer", "handler"})
    private User tutor;

    @Builder.Default
    private String status = "OPEN";

    private Double latitude;
    private Double longitude;
    
    private Double approxLatitude;
    
    private Double approxLongitude;

    @Builder.Default
    private Boolean locationUnlocked = false;

    @Builder.Default
    private Boolean tutorDetailsReleased = false;

    @Builder.Default
    private Boolean commissionPaid = false;

    
    private Integer commissionAmount;
    
    @Column(columnDefinition = "TEXT")
    private String tutorRequirement;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    
    private LocalDateTime updatedAt;
}
