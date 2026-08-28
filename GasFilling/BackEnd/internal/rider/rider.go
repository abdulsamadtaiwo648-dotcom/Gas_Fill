package rider

type Rider struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Phone     string  `json:"phone"`
	Email     string  `json:"email"`
	Password  string  `json:"-"`
	Status    string  `json:"status"` // AVAILABLE, BUSY, OFFLINE
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Active    bool    `json:"active"`
}
