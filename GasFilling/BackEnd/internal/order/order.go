package order

import "time"

type OrderType string

const (
	OrderTypeRefill   OrderType = "refill"
	OrderTypeGas      OrderType = "gas"
	OrderTypeCylinder OrderType = "cylinder"
)

type FulfillmentType string

const (
	FulfillmentPickup    FulfillmentType = "pickup"
	FulfillmentDelivery  FulfillmentType = "delivery"
)

type OrderStatus string

const (
	StatusPending       OrderStatus = "PENDING"
	StatusAccepted      OrderStatus = "ACCEPTED"
	StatusPreparing     OrderStatus = "PREPARING"
	StatusRiderAssigned OrderStatus = "RIDER_ASSIGNED"
	StatusPickedUp      OrderStatus = "PICKED_UP"
	StatusOutForDelivery OrderStatus = "OUT_FOR_DELIVERY"
	StatusDelivered     OrderStatus = "DELIVERED"
	StatusCancelled     OrderStatus = "CANCELLED"
)

type Order struct {
	ID            string          `json:"id"`
	CustomerID    string          `json:"customerId"`
	VendorID      string          `json:"vendorId"`
	VendorName    string          `json:"vendorName"`
	VendorAddress string          `json:"vendorAddress"`
	RiderID       string          `json:"riderId,omitempty"`
	RiderName     string          `json:"riderName,omitempty"`
	RiderPhone    string          `json:"riderPhone,omitempty"`
	Type          OrderType       `json:"type"`
	Fulfillment   FulfillmentType `json:"fulfillment"`
	WeightKg      float64         `json:"weightKg"`
	GasCost       float64         `json:"gasCost"`
	DeliveryFee   float64         `json:"deliveryFee"`
	TotalAmount   float64         `json:"totalAmount"`
	Latitude      float64         `json:"latitude"`
	Longitude     float64         `json:"longitude"`
	Status        OrderStatus     `json:"status"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}