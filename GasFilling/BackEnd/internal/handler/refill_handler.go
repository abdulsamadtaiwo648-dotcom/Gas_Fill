package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gasfill/internal/location"
	"gasfill/internal/vendor"
)

type RefillHandler struct {
	vendorService *vendor.Service
}

func NewRefillHandler(
	vendorService *vendor.Service,
) *RefillHandler {
	return &RefillHandler{
		vendorService: vendorService,
	}
}

type NearbyVendorRequest struct {
	WeightKg    float64 `json:"weightKg"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	MaxDistance float64 `json:"maxDistanceKm"`
}

func (h *RefillHandler) FindNearbyVendors(
	w http.ResponseWriter,
	r *http.Request,
) {

	var request NearbyVendorRequest

	if r.Method == http.MethodPost {

		if err := json.NewDecoder(
			r.Body,
		).Decode(&request); err != nil {

			http.Error(
				w,
				"invalid request body",
				http.StatusBadRequest,
			)

			return
		}

	} else if r.Method == http.MethodGet {

		var err error

		request.WeightKg, err =
			strconv.ParseFloat(
				r.URL.Query().Get("weightKg"),
				64,
			)

		if err != nil {
			http.Error(
				w,
				"invalid weightKg",
				http.StatusBadRequest,
			)
			return
		}

		request.Latitude, err =
			strconv.ParseFloat(
				r.URL.Query().Get("latitude"),
				64,
			)

		if err != nil {
			http.Error(
				w,
				"invalid latitude",
				http.StatusBadRequest,
			)
			return
		}

		request.Longitude, err =
			strconv.ParseFloat(
				r.URL.Query().Get("longitude"),
				64,
			)

		if err != nil {
			http.Error(
				w,
				"invalid longitude",
				http.StatusBadRequest,
			)
			return
		}

	} else {

		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)

		return
	}

	if request.WeightKg <= 0 {
		http.Error(
			w,
			"weightKg must be greater than zero",
			http.StatusBadRequest,
		)
		return
	}

	if request.Latitude < -90 ||
		request.Latitude > 90 {

		http.Error(
			w,
			"invalid latitude",
			http.StatusBadRequest,
		)
		return
	}

	if request.Longitude < -180 ||
		request.Longitude > 180 {

		http.Error(
			w,
			"invalid longitude",
			http.StatusBadRequest,
		)
		return
	}

	if request.MaxDistance <= 0 {
		request.MaxDistance = 50
	}

	customerLocation :=
		location.Coordinate{
			Latitude:  request.Latitude,
			Longitude: request.Longitude,
		}

	results :=
		h.vendorService.FindNearbyVendors(
			customerLocation,
			request.WeightKg,
			request.MaxDistance,
		)

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"count":   len(results),
			"vendors": results,
		},
	)
}