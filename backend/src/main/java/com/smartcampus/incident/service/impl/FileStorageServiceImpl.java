package com.smartcampus.incident.service.impl;

import com.smartcampus.incident.exception.FileStorageException;
import com.smartcampus.incident.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${app.file-storage.upload-dir}")
    private String uploadDir;

    @Value("${app.file-storage.allowed-types}")
    private String allowedTypesRaw;

    private Path rootLocation;
    private List<String> allowedTypes;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.allowedTypes = Arrays.asList(allowedTypesRaw.split(","));
        try {
            Files.createDirectories(rootLocation);
            log.info("File storage directory initialized at: {}", rootLocation);
        } catch (IOException e) {
            throw new FileStorageException("Could not initialize file storage directory", e);
        }
    }

    @Override
    public void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot store empty file");
        }
        if (!allowedTypes.contains(file.getContentType())) {
            throw new FileStorageException(
                "File type not allowed: " + file.getContentType() +
                ". Allowed types: " + String.join(", ", allowedTypes)
            );
        }
        // Prevent path traversal
        String filename = StringUtils.cleanPath(file.getOriginalFilename());
        if (filename.contains("..")) {
            throw new FileStorageException("Filename contains invalid path sequence: " + filename);
        }
    }

    @Override
    public String store(MultipartFile file, String subDirectory) {
        validateFile(file);

        try {
            Path targetDir = rootLocation.resolve(subDirectory);
            Files.createDirectories(targetDir);

            String originalName = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = getExtension(originalName);
            String storedName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

            Path targetPath = targetDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = subDirectory + "/" + storedName;
            log.info("File stored: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            throw new FileStorageException("Failed to store file", e);
        }
    }

    @Override
    public void delete(String storedPath) {
        try {
            Path filePath = rootLocation.resolve(storedPath).normalize();
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", storedPath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", storedPath, e);
        }
    }

    @Override
    public Path resolveFilePath(String storedPath) {
        return rootLocation.resolve(storedPath).normalize();
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex >= 0) ? filename.substring(dotIndex + 1).toLowerCase() : "";
    }
}
