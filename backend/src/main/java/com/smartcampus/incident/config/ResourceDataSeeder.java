package com.smartcampus.incident.config;

import com.smartcampus.incident.entity.Resource;
import com.smartcampus.incident.enums.ResourceStatus;
import com.smartcampus.incident.enums.ResourceType;
import com.smartcampus.incident.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ResourceDataSeeder {

    private final ResourceRepository resourceRepository;

    @Bean
    public CommandLineRunner seedResources() {
        return args -> {
            if (resourceRepository.count() > 0) {
                return;
            }

            resourceRepository.save(Resource.builder()
                    .name("Engineering Lab A")
                    .type(ResourceType.LAB)
                    .capacity(40)
                    .location("Engineering Block - Floor 2")
                    .status(ResourceStatus.ACTIVE)
                    .build());

            resourceRepository.save(Resource.builder()
                    .name("Seminar Room 1")
                    .type(ResourceType.ROOM)
                    .capacity(60)
                    .location("Main Building - Floor 1")
                    .status(ResourceStatus.ACTIVE)
                    .build());

            resourceRepository.save(Resource.builder()
                    .name("4K Projector - PJR-09")
                    .type(ResourceType.EQUIPMENT)
                    .capacity(1)
                    .location("Asset Store")
                    .status(ResourceStatus.OUT_OF_SERVICE)
                    .build());

            log.info("Seeded initial resource catalogue records");
        };
    }
}
