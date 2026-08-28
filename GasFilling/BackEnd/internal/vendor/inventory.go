package vendor

import "time"

type GasInventory struct {
	ID               string    `json:"id"`
	VendorID         string    `json:"vendorId"`
	WeightKg         float64   `json:"weightKg"`
	PricePerKg       float64   `json:"pricePerKg"`
	AvailableStockKg float64   `json:"availableStockKg"`
	Available        bool      `json:"available"`
	Status           string    `json:"status"` // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
	LastUpdated      time.Time `json:"lastUpdated"`
}