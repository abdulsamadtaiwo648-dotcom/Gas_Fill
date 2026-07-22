package customer

import (
	"errors"
	"fmt"
	"strings"
)

type Service struct {
	customers   map[string]Customer
	nextCustomer int
}

func NewService() *Service {
	return &Service{
		customers: make(map[string]Customer),
	}
}

func (s *Service) Register(
	firstName string,
	lastName string,
	phone string,
	email string,
	password string,
) (Customer, error) {

	firstName = strings.TrimSpace(firstName)
	lastName = strings.TrimSpace(lastName)
	phone = strings.TrimSpace(phone)
	email = strings.TrimSpace(strings.ToLower(email))

	if firstName == "" ||
		lastName == "" ||
		phone == "" ||
		email == "" ||
		password == "" {

		return Customer{}, errors.New(
			"all fields are required",
		)
	}

	for _, existingCustomer := range s.customers {

		if existingCustomer.Email == email {

			return Customer{}, errors.New(
				"email already registered",
			)
		}
	}

	id := fmt.Sprintf(
		"CUS-%03d",
		s.nextCustomer+1,
	)

	newCustomer := Customer{
		ID:         id,
		FirstName:  firstName,
		LastName:   lastName,
		Phone:      phone,
		Email:      email,
		Password:   password,
	}

	s.customers[id] = newCustomer

	s.nextCustomer++

	return newCustomer, nil
}

func (s *Service) Login(
	email string,
	password string,
) (Customer, error) {

	email = strings.TrimSpace(
		strings.ToLower(email),
	)

	for _, customer := range s.customers {

		if customer.Email == email &&
			customer.Password == password {

			return customer, nil
		}
	}

	return Customer{}, errors.New(
		"invalid email or password",
	)
}

func (s *Service) GetCustomerByID(
	id string,
) (Customer, error) {

	customer, exists :=
		s.customers[id]

	if !exists {

		return Customer{}, errors.New(
			"customer not found",
		)
	}

	return customer, nil
}

func (s *Service) GetAllCustomers() []Customer {

	customers := make(
		[]Customer,
		0,
		len(s.customers),
	)

	for _, customer := range s.customers {

		customers = append(
			customers,
			customer,
		)
	}

	return customers
}