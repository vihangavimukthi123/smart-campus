package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.resource.CreateResourceRequest;
import com.smartcampus.incident.dto.resource.ResourceResponse;
import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.repository.ResourceRepository;
import com.smartcampus.incident.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ResourceResponse> getAllResources() {
        return resourceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        return toResponse(resource);
    }

    @Override
    @Transactional
    public ResourceResponse createResource(CreateResourceRequest request) {
        Resource resource = Resource.builder()
                .name(request.getName().trim())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation().trim())
                .status(request.getStatus())
                .build();

        return toResponse(resourceRepository.save(resource));
    }

    private ResourceResponse toResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus())
                .build();
    }

    @Override
    @Transactional
    public ResourceResponse updateResource(Long id, CreateResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation().trim());
        resource.setStatus(request.getStatus());

        Resource updated = resourceRepository.save(resource);

        return ResourceResponse.builder()
                .id(updated.getId())
                .name(updated.getName())
                .type(updated.getType())
                .capacity(updated.getCapacity())
                .location(updated.getLocation())
                .status(updated.getStatus())
                .build();
    }
}