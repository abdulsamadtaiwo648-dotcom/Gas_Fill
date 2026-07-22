package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"gasfill/internal/customer"
)

type CustomerHandler struct {
	customerService *customer.Service
}

func NewCustomerHandler(
	customerService *customer.Service,
) *CustomerHandler {
	return &CustomerHandler{
		customerService: customerService,
	}
}

type RegisterCustomerRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *CustomerHandler) Register(
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

	var request RegisterCustomerRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(
			w,
			"invalid request body",
			http.StatusBadRequest,
		)
		return
	}

	newCustomer, err := h.customerService.Register(
		request.FirstName,
		request.LastName,
		request.Phone,
		request.Email,
		request.Password,
	)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)
		return
	}

	writeJSON(
		w,
		http.StatusCreated,
		map[string]interface{}{
			"success":  true,
			"customer": newCustomer,
		},
	)
}

func (h *CustomerHandler) Login(
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

	customerAccount, err :=
		h.customerService.Login(
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
			"success":  true,
			"customer": customerAccount,
		},
	)
}

func (h *CustomerHandler) GetByID(
	w http.ResponseWriter,
	r *http.Request,
) {

	id := strings.TrimPrefix(
		r.URL.Path,
		"/api/customers/",
	)

	if id == "" {
		http.Error(
			w,
			"customer ID is required",
			http.StatusBadRequest,
		)
		return
	}

	customerAccount, err :=
		h.customerService.GetCustomerByID(id)

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
		customerAccount,
	)
}

func (h *CustomerHandler) GetAll(
	w http.ResponseWriter,
	r *http.Request,
) {

	customers :=
		h.customerService.GetAllCustomers()

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success":   true,
			"customers": customers,
		},
	)
}