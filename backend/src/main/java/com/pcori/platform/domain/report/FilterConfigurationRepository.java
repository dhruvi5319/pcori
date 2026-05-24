package com.pcori.platform.domain.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FilterConfigurationRepository extends JpaRepository<FilterConfiguration, UUID> {

    List<FilterConfiguration> findByUserIdAndDeletedAtIsNull(UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);
}
