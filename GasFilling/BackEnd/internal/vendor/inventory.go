package vendor

type GasInventory struct {
	ID          string  `json:"id"`
	VendorID    string  `json:"vendorId"`
	WeightKg    float64 `json:"weightKg"`
	PricePerKg  float64 `json:"pricePerKg"`
	Available   bool    `json:"available"`
}