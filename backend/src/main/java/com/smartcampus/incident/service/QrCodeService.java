package com.smartcampus.incident.service;

public interface QrCodeService {
    String generateVerificationToken(Long bookingId);
    String generateQrCodeImage(String token);
}
