package com.wayfarer.trip;

import com.wayfarer.trip.TripDtos.StatusRequest;
import com.wayfarer.trip.TripDtos.ActivityRequest;
import com.wayfarer.trip.TripDtos.TripRequest;
import com.wayfarer.trip.TripDtos.TripResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TripService {
    private final TripRepository trips;

    public TripService(TripRepository trips) {
        this.trips = trips;
    }

    @Transactional(readOnly = true)
    public List<TripResponse> findAll() {
        return trips.findAllByOrderByStartDateAsc().stream().map(TripResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public TripResponse findById(long id) {
        return TripResponse.from(requireTrip(id));
    }

    @Transactional
    public TripResponse create(TripRequest request) {
        Trip trip = trips.save(toEntity(request));
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse update(long id, TripRequest request) {
        Trip trip = requireTrip(id);
        trip.updateFrom(toEntity(request));
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse updateStatus(long id, StatusRequest request) {
        Trip trip = requireTrip(id);
        trip.setStatus(request.status());
        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse duplicate(long id) {
        Trip source = requireTrip(id);
        Trip copy = trips.save(new Trip(source.getName() + " (copy)", source.getDescription(),
                source.getCoverImageUrl(), source.getStartDate(), source.getEndDate(),
                source.getTotalBudget(), source.getCurrency(), source.getTravellerCount(),
                Trip.Status.PLANNING, source.getDestinations(), source.getActivities()));
        return TripResponse.from(copy);
    }

    public void delete(long id) {
        if (!trips.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found.");
        }
        trips.deleteById(id);
    }

    private Trip requireTrip(long id) {
        return trips.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found."));
    }

    private Trip toEntity(TripRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be on or after start date.");
        }
        List<ItineraryActivity> activities = request.activities() == null ? List.of()
                : request.activities().stream().map(TripService::toActivity).toList();
        int tripDays = (int) (request.endDate().toEpochDay() - request.startDate().toEpochDay()) + 1;
        if (activities.stream().anyMatch(activity -> activity.getDayNumber() > tripDays)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An activity day falls outside this trip.");
        }
        return new Trip(request.name().trim(), request.description(), request.coverImageUrl(),
                request.startDate(), request.endDate(), request.totalBudget(),
                request.currency().trim().toUpperCase(), request.travellerCount(),
                request.status(), request.destinations() == null ? List.of() : request.destinations(),
                activities);
    }

    private static ItineraryActivity toActivity(ActivityRequest activity) {
        return new ItineraryActivity(activity.dayNumber(), activity.time(), activity.title().trim(),
                activity.location(), activity.category(), activity.notes(), activity.estimatedCost());
    }
}
