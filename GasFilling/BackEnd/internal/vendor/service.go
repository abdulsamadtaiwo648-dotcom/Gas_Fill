package vendor

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"gasfill/internal/location"
)

type Service struct {
	vendors    map[string]Vendor
	inventory  []GasInventory
	nextVendor int
	nextItem   int
}

type VendorSearchResult struct {
	Vendor       Vendor  `json:"vendor"`
	WeightKg     float64 `json:"weightKg"`
	PricePerKg   float64 `json:"pricePerKg"`
	TotalGasCost float64 `json:"totalGasCost"`
	DistanceKm   float64 `json:"distanceKm"`
}

func NewService() *Service {
	return &Service{
		vendors: make(map[string]Vendor),
	}
}

func (s *Service) AddVendor(
	name string,
	phone string,
	email string,
	password string,
	address string,
	latitude float64,
	longitude float64,
) Vendor {

	s.nextVendor++

	vendorID := fmt.Sprintf(
		"VEN-%03d",
		s.nextVendor,
	)

	newVendor := Vendor{
		ID:        vendorID,
		Name:      name,
		Phone:     phone,
		Email:     strings.ToLower(email),
		Password:  password,
		Address:   address,
		Latitude:  latitude,
		Longitude: longitude,
		Verified:  true,
		Active:    true,
	}

	s.vendors[vendorID] = newVendor

	return newVendor
}

func (s *Service) RegisterVendor(
	name string,
	phone string,
	email string,
	password string,
	address string,
	latitude float64,
	longitude float64,
) (Vendor, error) {

	email = strings.TrimSpace(strings.ToLower(email))
	if name == "" || email == "" || password == "" {
		return Vendor{}, errors.New("business name, email, and password are required")
	}

	for _, existing := range s.vendors {
		if existing.Email == email {
			return Vendor{}, errors.New("vendor email already registered")
		}
	}

	if latitude == 0 && longitude == 0 {
		// Default fallback location for Nigeria (Port Harcourt region if unprovided)
		latitude = 5.121
		longitude = 7.373
	}

	return s.AddVendor(name, phone, email, password, address, latitude, longitude), nil
}

func (s *Service) Login(
	email string,
	password string,
) (Vendor, error) {

	email = strings.TrimSpace(
		strings.ToLower(email),
	)

	password = strings.TrimSpace(password)

	for _, vendor := range s.vendors {

		if (strings.EqualFold(vendor.Email, email) || strings.EqualFold(vendor.ID, email)) &&
			vendor.Password == password {

			if !vendor.Active {
				return Vendor{}, errors.New(
					"vendor account is inactive",
				)
			}

			return vendor, nil
		}
	}

	return Vendor{}, errors.New(
		"invalid email or password",
	)
}

func (s *Service) UpdateVendorProfile(
	vendorID string,
	name string,
	phone string,
	address string,
	latitude float64,
	longitude float64,
) (Vendor, error) {

	v, exists := s.vendors[vendorID]
	if !exists {
		return Vendor{}, errors.New("vendor not found")
	}

	if name != "" {
		v.Name = name
	}
	if phone != "" {
		v.Phone = phone
	}
	if address != "" {
		v.Address = address
	}
	if latitude != 0 {
		v.Latitude = latitude
	}
	if longitude != 0 {
		v.Longitude = longitude
	}

	s.vendors[vendorID] = v
	return v, nil
}

func calculateStockStatus(availableStockKg float64, available bool) string {
	if !available || availableStockKg <= 0 {
		return "OUT_OF_STOCK"
	}
	if availableStockKg <= 50 {
		return "LOW_STOCK"
	}
	return "IN_STOCK"
}

func (s *Service) AddInventory(
	vendorID string,
	weightKg float64,
	pricePerKg float64,
	available bool,
) (GasInventory, error) {

	return s.AddInventoryWithStock(vendorID, weightKg, pricePerKg, 500.0, available)
}

func (s *Service) AddInventoryWithStock(
	vendorID string,
	weightKg float64,
	pricePerKg float64,
	availableStockKg float64,
	available bool,
) (GasInventory, error) {

	_, exists := s.vendors[vendorID]

	if !exists {
		return GasInventory{}, errors.New(
			"vendor not found",
		)
	}

	if weightKg <= 0 {
		return GasInventory{}, errors.New(
			"gas weight must be greater than zero",
		)
	}

	if pricePerKg <= 0 {
		return GasInventory{}, errors.New(
			"price must be greater than zero",
		)
	}

	// Update existing inventory record for this vendor and weight if present
	for i, item := range s.inventory {
		if item.VendorID == vendorID && item.WeightKg == weightKg {
			s.inventory[i].PricePerKg = pricePerKg
			s.inventory[i].AvailableStockKg = availableStockKg
			s.inventory[i].Available = available
			s.inventory[i].Status = calculateStockStatus(availableStockKg, available)
			s.inventory[i].LastUpdated = time.Now()
			return s.inventory[i], nil
		}
	}

	s.nextItem++

	status := calculateStockStatus(availableStockKg, available)

	item := GasInventory{
		ID:               fmt.Sprintf("INV-%03d", s.nextItem),
		VendorID:         vendorID,
		WeightKg:         weightKg,
		PricePerKg:       pricePerKg,
		AvailableStockKg: availableStockKg,
		Available:        available,
		Status:           status,
		LastUpdated:      time.Now(),
	}

	s.inventory = append(
		s.inventory,
		item,
	)

	return item, nil
}

