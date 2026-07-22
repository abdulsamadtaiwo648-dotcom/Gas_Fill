package database

import "database/sql"

func InitializeSchema(
	db *sql.DB,
) error {

	schema := `
	CREATE TABLE IF NOT EXISTS customers (
		id TEXT PRIMARY KEY,
		first_name TEXT NOT NULL,
		last_name TEXT NOT NULL,
		phone TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		active INTEGER NOT NULL DEFAULT 1
	);

	CREATE TABLE IF NOT EXISTS vendors (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		phone TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		address TEXT NOT NULL,
		latitude REAL NOT NULL,
		longitude REAL NOT NULL,
		verified INTEGER NOT NULL DEFAULT 0,
		active INTEGER NOT NULL DEFAULT 1
	);

	CREATE TABLE IF NOT EXISTS inventory (
		id TEXT PRIMARY KEY,
		vendor_id TEXT NOT NULL,
		weight_kg REAL NOT NULL,
		price_per_kg REAL NOT NULL,
		available INTEGER NOT NULL DEFAULT 1,

		FOREIGN KEY (
			vendor_id
		)
		REFERENCES vendors(id)
	);

	CREATE TABLE IF NOT EXISTS products (
		id TEXT PRIMARY KEY,
		vendor_id TEXT NOT NULL,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		description TEXT,
		weight_kg REAL NOT NULL,
		price REAL NOT NULL,
		available INTEGER NOT NULL DEFAULT 1,

		FOREIGN KEY (
			vendor_id
		)
		REFERENCES vendors(id)
	);

	CREATE TABLE IF NOT EXISTS orders (
		id TEXT PRIMARY KEY,
		customer_id TEXT NOT NULL,
		vendor_id TEXT NOT NULL,
		type TEXT NOT NULL,
		fulfillment TEXT NOT NULL,
		weight_kg REAL NOT NULL,
		gas_cost REAL NOT NULL,
		delivery_fee REAL NOT NULL,
		total_amount REAL NOT NULL,
		latitude REAL NOT NULL,
		longitude REAL NOT NULL,
		status TEXT NOT NULL,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL,

		FOREIGN KEY (
			customer_id
		)
		REFERENCES customers(id),

		FOREIGN KEY (
			vendor_id
		)
		REFERENCES vendors(id)
	);
	`

	_, err := db.Exec(schema)

	return err
}