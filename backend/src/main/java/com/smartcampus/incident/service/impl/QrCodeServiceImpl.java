package com.smartcampus.incident.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.smartcampus.incident.service.QrCodeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.UUID;

@Service
public class QrCodeServiceImpl implements QrCodeService {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public String generateVerificationToken(Long bookingId) {
        String randomString = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        return String.format("BOOKING-%d-%s", bookingId, randomString);
    }

    @Override
    public String generateQrCodeImage(String token) {
        try {
            String verificationUrl = String.format("%s/booking-details/%s", frontendUrl, token);
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(verificationUrl, BarcodeFormat.QR_CODE, 400, 400);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] pngData = outputStream.toByteArray();
            
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            throw new RuntimeException("Could not generate QR code", e);
        }
    }
}
