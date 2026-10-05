package com.wayfarer.trip;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.time.LocalTime;

@Embeddable
public class ItineraryActivity {
    @Column(name = "day_number", nullable = false)
    private int dayNumber;

    @Column(name = "activity_time", nullable = false)
    private LocalTime time;

    @Column(name = "activity_title", nullable = false, length = 160)
    private String title;

    @Column(name = "activity_location", length = 200)
    private String location;

    @Column(name = "activity_category", length = 40)
    private String category;

    @Column(name = "activity_notes", length = 1000)
    private String notes;

    @Column(name = "estimated_cost", precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    protected ItineraryActivity() {}

    public ItineraryActivity(int dayNumber, LocalTime time, String title, String location,
                             String category, String notes, BigDecimal estimatedCost) {
        this.dayNumber = dayNumber;
        this.time = time;
        this.title = title;
        this.location = location;
        this.category = category;
        this.notes = notes;
        this.estimatedCost = estimatedCost;
    }

    public int getDayNumber() { return dayNumber; }
    public LocalTime getTime() { return time; }
    public String getTitle() { return title; }
    public String getLocation() { return location; }
    public String getCategory() { return category; }
    public String getNotes() { return notes; }
    public BigDecimal getEstimatedCost() { return estimatedCost; }
}
