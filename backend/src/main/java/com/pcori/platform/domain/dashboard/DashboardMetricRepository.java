package com.pcori.platform.domain.dashboard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DashboardMetricRepository extends JpaRepository<DashboardMetric, UUID> {
}
