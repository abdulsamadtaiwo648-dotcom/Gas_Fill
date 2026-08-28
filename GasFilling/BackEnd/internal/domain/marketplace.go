package domain

import (
	"time"
)

// User Roles in the GasFill Ecosystem
type UserRole string

const (
	RoleConsumer  UserRole = "CONSUMER"
	RoleRetailer  UserRole = "RETAILER" // Vendor
	RoleSupplier  UserRole = "SUPPLIER" // LPG Bulk Depot / Terminal
	RoleLogistics UserRole = "LOGISTICS" // Rider / Driver
)

// Consumer Entity
type Consumer struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Address   string    `json:"address"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	CreatedAt time.Time `json:"createdAt"`
}

// Retailer Entity (Extends Vendor)
type Retailer struct {
	ID          string    `json:"id"`
	BusinessName string   `json:"businessName"`
	ContactPhone string   `json:"contactPhone"`
	Email       string    `json:"email"`
	Address     string    `json:"address"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Verified    bool      `json:"verified"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Supplier Entity (LPG Wholesaler / Plant)
type Supplier struct {
	ID          string    `json:"id"`
	PlantName   string    `json:"plantName"`
	Phone       string    `json:"phone"`
	Email       string    `json:"email"`
	Address     string    `json:"address"`
	MinOrderKg  float64   `json:"minOrderKg"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Verified    bool      `json:"verified"`
	CreatedAt   time.Time `json:"createdAt"`
}

// LogisticsPartner Entity (Rider / Tanker Driver)
type LogisticsPartner struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	VehicleType  string    `json:"vehicleType"` // Bike, Truck, Tanker
	Status       string    `json:"status"`      // AVAILABLE, BUSY, OFFLINE
	CurrentLat   float64   `json:"currentLat"`
	CurrentLng   float64   `json:"currentLng"`
	LastUpdated  time.Time `json:"lastUpdated"`
}

// Listing Types
type ListingType string

const (
	ListingBulkGas        ListingType = "BULK_GAS"        // Wholesaler to Retailer
	ListingRefillGas      ListingType = "REFILL_GAS"      // Retailer to Consumer
	ListingCylinderSupply ListingType = "CYLINDER_SUPPLY" // Manufacturer/Retailer Cylinder
)

// Listing Item with Live Availability and Price
type MarketplaceListing struct {
	ID             string      `json:"id"`
	SellerID       string      `json:"sellerId"`   // RetailerID or SupplierID
	SellerRole     UserRole    `json:"sellerRole"` // RETAILER or SUPPLIER
	Title          string      `json:"title"`
	ListingType    ListingType `json:"listingType"`
	WeightKg       float64     `json:"weightKg"`
	UnitPrice      float64     `json:"unitPrice"`
	AvailableStock float64     `json:"availableStock"`
	InStock        bool        `json:"inStock"`
	LastUpdated    time.Time   `json:"lastUpdated"`
}

// Procurement Order (Retailer purchasing inventory from Supplier)
type ProcurementOrder struct {
	ID           string    `json:"id"`
	RetailerID   string    `json:"retailerId"`
	SupplierID   string    `json:"supplierId"`
	QuantityKg   float64   `json:"quantityKg"`
	PricePerKg   float64   `json:"pricePerKg"`
	TotalCost    float64   `json:"totalCost"`
	Status       string    `json:"status"` // PENDING, CONFIRMED, DISPATCHED, DELIVERED
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
