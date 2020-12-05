package store

import (
	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/jmoiron/sqlx"
)

type Store struct {
	db             *sqlx.DB
	dbUrl          string
	userRepository *UserRepository
}

func New(dbUrl string) *Store {
	return &Store{
		dbUrl: dbUrl,
	}
}

func (s *Store) Open() error {
	db, err := sqlx.Connect("pgx", s.dbUrl)
	if err != nil {
		return err
	}
	s.db = db

	return nil
}

func (s *Store) Close() {
	s.db.Close()
}

func (s *Store) User() *UserRepository {
	if s.userRepository != nil {
		return s.userRepository
	}

	s.userRepository = &UserRepository{
		store: s,
	}

	return s.userRepository
}
