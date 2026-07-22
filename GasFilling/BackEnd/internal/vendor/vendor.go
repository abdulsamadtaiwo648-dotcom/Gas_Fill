package vendor

type Vendor struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Phone     string  `json:"phone"`
	Email     string  `json:"email"`
	Password  string  `json:"-"`
	Address   string  `json:"address"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Verified  bool    `json:"verified"`
	Active    bool    `json:"active"`
}
