import React from 'react';
import { createPortal } from 'react-dom';
import '../styles/qr-code.css';

const QrCodeModal = ({ isOpen, onClose, qrCodeImage, bookingId }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `booking-qr-${bookingId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="qr-modal-title">Booking Information QR</h2>
        <p className="qr-modal-text">Scan this QR code with your phone to view the details of this booking.</p>
        
        <div className="qr-image-container">
          <img 
            src={qrCodeImage} 
            alt="Booking QR Code" 
            className="qr-image"
          />
        </div>

        <div className="qr-modal-actions">
          <button className="qr-close-btn" onClick={onClose}>
            Close
          </button>
          <button className="qr-download-btn" onClick={handleDownload}>
            Download QR
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QrCodeModal;
