package com.smartcampus.incident.repository;

import com.smartcampus.incident.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
}
