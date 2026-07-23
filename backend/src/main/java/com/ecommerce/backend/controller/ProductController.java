package com.ecommerce.backend.controller;

import com.ecommerce.backend.entity.Product;
import com.ecommerce.backend.entity.ProductVariant;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.ProductVariantRepository;

import jakarta.transaction.Transactional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public ProductController(ProductRepository productRepository, ProductVariantRepository productVariantRepository) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
    }

    
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }


    
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable UUID id) {
        
        return productRepository.findById(id).map(product -> {
            product.setIsActive(false); 
            productRepository.save(product);
            return "Product with ID " + id + " has been successfully archived (Soft Deleted).";
        }).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    
    public static class ProductCreationRequest {
        public String name;
        public String description;
        public BigDecimal price;
        public String imageUrl;
    }

    
    @PostMapping
    @Transactional
    public ResponseEntity<?> createProduct(@RequestBody ProductCreationRequest request) {
        
        
        Product newProduct = new Product();
        newProduct.setName(request.name);
        newProduct.setDescription(request.description);
        newProduct.setBasePrice(request.price);
        newProduct.setIsActive(true);
        newProduct.setImageUrl(request.imageUrl);
        Product savedProduct = productRepository.save(newProduct);

        
        ProductVariant defaultVariant = new ProductVariant();
        defaultVariant.setProduct(savedProduct);
        defaultVariant.setSku("SKU-" + System.currentTimeMillis());
        defaultVariant.setPrice(request.price);
        productVariantRepository.save(defaultVariant);

        return ResponseEntity.ok(savedProduct);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable UUID id) {
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul nu a fost găsit"));
                
        
        return ResponseEntity.ok(product);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateProduct(@PathVariable UUID id, @RequestBody ProductCreationRequest request) {
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul nu a fost găsit"));

        
        product.setName(request.name);
        product.setDescription(request.description);
        product.setBasePrice(request.price);
        product.setImageUrl(request.imageUrl);
        productRepository.save(product);

        
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            ProductVariant defaultVariant = product.getVariants().get(0);
            defaultVariant.setPrice(request.price);
            productVariantRepository.save(defaultVariant);
        }

        return ResponseEntity.ok(product);
    }
}