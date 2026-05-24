package com.pcori.platform.domain.help;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FaqRepository extends JpaRepository<Faq, UUID> {

    List<Faq> findByCategoryOrderByDisplayOrderAsc(String category);

    List<Faq> findAllByOrderByDisplayOrderAsc();
}
