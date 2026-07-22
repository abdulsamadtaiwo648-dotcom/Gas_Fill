package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"gasfill/internal/order"
)

type OrderHandler struct {
	orderService *order.Service
}

func NewOrderHandler(
	orderService *order.Service,
) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

type CreateRefillOrderRequest struct {
	CustomerID  string                 `json:"customerId"`
	VendorID    string                 `json:"vendorId"`
	Fulfillment order.FulfillmentType  `json:"fulfillment"`
	WeightKg    float64                `json:"weightKg"`
	PricePerKg  float64                `json:"pricePerKg"`
	DeliveryFee float64                `json:"deliveryFee"`
	Latitude    float64                `json:"latitude"`
	Longitude   float64                `json:"longitude"`
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

	newOrder, err :=
		h.orderService.CreateRefillOrder(
			request.CustomerID,
			request.VendorID,
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

type UpdateOrderStatusRequest struct {
	Status order.OrderStatus `json:"status"`
}

func (h *OrderHandler) UpdateStatus(
	w http.ResponseWriter,
	r *http.Request,
) {

	if r.Method != http.MethodPatch {
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

	writeJSON(
		w,
		http.StatusOK,
		map[string]interface{}{
			"success": true,
			"order":   updatedOrder,
		},
	)
}