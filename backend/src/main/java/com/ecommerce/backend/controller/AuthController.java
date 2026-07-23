package com.ecommerce.backend.controller;

import com.ecommerce.backend.entity.Cart;
import com.ecommerce.backend.entity.User;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CartRepository cartRepository;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, CartRepository cartRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.cartRepository = cartRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest request) { // Numele clasei tale de request
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email-ul este deja folosit!");
        }

        
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        
        
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword())); 
        // ------------------------------------------

        newUser.setRole("USER");

        
        userRepository.save(newUser);

        
        Cart newCart = new Cart();
        newCart.setUser(newUser);
        cartRepository.save(newCart);

        return ResponseEntity.ok("Cont creat cu succes!");
    }

    @PostMapping("/login")
    public String loginUser(@RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

    if (passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
        
        return jwtService.generateToken(user.getEmail(), user.getRole(), user.getId().toString()); 
    } else {
            throw new RuntimeException("Invalid Password!");
        }
    }

    public static class AuthRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}