package store

import (
	"github.com/go-redis/redis/v8"
	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/jmoiron/sqlx"
	"os"
)

type Store struct {
	db             *sqlx.DB
	rdb			   *redis.Client
	dbUrl          string
	userRepository *UserRepository
	gameRepository *GameRepository
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

	s.rdb = redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_ADDR"),
		Password: "",
		DB: 0,
	})

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

func (s *Store) Game() *GameRepository {
	if s.gameRepository != nil {
		return s.gameRepository
	}

	s.gameRepository = &GameRepository{
		store: s,
	}

	return s.gameRepository
}