func (s *Service) UpdateInventory(
	inventoryID string,
	pricePerKg float64,
	availableStockKg float64,
	available bool,
) (GasInventory, error) {

	for i, item := range s.inventory {
		if item.ID == inventoryID {
			if pricePerKg > 0 {
				s.inventory[i].PricePerKg = pricePerKg
			}
			s.inventory[i].AvailableStockKg = availableStockKg
			s.inventory[i].Available = available
			s.inventory[i].Status = calculateStockStatus(availableStockKg, available)
			s.inventory[i].LastUpdated = time.Now()
			return s.inventory[i], nil
		}
	}

	return GasInventory{}, errors.New("inventory item not found")
}

func (s *Service) DeductInventoryStock(vendorID string, weightKg float64) error {
	for i, item := range s.inventory {
		if item.VendorID == vendorID && item.WeightKg == weightKg {
			if item.AvailableStockKg < weightKg {
				return fmt.Errorf("insufficient stock: required %.1f kg, available %.1f kg", weightKg, item.AvailableStockKg)
			}
			s.inventory[i].AvailableStockKg -= weightKg
			if s.inventory[i].AvailableStockKg <= 0 {
				s.inventory[i].AvailableStockKg = 0
				s.inventory[i].Available = false
			}
			s.inventory[i].Status = calculateStockStatus(s.inventory[i].AvailableStockKg, s.inventory[i].Available)
			s.inventory[i].LastUpdated = time.Now()
			return nil
		}
	}
	return nil // If specific inventory row is not strictly tracked, allow order to proceed
}

func (s *Service) GetVendorInventory(vendorID string) []GasInventory {
	var results []GasInventory
	for _, item := range s.inventory {
		if item.VendorID == vendorID {
			results = append(results, item)
		}
	}
	return results
}

func (s *Service) GetVendorByID(
	id string,
) (Vendor, error) {

	vendor, exists := s.vendors[id]

	if !exists {
		return Vendor{}, errors.New(
			"vendor not found",
		)
	}

	return vendor, nil
}

func (s *Service) GetAllVendors() []Vendor {

	result := make(
		[]Vendor,
		0,
		len(s.vendors),
	)

	for _, vendor := range s.vendors {
		result = append(
			result,
			vendor,
		)
	}

	return result
}

func (s *Service) FindNearbyVendors(
	customerLocation location.Coordinate,
	weightKg float64,
	maxDistanceKm float64,
) []VendorSearchResult {

	var results []VendorSearchResult

	for _, inventory := range s.inventory {

		if !inventory.Available || inventory.Status == "OUT_OF_STOCK" {
			continue
		}

		if inventory.WeightKg != weightKg {
			continue
		}

		vendorData, exists :=
			s.vendors[inventory.VendorID]

		if !exists {
			continue
		}

		if !vendorData.Active ||
			!vendorData.Verified {
			continue
		}

		vendorLocation :=
			location.Coordinate{
				Latitude:  vendorData.Latitude,
				Longitude: vendorData.Longitude,
			}

		distance := location.DistanceKm(
			customerLocation,
			vendorLocation,
		)

		if distance > maxDistanceKm {
			continue
		}

		totalGasCost :=
			weightKg * inventory.PricePerKg

		results = append(
			results,
			VendorSearchResult{
				Vendor:       vendorData,
				WeightKg:     weightKg,
				PricePerKg:   inventory.PricePerKg,
				TotalGasCost: totalGasCost,
				DistanceKm:   distance,
			},
		)
	}

	sort.Slice(
		results,
		func(i, j int) bool {
			return results[i].DistanceKm <
				results[j].DistanceKm
		},
	)

	return results
}

func (s *Service) FindAvailableGas(
	weightKg float64,
) []GasInventory {

	var results []GasInventory

	for _, item := range s.inventory {

		if item.WeightKg == weightKg &&
			item.Available {

			results = append(
				results,
				item,
			)
		}
	}

	return results
}