package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"gasfill/internal/rider"
)

type RiderHandler struct {
	riderService *rider.Service
}

func NewRiderHandler(riderService *rider.Service) *RiderHandler {
	return &RiderHandler{
		riderService: riderService,
	}
}

type RegisterRiderRequest struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *RiderHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRiderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	newRider := h.riderService.AddRider(
		req.Name,
		req.Phone,
		req.Email,
		req.Password,
	)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"rider":   newRider,
	})
}

func (h *RiderHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest // Email + Password fields match LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	loggedInRider, err := h.riderService.Login(req.Email, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"rider":   loggedInRider,
	})
}

type UpdateRiderStatusRequest struct {
	Status string `json:"status"`
}

func (h *RiderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPatch && r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/riders/")
	id = strings.TrimSuffix(id, "/status")

	var req UpdateRiderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.riderService.UpdateStatus(id, req.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"rider":   updated,
	})
}

type UpdateRiderLocationRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func (h *RiderHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPatch && r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/riders/")
	id = strings.TrimSuffix(id, "/location")

	var req UpdateRiderLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.riderService.UpdateLocation(id, req.Latitude, req.Longitude)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"rider":   updated,
	})
}

func (h *RiderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/riders/")

	if strings.HasSuffix(r.URL.Path, "/status") {
		h.UpdateStatus(w, r)
		return
	}

	if strings.HasSuffix(r.URL.Path, "/location") {
		h.UpdateLocation(w, r)
		return
	}

	rd, err := h.riderService.GetRiderByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, rd)
}

func (h *RiderHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	riders := h.riderService.GetAllRiders()

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"riders":  riders,
	})
}
