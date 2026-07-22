package order

import "errors"

func ValidateRefillOrder(
	customerID string,
	vendorID string,
	weightKg float64,
	pricePerKg float64,
) error {

	if customerID == "" {
		return errors.New(
			"customer ID is required",
		)
	}

	if vendorID == "" {
		return errors.New(
			"vendor ID is required",
		)
	}

	if weightKg <= 0 {
		return errors.New(
			"gas weight must be greater than zero",
		)
	}

	if pricePerKg <= 0 {
		return errors.New(
			"price per kg must be greater than zero",
		)
	}

	return nil
}