CREATE TABLE users(
    id BIGSERIAL PRIMARY KEY,
    username varchar unique not null,
    password varchar not null
);