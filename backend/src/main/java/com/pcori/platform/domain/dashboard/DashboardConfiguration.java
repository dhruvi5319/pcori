package com.pcori.platform.domain.dashboard;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Maps to dashboard_configurations table (V7 migration).
 * Stores per-user widget layout configuration.
 * Layout stored as JSON text (columnDefinition = TEXT) since hypersistence-utils is not in the classpath.
 */
@Entity
@Table(name = "dashboard_configurations")
@Getter
@Setter
@NoArgsConstructor
public class DashboardConfiguration {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    /**
     * Widget layout configuration stored as JSON text.
     * Serialised/deserialised manually via ObjectMapper (JSONB fallback — no hypersistence-utils).
     */
    @Column(name = "layout", nullable = false, columnDefinition = "jsonb")
    private String layoutJson = "{}";

    @Column(name = "widgets", columnDefinition = "jsonb")
    private String widgetsJson;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ----------------------------------------------------------------
    // Convenience accessors (Map <-> JSON text)
    // ----------------------------------------------------------------

    public Map<String, Object> getLayout() {
        return deserialize(layoutJson, new HashMap<>());
    }

    public void setLayout(Map<String, Object> layout) {
        this.layoutJson = serialize(layout != null ? layout : new HashMap<>());
    }

    public Map<String, Object> getWidgets() {
        return deserialize(widgetsJson, null);
    }

    public void setWidgets(Map<String, Object> widgets) {
        this.widgetsJson = widgets != null ? serialize(widgets) : null;
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    private static String serialize(Map<String, Object> map) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private static Map<String, Object> deserialize(String json, Map<String, Object> defaultValue) {
        if (json == null || json.isBlank()) return defaultValue;
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return defaultValue;
        }
    }
}
