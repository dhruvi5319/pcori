package com.pcori.platform.domain.pipeline;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PipelineRunRepository extends JpaRepository<PipelineRun, UUID> {

    Page<PipelineRun> findAllByOrderByStartedAtDesc(Pageable pageable);

    Optional<PipelineRun> findTopByOrderByStartedAtDesc();
}
