package com.pcori.platform.domain.classification;

import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe RP-YYYY-### plan ID generator.
 * Resets counter on year rollover.
 * Format: RP-2026-001
 */
@Component
public class PlanIdGenerator {

    private final AtomicInteger counter = new AtomicInteger(0);
    private volatile int lastYear = Year.now().getValue();

    public synchronized String next() {
        int currentYear = Year.now().getValue();
        if (currentYear != lastYear) {
            counter.set(0);
            lastYear = currentYear;
        }
        int seq = counter.incrementAndGet();
        return String.format("RP-%d-%03d", currentYear, seq);
    }
}
