package com.pcori.platform.domain.pipeline;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PipelineLogRepository extends JpaRepository<PipelineLog, UUID> {

    Page<PipelineLog> findByRunIdOrderByLoggedAtDesc(UUID runId, Pageable pageable);
}
