package model

import "github.com/gorilla/websocket"

type Client struct {
	Conn *websocket.Conn `json:"-"`
	Send chan interface{} `json:"-"`
	User *User `json:"user"`
}
