package com.smartcampus.incident.repository;

import com.smartcampus.incident.dto.analytics.PeakHourDto;
import com.smartcampus.incident.dto.analytics.ResourceUsageDto;
import com.smartcampus.incident.dto.analytics.TopResourceDto;
import com.smartcampus.incident.entity.Booking;
import com.smartcampus.incident.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.resource.id = :resourceId " +
            "AND b.status NOT IN ('REJECTED', 'CANCELLED') " +
            "AND b.id <> :excludeId " +
            "AND (b.startDateTime < :end AND b.endDateTime > :start)")
    boolean existsOverlappingBooking(@Param("resourceId") Long resourceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("excludeId") Long excludeId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.resource JOIN FETCH b.user WHERE b.user.id = :userId")
    List<Booking> findByUserId(@Param("userId") Long userId);

    // ── Analytics queries ──────────────────────────────────────────────────

    /**
     * Top N resources by approved booking count.
     */
    @Query("""
            SELECT new com.smartcampus.incident.dto.analytics.TopResourceDto(
                b.resource.id,
                b.resource.name,
                COUNT(b)
            )
            FROM Booking b
            WHERE b.status = :status
            GROUP BY b.resource.id, b.resource.name
            ORDER BY COUNT(b) DESC
            LIMIT :limit
            """)
    List<TopResourceDto> findTopResources(@Param("status") BookingStatus status, @Param("limit") int limit);

    /**
     * Approved booking count grouped by start hour (0–23).
     */
    @Query("""
            SELECT new com.smartcampus.incident.dto.analytics.PeakHourDto(
                FUNCTION('HOUR', b.startDateTime),
                COUNT(b)
            )
            FROM Booking b
            WHERE b.status = :status
            GROUP BY FUNCTION('HOUR', b.startDateTime)
            ORDER BY FUNCTION('HOUR', b.startDateTime)
            """)
    List<PeakHourDto> findPeakHours(@Param("status") BookingStatus status);

    /**
     * All resources and their total booking count (all statuses).
     */
    @Query("""
            SELECT new com.smartcampus.incident.dto.analytics.ResourceUsageDto(
                b.resource.name,
                COUNT(b)
            )
            FROM Booking b
            GROUP BY b.resource.name
            ORDER BY COUNT(b) DESC
            """)
    List<ResourceUsageDto> findResourceUsage();
}
