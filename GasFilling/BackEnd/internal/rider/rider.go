package rider

type Rider struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"-"`
	Active   bool   `json:"active"`
}
