package product

import (
	"errors"
	"fmt"
)

type ProductType string

const (
	ProductGas      ProductType = "gas"
	ProductCylinder ProductType = "cylinder"
)

type Product struct {
	ID          string      `json:"id"`
	VendorID    string      `json:"vendorId"`
	Name        string      `json:"name"`
	Type        ProductType `json:"type"`
	Description string      `json:"description"`
	WeightKg    float64     `json:"weightKg"`
	Price       float64     `json:"price"`
	Available   bool        `json:"available"`
}

type Service struct {
	products    map[string]Product
	nextProduct int
}

func NewService() *Service {
	return &Service{
		products: make(map[string]Product),
	}
}

func (s *Service) AddProduct(
	vendorID string,
	name string,
	productType ProductType,
	description string,
	weightKg float64,
	price float64,
	available bool,
) (Product, error) {

	if vendorID == "" {
		return Product{}, errors.New(
			"vendor ID is required",
		)
	}

	if name == "" {
		return Product{}, errors.New(
			"product name is required",
		)
	}

	if price <= 0 {
		return Product{}, errors.New(
			"product price must be greater than zero",
		)
	}

	if productType != ProductGas &&
		productType != ProductCylinder {

		return Product{}, errors.New(
			"invalid product type",
		)
	}

	if productType == ProductGas &&
		weightKg <= 0 {

		return Product{}, errors.New(
			"gas weight must be greater than zero",
		)
	}

	s.nextProduct++

	productID := fmt.Sprintf(
		"PROD-%04d",
		s.nextProduct,
	)

	newProduct := Product{
		ID:          productID,
		VendorID:    vendorID,
		Name:        name,
		Type:        productType,
		Description: description,
		WeightKg:    weightKg,
		Price:       price,
		Available:   available,
	}

	s.products[productID] =
		newProduct

	return newProduct, nil
}

func (s *Service) GetProductByID(
	id string,
) (Product, error) {

	product, exists :=
		s.products[id]

	if !exists {
		return Product{}, errors.New(
			"product not found",
		)
	}

	return product, nil
}

func (s *Service) GetAllProducts() []Product {

	products := make(
		[]Product,
		0,
		len(s.products),
	)

	for _, product :=
		range s.products {

		products = append(
			products,
			product,
		)
	}

	return products
}

func (s *Service) GetProductsByType(
	productType ProductType,
) []Product {

	var results []Product

	for _, product :=
		range s.products {

		if product.Type ==
			productType &&
			product.Available {

			results = append(
				results,
				product,
			)
		}
	}

	return results
}

func (s *Service) GetVendorProducts(
	vendorID string,
) []Product {

	var results []Product

	for _, product :=
		range s.products {

		if product.VendorID ==
			vendorID {

			results = append(
				results,
				product,
			)
		}
	}

	return results
}

func (s *Service) SetAvailability(
	productID string,
	available bool,
) error {

	product, exists :=
		s.products[productID]

	if !exists {
		return errors.New(
			"product not found",
		)
	}

	product.Available =
		available

	s.products[productID] =
		product

	return nil
}