package com.tuitionbd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
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
@Table(name = "progress_updates")
public class ProgressUpdate {

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
    @JoinColumn(nullable = false)
    @JsonIgnore
    private User guardian;

    private String type;
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    
    private LocalDateTime sessionDate;
    private Integer rating;
    
    @ElementCollection
    @CollectionTable(joinColumns = @JoinColumn)
    
    private List<String> attachmentUrls;

    @Builder.Default
    private Boolean seen = false;
    
    
    private LocalDateTime seenAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "progressUpdate", cascade = CascadeType.ALL)
    private List<GuardianComment> comments;

    @OneToMany(mappedBy = "progressUpdate", cascade = CascadeType.ALL)
    private List<Homework> homeworks;
}
