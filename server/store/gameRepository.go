package store

import (
	"context"
	"github.com/arideno/gogame/model"
	"github.com/go-redis/redis/v8"
	"strconv"
	"strings"
)

var ctx = context.Background()

type GameRepository struct {
	store *Store
}

func (r *GameRepository) Create(game *model.Game) error {
	return r.store.rdb.HSet(ctx, game.Id, map[string]interface{}{
		"white":    game.WhitePlayer.Id,
		"black":    game.BlackPlayer.Id,
		"blackName": game.BlackPlayer.UserName,
		"whiteName": game.WhitePlayer.UserName,
		"size":     game.Size,
		"moves":    "",
		"position": strings.Repeat(" ", int(game.Size*game.Size)),
		"blackToMove": 1,
		"blackPoints": 0,
		"whitePoints": 6.5,
		"winner": 0,
	}).Err()
}

func (r *GameRepository) MakeMove(game *model.Game, move string) error {
	previousMoves, err := r.store.rdb.HGet(ctx, game.Id, "moves").Result()
	if err == redis.Nil || previousMoves == "" {
		err := r.store.rdb.HSet(ctx, game.Id, "moves", move).Err()
		if err != nil {
			return err
		}
	} else {
		previousMoves += "," + move
		err := r.store.rdb.HSet(ctx, game.Id, "moves", previousMoves).Err()
		if err != nil {
			return err
		}
	}
	err = r.store.rdb.HSet(ctx, game.Id, "position", game.Position).Err()
	if err != nil {
		return err
	}
	err = r.store.rdb.HSet(ctx, game.Id, "blackToMove", game.BlackToMove).Err()
	if err != nil {
		return err
	}
	err = r.store.rdb.HSet(ctx, game.Id, "blackPoints", game.BlackPoints).Err()
	return r.store.rdb.HSet(ctx, game.Id, "whitePoints", game.WhitePoints).Err()
}

func (r *GameRepository) GetMoves(game *model.Game) (string, error) {
	moves, err := r.store.rdb.HGet(ctx, game.Id, "moves").Result()
	if err != nil {
		return "", err
	}

	return moves, err
}

func (r *GameRepository) GetById(id string) *model.Game {
	exists := r.store.rdb.Exists(ctx, id).Val()
	if exists == 0 {
		return nil
	}

	result, _ := r.store.rdb.HGetAll(ctx, id).Result()

	blackName := result["blackName"]
	whiteName := result["whiteName"]
	blackId, _ := strconv.Atoi(result["black"])
	whiteId, _ := strconv.Atoi(result["white"])
	size, _ := strconv.Atoi(result["size"])
	moves := strings.Split(result["moves"], ",")
	position := result["position"]
	blackToMove, _ := strconv.Atoi(result["blackToMove"])
	blackPoints, _ := strconv.Atoi(result["blackPoints"])
	whitePoints, _ := strconv.ParseFloat(result["whitePoints"], 64)
	winner, _ := strconv.Atoi(result["winner"])

	return &model.Game{
		Id: id,
		BlackPlayer: &model.User{
			Id: int64(blackId),
			UserName: blackName,
		},
		WhitePlayer: &model.User{
			Id: int64(whiteId),
			UserName: whiteName,
		},
		Size:     int64(size),
		Moves:    moves,
		Position: position,
		BlackToMove: blackToMove,
		BlackPoints: blackPoints,
		WhitePoints: whitePoints,
		Winner: winner,
	}
}

func (r *GameRepository) GetAll() []*model.Game {
	games := make([]*model.Game, 0)

	for _, id := range r.store.rdb.Keys(ctx, "game*").Val() {
		result, _ := r.store.rdb.HGetAll(ctx, id).Result()

		blackName := result["blackName"]
		whiteName := result["whiteName"]
		blackId, _ := strconv.Atoi(result["black"])
		whiteId, _ := strconv.Atoi(result["white"])
		size, _ := strconv.Atoi(result["size"])
		moves := strings.Split(result["moves"], ",")
		position := result["position"]
		blackToMove, _ := strconv.Atoi(result["blackToMove"])
		blackPoints, _ := strconv.Atoi(result["blackPoints"])
		whitePoints, _ := strconv.ParseFloat(result["whitePoints"], 64)
		winner, _ := strconv.Atoi(result["winner"])
		if winner != 0 {
			continue
		}

		games = append(games, &model.Game{
			Id: id,
			BlackPlayer: &model.User{
				Id: int64(blackId),
				UserName: blackName,
			},
			WhitePlayer: &model.User{
				Id: int64(whiteId),
				UserName: whiteName,
			},
			Size:     int64(size),
			Moves:    moves,
			Position: position,
			BlackToMove: blackToMove,
			BlackPoints: blackPoints,
			WhitePoints: whitePoints,
		})
	}

	return games
}

func (r *GameRepository) SetWinner(id string, winner int, blackPoints int, whitePoints float64) {
	r.store.rdb.HSet(ctx, id, "winner", winner, "blackPoints", blackPoints, "whitePoints", whitePoints)
}