package com.ecommerce.backend.controller;

import com.ecommerce.backend.entity.Cart;
import com.ecommerce.backend.entity.CartItem;
import com.ecommerce.backend.repository.CartRepository;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    private final CartRepository cartRepository;

    public PaymentController(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @PostMapping("/create-checkout-session/{userId}")
    public ResponseEntity<?> createCheckoutSession(@PathVariable UUID userId) {
        
        Stripe.apiKey = stripeSecretKey;

        try {
            
            Cart cart = cartRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Coșul nu a fost găsit"));

            
            List<SessionCreateParams.LineItem> stripeItems = new ArrayList<>();
            
            for (CartItem item : cart.getItems()) {
                
                long priceInCents = item.getVariant().getPrice().multiply(new BigDecimal("100")).longValue();

                SessionCreateParams.LineItem stripeItem = SessionCreateParams.LineItem.builder()
                        .setQuantity((long) item.getQuantity())
                        .setPriceData(
                                SessionCreateParams.LineItem.PriceData.builder()
                                        .setCurrency("usd")
                                        .setUnitAmount(priceInCents)
                                        .setProductData(
                                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                        .setName(item.getVariant().getProduct().getName())
                                                        .build()
                                        )
                                        .build()
                        )
                        .build();
                stripeItems.add(stripeItem);
            }

            
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:5173/success")
                    .setCancelUrl("http://localhost:5173/cart")    
                    .addAllLineItem(stripeItems)
                    .build();

            Session session = Session.create(params);

            
            return ResponseEntity.ok(Map.of("url", session.getUrl()));

        } catch (Exception e) {
            System.err.println("Stripe Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Eroare la inițializarea plății.");
        }
    }
}