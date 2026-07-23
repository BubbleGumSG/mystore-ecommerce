package com.ecommerce.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "warehouses")
@Data
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "warehouse_id", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;
    
    
}