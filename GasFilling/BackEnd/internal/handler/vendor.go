package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"gasfill/internal/vendor"
)

type VendorHandler struct {
	vendorService *vendor.Service
}

func NewVendorHandler(
	vendorService *vendor.Service,
) *VendorHandler {
	return &VendorHandler{
		vendorService: vendorService,
	}
}

type RegisterVendorRequest struct {
	Name      string  `json:"name"`
	Phone     string  `json:"phone"`
	Email     string  `json:"email"`
	Password  string  `json:"password"`
	Address   string  `json:"address"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func (h *VendorHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterVendorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	newVendor, err := h.vendorService.RegisterVendor(
		req.Name,
		req.Phone,
		req.Email,
		req.Password,
		req.Address,
		req.Latitude,
		req.Longitude,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"vendor":  newVendor,
	})
}

func (h *VendorHandler) Login(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var request LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(
			w,
			"invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	loggedInVendor, err :=
		h.vendorService.Login(
			request.Email,
			request.Password,
		)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusUnauthorized,
		)
		return
	}

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"vendor":  loggedInVendor,
		},
	)
}

type UpdateInventoryRequest struct {
	VendorID         string  `json:"vendorId"`
	WeightKg         float64 `json:"weightKg"`
	PricePerKg       float64 `json:"pricePerKg"`
	AvailableStockKg float64 `json:"availableStockKg"`
	Available        bool    `json:"available"`
}

func (h *VendorHandler) AddOrUpdateInventory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UpdateInventoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	inv, err := h.vendorService.AddInventoryWithStock(
		req.VendorID,
		req.WeightKg,
		req.PricePerKg,
		req.AvailableStockKg,
		req.Available,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":   true,
		"inventory": inv,
	})
}

func (h *VendorHandler) GetInventory(w http.ResponseWriter, r *http.Request) {
	vendorID := strings.TrimPrefix(r.URL.Path, "/api/vendors/")
	vendorID = strings.TrimSuffix(vendorID, "/inventory")

	invList := h.vendorService.GetVendorInventory(vendorID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":   true,
		"inventory": invList,
	})
}

func (h *VendorHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vendorID := strings.TrimPrefix(r.URL.Path, "/api/vendors/")
	vendorID = strings.TrimSuffix(vendorID, "/profile")

	var req RegisterVendorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.vendorService.UpdateVendorProfile(
		vendorID,
		req.Name,
		req.Phone,
		req.Address,
		req.Latitude,
		req.Longitude,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"vendor":  updated,
	})
}

func (h *VendorHandler) GetAll(
	w http.ResponseWriter,
	r *http.Request,
) {

	vendors :=
		h.vendorService.GetAllVendors()

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"vendors": vendors,
		},
	)
}

func (h *VendorHandler) GetByID(
	w http.ResponseWriter,
	r *http.Request,
) {

	id := strings.TrimPrefix(
		r.URL.Path,
		"/api/vendors/",
	)

	if strings.HasSuffix(r.URL.Path, "/inventory") {
		h.GetInventory(w, r)
		return
	}

	vendorData, err :=
		h.vendorService.GetVendorByID(id)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusNotFound,
		)
		return
	}

	writeJSON(
		w,
		http.StatusOK,
		vendorData,
	)
}