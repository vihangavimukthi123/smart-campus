package com.smartcampus.incident;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Smart Campus Incident Ticketing & Maintenance Service.
 * Async is enabled for non-blocking notification dispatch.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class SmartCampusIncidentApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartCampusIncidentApplication.class, args);
    }
}
