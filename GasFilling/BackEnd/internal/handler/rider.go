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

func (h *RiderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/riders/")

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
