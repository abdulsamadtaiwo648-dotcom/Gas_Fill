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
		ID:          orderID,
		CustomerID:  customerID,
		VendorID:    vendorID,
		Type:        OrderTypeRefill,
		Fulfillment: fulfillment,
		WeightKg:    weightKg,
		GasCost:     gasCost,
		DeliveryFee: deliveryFee,
		TotalAmount: totalAmount,
		Latitude:    latitude,
		Longitude:   longitude,
		Status:      StatusPending,
		CreatedAt:   now,
		UpdatedAt:   now,
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