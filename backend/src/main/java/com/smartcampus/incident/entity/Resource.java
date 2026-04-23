package com.smartcampus.incident.entity;

import com.smartcampus.incident.enums.ResourceStatus;
import com.smartcampus.incident.enums.ResourceType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resources", indexes = {
        @Index(name = "idx_resource_type", columnList = "type"),
        @Index(name = "idx_resource_status", columnList = "status"),
        @Index(name = "idx_resource_location", columnList = "location")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ResourceStatus status;

    @Builder.Default
    @Column(nullable = false)
    private boolean deleted = false;
}
