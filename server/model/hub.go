package model

import (
	"github.com/gin-gonic/gin"
)

type Hub struct {
	Clients      map[*Client]bool `json:"-"`
	WaitingGames map[*Game]bool   `json:"-"`
}

func (h *Hub) AddClient(client *Client) {
	h.AnnounceForAll("User has connected")
	h.Clients[client] = true
}

func (h *Hub) RemoveClient(client *Client) {
	delete(h.Clients, client)
	for game := range h.WaitingGames {
		if (game.WhitePlayer != nil && game.WhitePlayer.Id == client.User.Id && game.BlackPlayer == nil) || (game.BlackPlayer != nil && game.BlackPlayer.Id == client.User.Id && game.WhitePlayer == nil) {
			delete(h.WaitingGames, game)
		}
	}
	h.AnnounceWaitingGamesForAll()
}

func (h *Hub) AnnounceForAll(message interface{}) {
	for c := range h.Clients {
		c.Send <- message
	}
}

func (h *Hub) AnnounceWaitingGamesForAll() {
	games := h.GetWaitingGames()

	response := gin.H{
		"type": "waiting_games",
		"data": map[string]interface{}{
			"games": games,
		},
	}

	h.AnnounceForAll(response)
}

func (h *Hub) NewGame(blackPlayer *User, whitePlayer *User, size int64, id string) *Game {
	game := &Game{
		BlackPlayer: blackPlayer,
		WhitePlayer: whitePlayer,
		Size: size,
		Id: id,
	}

	h.WaitingGames[game] = true

	return game
}

func (h *Hub) GetWaitingGames() []*Game {
	games := make([]*Game, 0)
	for g := range h.WaitingGames {
		if g.WhitePlayer == nil || g.BlackPlayer == nil {
			games = append(games, g)
		}
	}
	return games
}

func (h *Hub) GetCurrentGames(user *User, allGames []*Game) []*Game {
	games := make([]*Game, 0)
	for _, g := range allGames {
		if g.Winner == 0 {
			if g.BlackPlayer != nil && g.WhitePlayer != nil {
				if g.BlackPlayer.Id == user.Id || g.WhitePlayer.Id == user.Id {
					games = append(games, g)
				}
			}
		}
	}
	return games
}

func (h *Hub) GetClientById(id int64) *Client {
	for client := range h.Clients {
		if client.User.Id == id {
			return client
		}
	}
	return nil
}

func (h *Hub) GetGameById(id string) *Game {
	for game := range h.WaitingGames {
		if game.Id == id {
			return game
		}
	}
	return nil
}