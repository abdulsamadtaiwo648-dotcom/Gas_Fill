package order

import (
	"errors"
	"fmt"
	"time"
)

type Service struct {
	orders    map[string]Order
	nextOrder int
}

func NewService() *Service {
	return &Service{
		orders: make(map[string]Order),
	}
}

func (s *Service) CreateRefillOrder(
	customerID string,
	vendorID string,
	vendorName string,
	vendorAddress string,
	fulfillment FulfillmentType,
	weightKg float64,
	pricePerKg float64,
	deliveryFee float64,
	latitude float64,
	longitude float64,
) (Order, error) {

	if customerID == "" {
		return Order{}, errors.New(
			"customer ID is required",
		)
	}

	if vendorID == "" {
		return Order{}, errors.New(
			"vendor ID is required",
		)
	}

	if weightKg <= 0 {
		return Order{}, errors.New(
			"gas weight must be greater than zero",
		)
	}

	if pricePerKg <= 0 {
		return Order{}, errors.New(
			"price must be greater than zero",
		)
	}

	gasCost :=
		weightKg * pricePerKg

	totalAmount :=
		gasCost + deliveryFee

	s.nextOrder++

	orderID := fmt.Sprintf(
		"ORD-%04d",
		s.nextOrder,
	)

	now := time.Now()

	newOrder := Order{
		ID:            orderID,
		CustomerID:    customerID,
		VendorID:      vendorID,
		VendorName:    vendorName,
		VendorAddress: vendorAddress,
		Type:          OrderTypeRefill,
		Fulfillment:   fulfillment,
		WeightKg:      weightKg,
		GasCost:       gasCost,
		DeliveryFee:   deliveryFee,
		TotalAmount:   totalAmount,
		Latitude:      latitude,
		Longitude:     longitude,
		Status:        StatusPending,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	s.orders[orderID] = newOrder

	return newOrder, nil
}

func (s *Service) GetOrderByID(
	id string,
) (Order, error) {

	currentOrder, exists :=
		s.orders[id]

	if !exists {
		return Order{}, errors.New(
			"order not found",
		)
	}

	return currentOrder, nil
}

func (s *Service) GetCustomerOrders(
	customerID string,
) []Order {

	var results []Order

	for _, currentOrder :=
		range s.orders {

		if currentOrder.CustomerID ==
			customerID {

			results = append(
				results,
				currentOrder,
			)
		}
	}

	return results
}

func (s *Service) GetVendorOrders(
	vendorID string,
) []Order {

	var results []Order

	for _, currentOrder :=
		range s.orders {

		if currentOrder.VendorID ==
			vendorID {

			results = append(
				results,
				currentOrder,
			)
		}
	}

	return results
}

func (s *Service) GetRiderOrders(
	riderID string,
) []Order {

	var results []Order

	for _, currentOrder := range s.orders {
		if currentOrder.RiderID == riderID {
			results = append(results, currentOrder)
		}
	}

	return results
}

func (s *Service) GetAvailableDeliveries() []Order {

	var results []Order

	for _, currentOrder := range s.orders {
		// Deliveries ready for riders: ACCEPTED, PREPARING, or RIDER_ASSIGNED with no rider
		if currentOrder.Fulfillment == FulfillmentDelivery &&
			(currentOrder.Status == StatusAccepted ||
				currentOrder.Status == StatusPreparing ||
				currentOrder.Status == StatusRiderAssigned) {
			results = append(results, currentOrder)
		}
	}

	return results
}

func (s *Service) AssignRider(
	orderID string,
	riderID string,
	riderName string,
	riderPhone string,
) (Order, error) {

	currentOrder, exists := s.orders[orderID]
	if !exists {
		return Order{}, errors.New("order not found")
	}

	currentOrder.RiderID = riderID
	currentOrder.RiderName = riderName
	currentOrder.RiderPhone = riderPhone
	currentOrder.Status = StatusRiderAssigned
	currentOrder.UpdatedAt = time.Now()

	s.orders[orderID] = currentOrder

	return currentOrder, nil
}

func (s *Service) CancelOrder(
	orderID string,
	customerID string,
) (Order, error) {

	currentOrder, exists := s.orders[orderID]
	if !exists {
		return Order{}, errors.New("order not found")
	}

	if customerID != "" && currentOrder.CustomerID != customerID {
		return Order{}, errors.New("unauthorized to cancel this order")
	}

	if currentOrder.Status == StatusDelivered || currentOrder.Status == StatusCancelled {
		return Order{}, fmt.Errorf("cannot cancel order with status %s", currentOrder.Status)
	}

	currentOrder.Status = StatusCancelled
	currentOrder.UpdatedAt = time.Now()

	s.orders[orderID] = currentOrder

	return currentOrder, nil
}

func (s *Service) UpdateOrderStatus(
	orderID string,
	newStatus OrderStatus,
) (Order, error) {

	currentOrder, exists :=
		s.orders[orderID]

	if !exists {
		return Order{}, errors.New(
			"order not found",
		)
	}

	currentOrder.Status =
		newStatus

	currentOrder.UpdatedAt =
		time.Now()

	s.orders[orderID] =
		currentOrder

	return currentOrder, nil
}