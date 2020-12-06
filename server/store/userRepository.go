package store

import (
	"github.com/arideno/gogame/model"
)

type UserRepository struct {
	store *Store
}

func (r *UserRepository) Create(user *model.User) (*model.User, error) {
	var id int64
	if err := r.store.db.Get(&id, "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", user.UserName, user.Password); err != nil {
		return nil, err
	}

	return &model.User{
		Id:       id,
		UserName: user.UserName,
		Password: user.Password,
	}, nil
}

func (r *UserRepository) FindById(id int64) (*model.User, error) {
	user := model.User{}
	if err := r.store.db.Get(&user,
		"SELECT * from users where id=$1",
		id,
	); err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByUserName(userName string) (*model.User, error) {
	user := model.User{}
	if err := r.store.db.Get(&user,
		"SELECT * from users where username=$1",
		userName,
	); err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) UpdatePassword(user *model.User) error {
	if _, err := r.store.db.Exec("UPDATE users SET password = $1 WHERE id = $2", user.Password, user.Id); err != nil {
		return err
	}

	return nil
}
