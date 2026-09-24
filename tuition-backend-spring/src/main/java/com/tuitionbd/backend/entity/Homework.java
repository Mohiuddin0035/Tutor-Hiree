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
@Table(name = "homeworks")
public class Homework {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private TuitionJob job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private User tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    private ProgressUpdate progressUpdate;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String subject;

    @Builder.Default
    private LocalDateTime assignedDate = LocalDateTime.now();
    
    
    private LocalDateTime dueDate;

    @Builder.Default
    private String status = "ASSIGNED";
    
    
    private LocalDateTime completedAt;
    
    @Column(columnDefinition = "TEXT")
    private String tutorRemarks;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    
    private LocalDateTime updatedAt;
}
