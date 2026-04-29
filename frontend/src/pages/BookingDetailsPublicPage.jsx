import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/qr-code.css';

const BookingDetailsPublicPage = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        // Using window.location.origin to handle different environments if needed, 
        // but normally we use the base URL from config.
        const response = await axios.get(`http://${window.location.hostname}:8081/api/bookings/public/${token}`);
        setBooking(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying booking:', err);
        setError('Invalid or expired verification token.');
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token]);

  if (loading) {
    return (
      <div className="verify-container">
        <div className="verify-card">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="verify-container" style={{ background: '#fef2f2' }}>
        <div className="verify-card">
          <div className="verify-success-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            ✕
          </div>
          <h1 className="verify-title" style={{ color: '#991b1b' }}>Booking Not Found</h1>
          <p className="text-red-600 font-semibold mb-6">{error || 'The booking details could not be retrieved.'}</p>
          <p className="text-slate-500">The QR code might be invalid or the booking has been cancelled.</p>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  console.log('Rendering BookingDetailsPublicPage with token:', token);

  return (
    <div className="verify-container">
      {/* Debug Header - Always Visible */}
      <div style={{ position: 'fixed', top: 10, left: 10, fontSize: '10px', color: '#666', zIndex: 9999 }}>
        SC-System v1.1 | {token ? 'Token Found' : 'No Token'}
      </div>

      <div className="verify-card">
        <div className="verify-success-icon" style={{ background: 'var(--clr-primary-glow)', color: 'var(--clr-primary)' }}>
          ℹ
        </div>
        <h1 className="verify-title">Booking Details</h1>
        <p className="verify-subtitle">Smart Campus System</p>

        <div className="verify-details">
          <div className="verify-item">
            <span className="verify-label">Resource</span>
            <span className="verify-value">{booking.resource.name} ({booking.resource.type})</span>
          </div>
          <div className="verify-item">
            <span className="verify-label">Location</span>
            <span className="verify-value">{booking.resource.location}</span>
          </div>
          <div className="verify-item">
            <span className="verify-label">Booked By</span>
            <span className="verify-value">{booking.user.name}</span>
          </div>
          <div className="verify-item">
            <span className="verify-label">Purpose</span>
            <span className="verify-value">{booking.purpose}</span>
          </div>
          <div className="verify-item">
            <span className="verify-label">Start Time</span>
            <span className="verify-value">{formatDateTime(booking.startDateTime)}</span>
          </div>
          <div className="verify-item">
            <span className="verify-label">End Time</span>
            <span className="verify-value">{formatDateTime(booking.endDateTime)}</span>
          </div>
          <div className="verify-item">
            <span className="verify-label">Status</span>
            <span className="verify-value">
              <span className="status-badge-approved">APPROVED</span>
            </span>
          </div>
        </div>

        <p className="text-slate-500 text-sm">
          Generated on: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default BookingDetailsPublicPage;
