package com.pcori.platform.domain.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportConfigurationRepository extends JpaRepository<ReportConfiguration, UUID> {

    List<ReportConfiguration> findByOwnerIdAndDeletedAtIsNull(UUID ownerId);

    boolean existsByOwnerIdAndName(UUID ownerId, String name);
}
