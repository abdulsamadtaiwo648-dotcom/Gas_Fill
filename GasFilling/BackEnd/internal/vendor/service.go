package vendor

import (
	"errors"
	"fmt"
	"sort"
	"strings"

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

func (s *Service) AddInventory(
	vendorID string,
	weightKg float64,
	pricePerKg float64,
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

	s.nextItem++

	item := GasInventory{
		ID:         fmt.Sprintf("INV-%03d", s.nextItem),
		VendorID:   vendorID,
		WeightKg:   weightKg,
		PricePerKg: pricePerKg,
		Available:  available,
	}

	s.inventory = append(
		s.inventory,
		item,
	)

	return item, nil
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

		if !inventory.Available {
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
				Latitude: vendorData.Latitude,
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