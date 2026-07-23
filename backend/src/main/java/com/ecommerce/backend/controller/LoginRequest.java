package com.ecommerce.backend.controller;
import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}