package com.wayfarer.trip;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class TripDtos {
    private TripDtos() {}

    public record TripRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 2000) String description,
            @Size(max = 1000) String coverImageUrl,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            @NotNull @DecimalMin("0.00") BigDecimal totalBudget,
            @NotBlank @Size(min = 3, max = 3) String currency,
            @Positive int travellerCount,
            @NotNull Trip.Status status,
            @Size(max = 20) List<@NotBlank @Size(max = 120) String> destinations,
            @Size(max = 200) List<@Valid ActivityRequest> activities) {}

    public record ActivityRequest(
            @Positive int dayNumber,
            @NotNull LocalTime time,
            @NotBlank @Size(max = 160) String title,
            @Size(max = 200) String location,
            @Size(max = 40) String category,
            @Size(max = 1000) String notes,
            @DecimalMin("0.00") BigDecimal estimatedCost) {}

    public record ActivityResponse(int dayNumber, LocalTime time, String title, String location,
                                   String category, String notes, BigDecimal estimatedCost) {
        static ActivityResponse from(ItineraryActivity activity) {
            return new ActivityResponse(activity.getDayNumber(), activity.getTime(),
                    activity.getTitle(), activity.getLocation(), activity.getCategory(),
                    activity.getNotes(), activity.getEstimatedCost());
        }
    }

    public record TripResponse(
            Long id, String name, String description, String coverImageUrl, LocalDate startDate,
            LocalDate endDate, BigDecimal totalBudget, String currency, int travellerCount,
            Trip.Status status, List<String> destinations, List<ActivityResponse> activities) {
        static TripResponse from(Trip trip) {
            return new TripResponse(trip.getId(), trip.getName(), trip.getDescription(),
                    trip.getCoverImageUrl(), trip.getStartDate(), trip.getEndDate(),
                    trip.getTotalBudget(), trip.getCurrency(), trip.getTravellerCount(),
                    trip.getStatus(), trip.getDestinations(),
                    trip.getActivities().stream().map(ActivityResponse::from).toList());
        }
    }

    public record StatusRequest(@NotNull Trip.Status status) {}
}
