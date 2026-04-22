package com.smartcampus.incident.repository;

import com.smartcampus.incident.entity.Booking;
import com.smartcampus.incident.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status NOT IN ('REJECTED', 'CANCELLED') " +
           "AND (b.startDateTime < :end AND b.endDateTime > :start)")
    boolean existsOverlappingBooking(@Param("resourceId") Long resourceId, 
                                     @Param("start") LocalDateTime start, 
                                     @Param("end") LocalDateTime end);

    List<Booking> findByUserId(Long userId);
}
