package com.pcori.platform.domain.dashboard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DashboardConfigurationRepository extends JpaRepository<DashboardConfiguration, UUID> {

    Optional<DashboardConfiguration> findByUserIdAndDeletedAtIsNull(UUID userId);
}
