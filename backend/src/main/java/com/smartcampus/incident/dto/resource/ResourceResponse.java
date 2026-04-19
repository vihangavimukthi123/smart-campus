package com.smartcampus.incident.dto.resource;

import com.smartcampus.incident.enums.ResourceStatus;
import com.smartcampus.incident.enums.ResourceType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {
    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;
    private String imageUrl;
}
