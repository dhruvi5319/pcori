package com.pcori.platform.domain.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExcelReportRepository extends JpaRepository<ExcelReport, UUID> {

    List<ExcelReport> findByConfigurationIdAndDeletedAtIsNull(UUID configurationId);
}
