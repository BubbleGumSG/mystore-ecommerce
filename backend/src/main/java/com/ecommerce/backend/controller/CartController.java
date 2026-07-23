package com.ecommerce.backend.controller;

import com.ecommerce.backend.entity.Cart;
import com.ecommerce.backend.entity.CartItem;
import com.ecommerce.backend.entity.ProductVariant;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.CartItemRepository;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.ProductVariantRepository;
import com.ecommerce.backend.repository.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;

    public CartController(CartRepository cartRepository, CartItemRepository cartItemRepository, UserRepository userRepository, ProductVariantRepository variantRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.variantRepository = variantRepository;
    }

    @GetMapping("/{userId}")
    public Cart getCartByUserId(@PathVariable UUID userId) {
        
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Cart emptyCart = new Cart();
            emptyCart.setUser(user);
            return cartRepository.save(emptyCart);
        });
    }

    
    @PostMapping("/{userId}/add")
    public Cart addItemToCart(@PathVariable UUID userId, @RequestParam UUID variantId, @RequestParam Integer quantity) {
        
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        ProductVariant variant = variantRepository.findById(variantId).orElseThrow(() -> new RuntimeException("Variant not found"));

        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        });

        
        Optional<CartItem> existingItem = cart.getItems() != null ? 
            cart.getItems().stream()
                .filter(item -> item.getVariant().getId().equals(variantId))
                .findFirst() : Optional.empty();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setVariant(variant);
            newItem.setQuantity(quantity);
            cartItemRepository.save(newItem);
        }

        return cartRepository.findById(cart.getId()).get();
    }

    @DeleteMapping("/{userId}/items/{cartItemId}")
    public ResponseEntity<?> removeItemFromCart(@PathVariable UUID userId, @PathVariable UUID cartItemId) {
        
        cartItemRepository.deleteById(cartItemId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{userId}/update")
    @Transactional
    public ResponseEntity<?> updateCartItemQuantity(
            @PathVariable UUID userId, 
            @RequestParam UUID variantId, 
            @RequestParam int quantity) {
            
        
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Coșul nu a fost găsit"));

        
        for (CartItem item : cart.getItems()) {
            if (item.getVariant().getId().equals(variantId)) {
                
                item.setQuantity(quantity);
                
                
                cartRepository.save(cart); 
                return ResponseEntity.ok("Cantitate actualizată cu succes!");
            }
        }

        return ResponseEntity.badRequest().body("Produsul nu a fost găsit în coș.");
    }
}