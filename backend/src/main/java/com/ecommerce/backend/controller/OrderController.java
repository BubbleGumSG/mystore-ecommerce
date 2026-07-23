package com.ecommerce.backend.controller;

import com.ecommerce.backend.entity.*;
import com.ecommerce.backend.repository.*;
import com.ecommerce.backend.service.EmailService;

import jakarta.transaction.Transactional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    //private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final EmailService emailService;
    //private final UserRepository userRepository;

    public OrderController(OrderRepository orderRepository, CartRepository cartRepository, CartItemRepository cartItemRepository, EmailService emailService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.emailService = emailService;
        //this.userRepository = userRepository;
        //this.inventoryRepository = inventoryRepository;
    }

    @GetMapping("/user/{userId}")
    public List<Order> getUserOrders(@PathVariable UUID userId) {
        return orderRepository.findByUserId(userId);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable UUID id) {
        try {
            
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Comanda nu a fost găsită!"));

            
            if ("CANCELLED".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body("Comanda este deja anulată.");
            }

            
            order.setStatus("CANCELLED");
            
            
            orderRepository.save(order);

            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Eroare la anularea comenzii.");
        }
    }

    @PostMapping("/checkout/{userId}")
    @Transactional
    public ResponseEntity<?> finalizeOrderAfterPayment(
            @PathVariable UUID userId,
            @RequestBody Map<String, Object> deliveryPayload) {
        
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Coșul nu a fost găsit"));

        if (cart.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Coșul este deja gol!");
        }

        Order newOrder = new Order();
        newOrder.setUser(cart.getUser());
        newOrder.setStatus("PAID");

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(newOrder);
            orderItem.setVariant(cartItem.getVariant());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPriceAtPurchase(cartItem.getVariant().getPrice());
            orderItems.add(orderItem);

            total = total.add(cartItem.getVariant().getPrice().multiply(new BigDecimal(cartItem.getQuantity())));
        }

        newOrder.setItems(orderItems);
        newOrder.setTotalAmount(total);

        
        orderRepository.save(newOrder);

        
        String method = (String) deliveryPayload.get("method");
        StringBuilder deliveryInfo = new StringBuilder();

        if ("home".equals(method)) {
            Map<String, String> details = (Map<String, String>) deliveryPayload.get("details");
            deliveryInfo.append("Metodă: Livrare la Domiciliu (Curier)\n")
                    .append("Destinatar: ").append(details.get("fullName")).append("\n")
                    .append("Telefon: ").append(details.get("phone")).append("\n")
                    .append("Adresă: Jud. ").append(details.get("county"))
                    .append(", ").append(details.get("city"))
                    .append(", Str. ").append(details.get("street"))
                    .append(", Nr. ").append(details.get("number"));
            
            if (details.get("block") != null && !details.get("block").isEmpty()) deliveryInfo.append(", Bl. ").append(details.get("block"));
            if (details.get("apartment") != null && !details.get("apartment").isEmpty()) deliveryInfo.append(", Ap. ").append(details.get("apartment"));
            if (details.get("additionalInfo") != null && !details.get("additionalInfo").isEmpty()) deliveryInfo.append("\nNote: ").append(details.get("additionalInfo"));
        } else {
            
            Map<String, String> details = (Map<String, String>) deliveryPayload.get("details");
            deliveryInfo.append("Metodă: Ridicare Easybox\n")
                    .append("Locker selectat: ").append(details.get("easyboxName") != null ? details.get("easyboxName") : "Locker Sameday");
        }

        
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);

        
        try {
            emailService.sendOrderConfirmation(
                newOrder.getUser().getEmail(), 
                newOrder.getId().toString(), 
                newOrder.getTotalAmount().doubleValue(),
                deliveryInfo.toString()
            );
        } catch (Exception e) {
            System.err.println("Eroare la trimiterea emailului: " + e.getMessage());
        }

        return ResponseEntity.ok(newOrder);
    }
}