package com.smartcampus.incident.service;

import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

public interface FileStorageService {
    String store(MultipartFile file, String subDirectory);
    void delete(String storedPath);
    Path resolveFilePath(String storedPath);
    void validateFile(MultipartFile file);
}
