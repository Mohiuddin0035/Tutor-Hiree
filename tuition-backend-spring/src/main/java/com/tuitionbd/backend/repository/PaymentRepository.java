package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByJobId(String jobId);
    Optional<Payment> findByTrxId(String trxId);
}
