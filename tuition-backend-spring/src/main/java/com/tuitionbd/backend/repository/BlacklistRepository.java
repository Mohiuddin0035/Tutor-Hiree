package com.tuitionbd.backend.repository;

import com.tuitionbd.backend.entity.Blacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, String> {
    Optional<Blacklist> findByPhone(String phone);
}
