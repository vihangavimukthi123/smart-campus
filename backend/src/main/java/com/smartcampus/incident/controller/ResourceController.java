package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.resource.CreateResourceRequest;
import com.smartcampus.incident.dto.resource.ResourceResponse;
import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.exception.ResourceNotFoundException;
import com.smartcampus.incident.repository.ResourceRepository;
import com.smartcampus.incident.service.FileStorageService;
import com.smartcampus.incident.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
@Tag(name = "Resources", description = "Facilities and assets catalogue endpoints")
public class ResourceController {

    private final ResourceService resourceService;
    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    @Operation(summary = "Fetch all resources")
    public ResponseEntity<List<ResourceResponse>> getResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @PostMapping
    @Operation(summary = "Create a resource")
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody CreateResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload or replace an image for a resource")
    public ResponseEntity<ResourceResponse> uploadResourceImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(resourceService.uploadResourceImage(id, file));
    }

    @GetMapping("/{id}/image")
    @Operation(summary = "View resource image")
    public ResponseEntity<org.springframework.core.io.Resource> viewResourceImage(@PathVariable Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", id));

        if (resource.getImageStoredPath() == null || resource.getImageStoredPath().isBlank()) {
            throw new ResourceNotFoundException("Resource image not found for id: " + id);
        }

        Path filePath = fileStorageService.resolveFilePath(resource.getImageStoredPath());
        org.springframework.core.io.Resource file;
        try {
            file = new UrlResource(filePath.toUri());
            if (!file.exists()) {
                throw new ResourceNotFoundException("Resource image file not found on server");
            }
        } catch (Exception e) {
            throw new ResourceNotFoundException("Resource image could not be loaded");
        }

        String contentType = resource.getImageContentType() != null && !resource.getImageContentType().isBlank()
                ? resource.getImageContentType()
                : MediaType.IMAGE_JPEG_VALUE;
        String fileName = resource.getImageOriginalFileName() != null && !resource.getImageOriginalFileName().isBlank()
                ? resource.getImageOriginalFileName()
                : "resource-image-" + id;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(file);
    }
}
