package com.smartcampus.incident.repository.specification;

import com.smartcampus.incident.entity.Booking;
import com.smartcampus.incident.enums.BookingStatus;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class BookingSpecification {

    public static Specification<Booking> withFilters(String status, Long resourceId, Long userId, LocalDate date) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), BookingStatus.valueOf(status.toUpperCase())));
            }

            if (resourceId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("resource").get("id"), resourceId));
            }

            if (userId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("user").get("id"), userId));
            }

            if (date != null) {
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(LocalTime.MAX);
                predicates = cb.and(predicates, cb.between(root.get("startDateTime"), startOfDay, endOfDay));
            }

            return predicates;
        };
    }
}
