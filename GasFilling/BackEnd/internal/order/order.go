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
	StatusPending         OrderStatus = "pending"
	StatusVendorAccepted  OrderStatus = "vendor_accepted"
	StatusRejected        OrderStatus = "rejected"
	StatusPreparing       OrderStatus = "preparing"
	StatusReadyForPickup  OrderStatus = "ready_for_pickup"
	StatusOutForDelivery  OrderStatus = "out_for_delivery"
	StatusDelivered       OrderStatus = "delivered"
	StatusCompleted       OrderStatus = "completed"
	StatusCancelled       OrderStatus = "cancelled"
)


type Order struct {
	ID              string           `json:"id"`
	CustomerID      string           `json:"customerId"`
	VendorID        string           `json:"vendorId"`
	Type            OrderType        `json:"type"`
	Fulfillment     FulfillmentType  `json:"fulfillment"`
	WeightKg        float64          `json:"weightKg"`
	GasCost         float64          `json:"gasCost"`
	DeliveryFee     float64          `json:"deliveryFee"`
	TotalAmount     float64          `json:"totalAmount"`
	Latitude        float64          `json:"latitude"`
	Longitude       float64          `json:"longitude"`
	Status          OrderStatus      `json:"status"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
}