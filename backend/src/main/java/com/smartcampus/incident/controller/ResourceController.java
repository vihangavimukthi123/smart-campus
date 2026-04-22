package com.smartcampus.incident.controller;

import com.smartcampus.incident.dto.resource.CreateResourceRequest;
import com.smartcampus.incident.dto.resource.ResourceResponse;
import com.smartcampus.incident.service.ResourceService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
@CrossOrigin

public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public List<ResourceResponse> getAll() {
        return resourceService.getAllResources();
    }

    @GetMapping("/{id}")
    public ResourceResponse getById(@PathVariable Long id) {
        return resourceService.getResourceById(id);
    }

    @PostMapping
    public ResourceResponse create(@Valid @RequestBody CreateResourceRequest request) {
        return resourceService.createResource(request);
    }

    @PutMapping("/{id}")
    public ResourceResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CreateResourceRequest request) {
        return resourceService.updateResource(id, request);
    }

    @DeleteMapping("/id")
    public void delete(@PathVariable Long id){
        resourceService.deleteResource(id);
    }

}
