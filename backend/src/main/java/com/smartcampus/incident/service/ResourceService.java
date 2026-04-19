package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.resource.CreateResourceRequest;
import com.smartcampus.incident.dto.resource.ResourceResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ResourceService {

    List<ResourceResponse> getAllResources();

    ResourceResponse createResource(CreateResourceRequest request);

    ResourceResponse uploadResourceImage(Long resourceId, MultipartFile file);
}
