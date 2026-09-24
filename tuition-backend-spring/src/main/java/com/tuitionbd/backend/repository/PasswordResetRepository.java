package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, String> {
    Optional<PasswordReset> findByEmail(String email);
    void deleteByEmail(String email);
}
