package com.ecommerce.backend.repository;

import com.ecommerce.backend.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    
    List<Inventory> findByVariantId(UUID variantId);
}