package com.ecommerce.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String toEmail, String orderId, double totalAmount, String deliveryInfo) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setTo(toEmail);
        message.setSubject("Confirmare Comandă - Magazinul Tău");
        message.setText("Salut!\n\n" +
                "Îți mulțumim pentru cumpărături!\n" +
                "Comanda ta cu ID-ul #" + orderId.substring(0, 8) + " a fost înregistrată cu succes.\n" +
                "Total plătit: $" + totalAmount + "\n\n" +
                "--- DETALII LIVRARE ---\n" +
                deliveryInfo + "\n\n" +
                "Echipa Magazinului");

        mailSender.send(message);
    }
}