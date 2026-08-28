package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"gasfill/internal/order"
	"gasfill/internal/rider"
	"gasfill/internal/vendor"
)

type OrderHandler struct {
	orderService *order.Service
	vendorService *vendor.Service
	riderService *rider.Service
}

func NewOrderHandler(
	orderService *order.Service,
	vendorService *vendor.Service,
	riderService *rider.Service,
) *OrderHandler {
	return &OrderHandler{
		orderService:  orderService,
		vendorService: vendorService,
		riderService:  riderService,
	}
}

type CreateRefillOrderRequest struct {
	CustomerID    string                `json:"customerId"`
	VendorID      string                `json:"vendorId"`
	VendorName    string                `json:"vendorName"`
	VendorAddress string                `json:"vendorAddress"`
	Fulfillment   order.FulfillmentType `json:"fulfillment"`
	WeightKg      float64               `json:"weightKg"`
	PricePerKg    float64               `json:"pricePerKg"`
	DeliveryFee   float64               `json:"deliveryFee"`
	Latitude      float64               `json:"latitude"`
	Longitude     float64               `json:"longitude"`
}

func (h *OrderHandler) CreateRefillOrder(
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

	var request CreateRefillOrderRequest

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

	// Lookup vendor details if missing in request
	vendorName := request.VendorName
	vendorAddress := request.VendorAddress
	if h.vendorService != nil && (vendorName == "" || vendorAddress == "") {
		if v, err := h.vendorService.GetVendorByID(request.VendorID); err == nil {
			if vendorName == "" {
				vendorName = v.Name
			}
			if vendorAddress == "" {
				vendorAddress = v.Address
			}
		}
	}

	newOrder, err :=
		h.orderService.CreateRefillOrder(
			request.CustomerID,
			request.VendorID,
			vendorName,
			vendorAddress,
			request.Fulfillment,
			request.WeightKg,
			request.PricePerKg,
			request.DeliveryFee,
			request.Latitude,
			request.Longitude,
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
			"success": true,
			"order":   newOrder,
		},
	)
}

func (h *OrderHandler) GetOrder(
	w http.ResponseWriter,
	r *http.Request,
) {

	id := strings.TrimPrefix(
		r.URL.Path,
		"/api/orders/",
	)

	currentOrder, err :=
		h.orderService.GetOrderByID(id)

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
		currentOrder,
	)
}

func (h *OrderHandler) GetCustomerOrders(
	w http.ResponseWriter,
	r *http.Request,
) {

	customerID := strings.TrimPrefix(
		r.URL.Path,
		"/api/orders/customer/",
	)

	orders :=
		h.orderService.GetCustomerOrders(
			customerID,
		)

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"orders":  orders,
		},
	)
}

func (h *OrderHandler) GetVendorOrders(
	w http.ResponseWriter,
	r *http.Request,
) {

	vendorID := strings.TrimPrefix(
		r.URL.Path,
		"/api/orders/vendor/",
	)

	orders :=
		h.orderService.GetVendorOrders(
			vendorID,
		)

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"orders":  orders,
		},
	)
}

func (h *OrderHandler) GetRiderOrders(
	w http.ResponseWriter,
	r *http.Request,
) {

	riderID := strings.TrimPrefix(
		r.URL.Path,
		"/api/orders/rider/",
	)

	orders := h.orderService.GetRiderOrders(riderID)

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"orders":  orders,
		},
	)
}

func (h *OrderHandler) GetAvailableDeliveries(
	w http.ResponseWriter,
	r *http.Request,
) {

	orders := h.orderService.GetAvailableDeliveries()

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"orders":  orders,
		},
	)
}

type AssignRiderRequest struct {
	RiderID string `json:"riderId"`
}

func (h *OrderHandler) AssignRider(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPost && r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	orderID := strings.TrimPrefix(r.URL.Path, "/api/orders/")
	orderID = strings.TrimSuffix(orderID, "/assign-rider")

	var req AssignRiderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	riderName := "Rider"
	riderPhone := ""
	if h.riderService != nil && req.RiderID != "" {
		if rd, err := h.riderService.GetRiderByID(req.RiderID); err == nil {
			riderName = rd.Name
			riderPhone = rd.Phone
		}
	}

	updatedOrder, err := h.orderService.AssignRider(orderID, req.RiderID, riderName, riderPhone)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"order":   updatedOrder,
	})
}

type CancelOrderRequest struct {
	CustomerID string `json:"customerId"`
}

func (h *OrderHandler) CancelOrder(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPost && r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	orderID := strings.TrimPrefix(r.URL.Path, "/api/orders/")
	orderID = strings.TrimSuffix(orderID, "/cancel")

	var req CancelOrderRequest
	json.NewDecoder(r.Body).Decode(&req)

	updatedOrder, err := h.orderService.CancelOrder(orderID, req.CustomerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"order":   updatedOrder,
	})
}

type UpdateOrderStatusRequest struct {
	Status order.OrderStatus `json:"status"`
}

func (h *OrderHandler) UpdateStatus(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPatch && r.Method != http.MethodPost {
		http.Error(
			w,
			"method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	orderID := strings.TrimPrefix(
		r.URL.Path,
		"/api/orders/",
	)

	orderID = strings.TrimSuffix(
		orderID,
		"/status",
	)

	var request UpdateOrderStatusRequest

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

	// Fetch current order to check if status is changing to ACCEPTED
	existingOrder, _ := h.orderService.GetOrderByID(orderID)

	updatedOrder, err :=
		h.orderService.UpdateOrderStatus(
			orderID,
			request.Status,
		)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)
		return
	}

	// Deduct stock if order becomes ACCEPTED
	if (request.Status == order.StatusAccepted || strings.EqualFold(string(request.Status), "accepted") || strings.EqualFold(string(request.Status), "confirmed")) &&
		existingOrder.Status != order.StatusAccepted && h.vendorService != nil {
		h.vendorService.DeductInventoryStock(updatedOrder.VendorID, updatedOrder.WeightKg)
	}

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"order":   updatedOrder,
		},
	)
}