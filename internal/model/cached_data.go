package model

import (
	"database/sql"
	"time"
)

type CachedData struct {
	ID        int            `db:"id"`
	Created   time.Time      `db:"created_at"`
	Updated   time.Time      `db:"updated_at"`
	Name      string         `db:"name"`
	Encrypted bool           `db:"encrypted"`
	Tag       sql.NullString `db:"tag"`
	Value     []byte         `db:"value"`
}
