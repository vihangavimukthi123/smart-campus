package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.resource.CreateResourceRequest;
import com.smartcampus.incident.dto.resource.ResourceResponse;

import java.util.List;

public interface ResourceService {

    List<ResourceResponse> getAllResources();

    List<ResourceResponse> getAllResources(boolean includeRetired);

    List<ResourceResponse> getAllResourcesIncludingRetired();

    ResourceResponse getResourceById(Long id);

    ResourceResponse createResource(CreateResourceRequest request);

    ResourceResponse updateResource(Long id, CreateResourceRequest request);

    void deleteResource(Long id);
}
