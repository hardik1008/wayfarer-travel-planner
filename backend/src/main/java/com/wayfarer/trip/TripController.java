package com.wayfarer.trip;

import com.wayfarer.trip.TripDtos.StatusRequest;
import com.wayfarer.trip.TripDtos.TripRequest;
import com.wayfarer.trip.TripDtos.TripResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trips")
public class TripController {
    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping
    public List<TripResponse> findAll() {
        return tripService.findAll();
    }

    @GetMapping("/{id}")
    public TripResponse findById(@PathVariable long id) {
        return tripService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse create(@Valid @RequestBody TripRequest request) {
        return tripService.create(request);
    }

    @PutMapping("/{id}")
    public TripResponse update(@PathVariable long id, @Valid @RequestBody TripRequest request) {
        return tripService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public TripResponse updateStatus(@PathVariable long id, @Valid @RequestBody StatusRequest request) {
        return tripService.updateStatus(id, request);
    }

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse duplicate(@PathVariable long id) {
        return tripService.duplicate(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        tripService.delete(id);
    }
}
