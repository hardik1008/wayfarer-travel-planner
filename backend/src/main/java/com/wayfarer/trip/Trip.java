package com.wayfarer.trip;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trips")
public class Trip {
    public enum Status { PLANNING, UPCOMING, COMPLETED, ARCHIVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(length = 1000)
    private String coverImageUrl;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalBudget;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(nullable = false)
    private int travellerCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.PLANNING;

    @ElementCollection
    @CollectionTable(name = "trip_destinations", joinColumns = @JoinColumn(name = "trip_id"))
    @OrderColumn(name = "destination_order")
    @Column(name = "destination_name", nullable = false, length = 120)
    private List<String> destinations = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "trip_activities", joinColumns = @JoinColumn(name = "trip_id"))
    @OrderColumn(name = "activity_order")
    private List<ItineraryActivity> activities = new ArrayList<>();

    protected Trip() {}

    public Trip(String name, String description, String coverImageUrl, LocalDate startDate,
                LocalDate endDate, BigDecimal totalBudget, String currency, int travellerCount,
                Status status, List<String> destinations, List<ItineraryActivity> activities) {
        this.name = name;
        this.description = description;
        this.coverImageUrl = coverImageUrl;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalBudget = totalBudget;
        this.currency = currency;
        this.travellerCount = travellerCount;
        this.status = status;
        this.destinations = new ArrayList<>(destinations);
        this.activities = new ArrayList<>(activities);
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public BigDecimal getTotalBudget() { return totalBudget; }
    public String getCurrency() { return currency; }
    public int getTravellerCount() { return travellerCount; }
    public Status getStatus() { return status; }
    public List<String> getDestinations() { return List.copyOf(destinations); }
    public List<ItineraryActivity> getActivities() { return List.copyOf(activities); }

    public void updateFrom(Trip other) {
        name = other.name;
        description = other.description;
        coverImageUrl = other.coverImageUrl;
        startDate = other.startDate;
        endDate = other.endDate;
        totalBudget = other.totalBudget;
        currency = other.currency;
        travellerCount = other.travellerCount;
        status = other.status;
        destinations.clear();
        destinations.addAll(other.destinations);
        activities.clear();
        activities.addAll(other.activities);
    }

    public void setStatus(Status status) { this.status = status; }
}
