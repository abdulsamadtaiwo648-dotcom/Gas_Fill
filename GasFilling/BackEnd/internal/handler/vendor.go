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