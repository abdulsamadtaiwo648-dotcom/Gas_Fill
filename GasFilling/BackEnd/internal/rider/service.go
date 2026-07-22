package rider

import (
	"errors"
	"fmt"
	"strings"
)

type Service struct {
	riders    map[string]Rider
	nextRider int
}

func NewService() *Service {
	return &Service{
		riders: make(map[string]Rider),
	}
}

func (s *Service) AddRider(
	name string,
	phone string,
	email string,
	password string,
) Rider {
	s.nextRider++

	riderID := fmt.Sprintf(
		"RID-%03d",
		s.nextRider,
	)

	newRider := Rider{
		ID:       riderID,
		Name:     name,
		Phone:    phone,
		Email:    strings.ToLower(email),
		Password: password,
		Active:   true,
	}

	s.riders[riderID] = newRider

	return newRider
}

func (s *Service) Login(
	emailOrID string,
	password string,
) (Rider, error) {
	emailOrID = strings.TrimSpace(strings.ToLower(emailOrID))
	password = strings.TrimSpace(password)

	for _, rd := range s.riders {
		if (strings.EqualFold(rd.Email, emailOrID) || strings.EqualFold(rd.ID, emailOrID)) &&
			rd.Password == password {

			if !rd.Active {
				return Rider{}, errors.New("rider account is inactive")
			}

			return rd, nil
		}
	}

	return Rider{}, errors.New("invalid email/rider ID or password")
}

func (s *Service) GetRiderByID(id string) (Rider, error) {
	rd, exists := s.riders[id]
	if !exists {
		return Rider{}, errors.New("rider not found")
	}
	return rd, nil
}

func (s *Service) GetAllRiders() []Rider {
	result := make([]Rider, 0, len(s.riders))
	for _, rd := range s.riders {
		result = append(result, rd)
	}
	return result
}
