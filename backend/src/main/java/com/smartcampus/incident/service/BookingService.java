import com.smartcampus.incident.dto.booking.CancelBookingRequest;
import com.smartcampus.incident.dto.booking.CreateBookingRequest;
import com.smartcampus.incident.dto.booking.RejectBookingRequest;
import com.smartcampus.incident.dto.booking.BookingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    BookingResponse createBooking(CreateBookingRequest request);
    List<BookingResponse> getMyBookings();
    Page<BookingResponse> getAllBookings(String status, Long resourceId, Long userId, LocalDate date, Pageable pageable);
    BookingResponse getBookingById(Long id);
    void approveBooking(Long id);
    void rejectBooking(Long id, RejectBookingRequest request);
    void cancelBooking(Long id, CancelBookingRequest request);
}
