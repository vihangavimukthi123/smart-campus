package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.dto.resource.CreateResourceRequest;
import com.smartcampus.incident.dto.resource.ResourceResponse;
import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.repository.ResourceRepository;
import com.smartcampus.incident.service.FileStorageService;
import com.smartcampus.incident.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public List<ResourceResponse> getAllResources() {
        return resourceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
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

    @Override
    @Transactional
    public ResourceResponse uploadResourceImage(Long resourceId, MultipartFile file) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", resourceId));

        if (resource.getImageStoredPath() != null && !resource.getImageStoredPath().isBlank()) {
            fileStorageService.delete(resource.getImageStoredPath());
        }

        String storedPath = fileStorageService.store(file, "resources/" + resourceId);
        resource.setImageStoredPath(storedPath);
        resource.setImageContentType(file.getContentType());
        resource.setImageOriginalFileName(file.getOriginalFilename());

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
                .imageUrl(resource.getImageStoredPath() == null || resource.getImageStoredPath().isBlank()
                        ? null
                        : "/api/resources/" + resource.getId() + "/image")
                .build();
    }
}
