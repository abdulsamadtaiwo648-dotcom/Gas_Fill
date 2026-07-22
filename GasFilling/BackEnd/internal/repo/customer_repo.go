package repository

import (
	"database/sql"
	"errors"

	"gasfill/internal/customer"
)

type CustomerRepository struct {
	db *sql.DB
}

func NewCustomerRepository(
	db *sql.DB,
) *CustomerRepository {

	return &CustomerRepository{
		db: db,
	}
}

func (r *CustomerRepository) Create(
	c customer.Customer,
) error {

	_, err := r.db.Exec(`
		INSERT INTO customers
		(
			id,
			first_name,
			last_name,
			phone,
			email,
			password,
			active
		)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`,
		c.ID,
		c.FirstName,
		c.LastName,
		c.Phone,
		c.Email,
		c.Password,
		c.Active,
	)

	return err
}

func (r *CustomerRepository) FindByEmail(
	email string,
) (customer.Customer, error) {

	var c customer.Customer

	err := r.db.QueryRow(`
		SELECT
			id,
			first_name,
			last_name,
			phone,
			email,
			password,
			active
		FROM customers
		WHERE email = ?
	`,
		email,
	).Scan(
		&c.ID,
		&c.FirstName,
		&c.LastName,
		&c.Phone,
		&c.Email,
		&c.Password,
		&c.Active,
	)

	if err == sql.ErrNoRows {
		return customer.Customer{},
			errors.New(
				"customer not found",
			)
	}

	return c, err
}

func (r *CustomerRepository) FindByID(
	id string,
) (customer.Customer, error) {

	var c customer.Customer

	err := r.db.QueryRow(`
		SELECT
			id,
			first_name,
			last_name,
			phone,
			email,
			password,
			active
		FROM customers
		WHERE id = ?
	`,
		id,
	).Scan(
		&c.ID,
		&c.FirstName,
		&c.LastName,
		&c.Phone,
		&c.Email,
		&c.Password,
		&c.Active,
	)

	if err == sql.ErrNoRows {
		return customer.Customer{},
			errors.New(
				"customer not found",
			)
	}

	return c, err
}