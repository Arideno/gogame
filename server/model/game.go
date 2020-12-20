package model

type Game struct {
	Id          string `json:"id"`
	BlackPlayer *User `json:"black_player"`
	WhitePlayer *User `json:"white_player"`
	Size        int64 `json:"size"`
	Moves []string `json:"moves"`
	Position string `json:"position"`
	BlackToMove int `json:"black_to_move"`
	BlackPoints int `json:"black_points"`
	WhitePoints float64 `json:"white_points"`
}
