package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func Open() (*sql.DB, error) {

	dataDir := "data"

	err := os.MkdirAll(
		dataDir,
		0755,
	)

	if err != nil {
		return nil, err
	}

	dbPath := filepath.Join(
		dataDir,
		"gasfill.db",
	)

	db, err := sql.Open(
		"sqlite",
		dbPath,
	)

	if err != nil {
		return nil, err
	}

	err = db.Ping()

	if err != nil {
		db.Close()
		return nil, err
	}

	fmt.Println(
		"SQLite database connected:",
		dbPath,
	)

	return db, nil
}