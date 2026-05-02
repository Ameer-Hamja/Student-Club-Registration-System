package com.example.studentclubbooking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class AdminStatsDTO {
    private long totalUsers;
    private long totalEvents;
    private long totalRegistrations;
    private long paidRegistrations;
    private long failedRegistrations;

    /** Precise revenue sum from Transaction table (BigDecimal) */
    private BigDecimal totalRevenue;

    /** Count of SUCCESS transactions per department */
    private List<Map<String, Object>> registrationsByDepartment;

    /** Top 5 events by SUCCESS transaction count */
    private List<Map<String, Object>> topEvents;

    /** Top 5 events by seat occupancy percentage */
    private List<Map<String, Object>> popularEvents;
}
