package apiserver

import (
	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/arideno/gogame/model"
	"github.com/arideno/gogame/store"
	"github.com/arideno/gogame/utils"
	jwt2 "github.com/dgrijalva/jwt-go"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
	"time"
)

type Server struct {
	router *gin.Engine
	store  *store.Store
	authMiddleware *jwt.GinJWTMiddleware
	dbUrl  string
	mainHub *model.Hub
}

func New() *Server {
	return &Server{
		router: gin.New(),
	}
}

func (s *Server) Start() error {
	s.router.Use(gin.Logger())
	s.router.Use(gin.Recovery())
	s.router.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowHeaders:    []string{"Content-Type", "Authorization"},
		AllowMethods:    []string{"GET", "POST"},
	}))
	if err := s.configureRouter(); err != nil {
		return err
	}
	dbUrl := os.Getenv("DB_URL")
	s.dbUrl = dbUrl
	if err := s.configureStore(); err != nil {
		return err
	}

	s.mainHub = &model.Hub{Clients: make(map[*model.Client]bool), WaitingGames: make(map[*model.Game]bool)}

	return s.router.Run(":8080")
}

func (s *Server) configureStore() error {
	st := store.New(s.dbUrl)
	if err := st.Open(); err != nil {
		return err
	}

	s.store = st

	return nil
}

func (s *Server) configureRouter() error {
	var err error
	s.authMiddleware, err = jwt.New(&jwt.GinJWTMiddleware{
		Realm:       "Login",
		Key:         []byte(os.Getenv("SECRET_WORD")),
		Timeout:     time.Hour,
		IdentityKey: "id",
		PayloadFunc: func(data interface{}) jwt.MapClaims {
			if v, ok := data.(*model.User); ok {
				return jwt.MapClaims{
					"id": v.Id,
				}
			}
			return jwt.MapClaims{}
		},
		IdentityHandler: func(c *gin.Context) interface{} {
			claims := jwt.ExtractClaims(c)
			return &model.User{
				Id: int64(claims["id"].(float64)),
			}
		},
		Authenticator: func(c *gin.Context) (interface{}, error) {
			type userCredentials struct {
				UserName string `jsonReq:"username" binding:"required"`
				Password string `jsonReq:"password" binding:"required"`
			}

			var credentials userCredentials

			if err := c.ShouldBindJSON(&credentials); err != nil {
				return nil, jwt.ErrMissingLoginValues
			}
			userName := credentials.UserName
			password := credentials.Password

			user, err := s.store.User().FindByUserName(userName)
			if err != nil {
				return nil, jwt.ErrFailedAuthentication
			}

			if utils.ComparePasswords(user.Password, password) {
				return user, nil
			}

			return nil, jwt.ErrFailedAuthentication
		},
		Authorizator: func(data interface{}, c *gin.Context) bool {
			if _, ok := data.(*model.User); ok {
				return true
			}
			return false
		},
		Unauthorized: func(c *gin.Context, code int, message string) {
			c.JSON(code, gin.H{
				"code":    code,
				"message": message,
			})
		},
		TokenLookup:   "header: Authorization, query: token, cookie: jwt",
		TokenHeadName: "Bearer",
		TimeFunc:      time.Now,
	})

	if err != nil {
		return err
	}

	s.router.POST("/auth/login", s.authMiddleware.LoginHandler)
	s.router.POST("/auth/register", s.registerHandler())

	api := s.router.Group("/api")
	api.Use(s.authMiddleware.MiddlewareFunc())
	api.GET("/profile", s.profileHandler())
	api.POST("/password/change", s.changePasswordHandler())
	ws := s.router.Group("/ws")
	ws.GET("/hub", func(c *gin.Context) {
		s.hubHandler(c.Writer, c.Request)
	})
	return nil
}

func (s *Server) registerHandler() gin.HandlerFunc {
	type userCredentials struct {
		UserName string `jsonReq:"username" binding:"required"`
		Password string `jsonReq:"password" binding:"required"`
	}

	return func(c *gin.Context) {
		credentials := userCredentials{}
		if err := c.ShouldBindJSON(&credentials); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Provide username and password",
			})
			return
		}

		hashedPassword := utils.HashPassword(credentials.Password)
		_, err := s.store.User().Create(&model.User{
			UserName: credentials.UserName,
			Password: hashedPassword,
		})

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Username is already in use",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "User created",
		})
	}
}

func (s *Server) profileHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		u, _ := c.Get("id")
		user, err := s.store.User().FindById(u.(*model.User).Id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":       user.Id,
			"username": user.UserName,
		})
	}
}

func (s *Server) changePasswordHandler() gin.HandlerFunc {
	type request struct {
		OldPassword string `jsonReq:"oldPassword" binding:"required"`
		NewPassword string `jsonReq:"newPassword" binding:"required"`
	}

	return func(c *gin.Context) {
		var r request
		if err := c.ShouldBindJSON(&r); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		u, _ := c.Get("id")
		user, err := s.store.User().FindById(u.(*model.User).Id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "No such user",
			})
			return
		}

		if !utils.ComparePasswords(user.Password, r.OldPassword) {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Passwords does not match",
			})
			return
		}

		hashedPassword := utils.HashPassword(r.NewPassword)
		if err := s.store.User().UpdatePassword(&model.User{Id: user.Id, Password: hashedPassword}); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Error setting password",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Password successfully updated",
		})
	}
}

func (s *Server) hubHandler(w http.ResponseWriter, r *http.Request) {
	var wsUpgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &model.Client{Conn: conn, Send: make(chan interface{})}

	go s.reader(client)
	go s.writer(client)
}

func (s *Server) reader(client *model.Client) {
	type jsonReq struct {
		Type string `json:"type"`
		Data map[string]interface{} `json:"data"`
	}

	var j jsonReq

	timer := time.AfterFunc(time.Second * 5, func() {
		client.Conn.Close()
		s.mainHub.RemoveClient(client)
	})

	for {
		err := client.Conn.ReadJSON(&j)
		if err != nil {
			log.Println(err)
			client.Conn.Close()
			s.mainHub.RemoveClient(client)
			break
		}

		switch j.Type {
		case "authentication":
			token, err := s.authMiddleware.ParseTokenString(j.Data["token"].(string))
			if err != nil {
				log.Println(err)
				client.Conn.Close()
				s.mainHub.RemoveClient(client)
				break
			} else {
				client.Conn.WriteJSON(gin.H{
					"type": "authorization",
					"data": gin.H{
						"message": "authorized",
					},
				})
				timer.Stop()

				client.User, err = s.store.User().FindById(int64(token.Claims.(jwt2.MapClaims)["id"].(float64)))
				if err != nil {
					log.Println(err)
					client.Conn.Close()
					s.mainHub.RemoveClient(client)
					break
				}
				client.User.Password = ""
				s.mainHub.AddClient(client)

				games := s.mainHub.GetWaitingGames()

				response := gin.H{
					"type": "waiting_games",
					"data": map[string]interface{}{
						"games": games,
					},
				}
				client.Send <- response
			}
		case "get_waiting_games":
			games := s.mainHub.GetWaitingGames()

			response := gin.H{
				"type": "waiting_games",
				"data": map[string]interface{}{
					"games": games,
				},
			}
			client.Send <- response
		case "get_current_games":
			games := s.mainHub.GetCurrentGames(client.User, s.store.Game().GetAll())

			response := gin.H{
				"type": "current_games",
				"data": map[string]interface{}{
					"games": games,
				},
			}
			client.Send <- response
		case "get_all_games":
			games := s.store.Game().GetAll()

			response := gin.H{
				"type": "all_games",
				"data": map[string]interface{}{
					"games": games,
				},
			}
			client.Send <- response
		case "new_game":
			size := int64(j.Data["size"].(float64))
			color := j.Data["color"].(string)
			id, _ := uuid.NewUUID()

			canCreateGame := true
			for g := range s.mainHub.WaitingGames {
				if (g.BlackPlayer.Id == client.User.Id && g.WhitePlayer == nil) || (g.WhitePlayer.Id == client.User.Id && g.BlackPlayer == nil) {
					canCreateGame = false
					break
				}
			}

			if !canCreateGame {
				response := gin.H{
					"type": "create_game_error",
					"data": map[string]interface{}{
						"message": "Can't create a game",
					},
				}
				client.Send <- response
				continue
			}

			if color == "B" {
				_ = s.mainHub.NewGame(client.User, nil, size, "game-" + id.String())
			} else {
				_ = s.mainHub.NewGame(nil, client.User, size, "game-" + id.String())
			}

			s.mainHub.AnnounceWaitingGamesForAll()
		case "accept_game":
			gameId := j.Data["gameId"].(string)

			game := s.mainHub.GetGameById(gameId)
			if game.BlackPlayer == nil {
				game.BlackPlayer = client.User
			} else if game.WhitePlayer == nil {
				game.WhitePlayer = client.User
			} else {
				response := gin.H{
					"type": "accept_error",
					"data": map[string]interface{}{
						"message": "Game has already been accepted",
					},
				}
				client.Send <- response
				continue
			}

			err = s.store.Game().Create(game)
			if err != nil {
				response := gin.H{
					"type": "accept_error",
					"data": map[string]interface{}{
						"message": "Can't accept game",
					},
				}
				client.Send <- response
				continue
			}

			response := gin.H{
				"type": "game_accepted",
				"data": map[string]interface{}{
					"message": "Game accepted",
					"gameId": game.Id,
				},
			}
			s.mainHub.GetClientById(game.BlackPlayer.Id).Send <- response
			s.mainHub.GetClientById(game.WhitePlayer.Id).Send <- response

			games := s.store.Game().GetAll()
			waitingGames := s.mainHub.GetWaitingGames()

			response1 := gin.H{
				"type": "waiting_games",
				"data": map[string]interface{}{
					"games": waitingGames,
				},
			}

			response2 := gin.H{
				"type": "all_games",
				"data": map[string]interface{}{
					"games": games,
				},
			}

			for c := range s.mainHub.Clients {
				c.Send <- response1
				c.Send <- response2

				currentGames := s.mainHub.GetCurrentGames(client.User, games)
				response := gin.H{
					"type": "current_games",
					"data": map[string]interface{}{
						"games": currentGames,
					},
				}
				c.Send <- response
			}
		case "game_info":
			gameId := j.Data["gameId"].(string)
			game := s.store.Game().GetById(gameId)
			if game == nil {
				response := gin.H{
					"type": "game_info_error",
					"data": map[string]interface{}{
						"message": "Game not found",
					},
				}
				client.Send <- response
				continue
			}

			response := gin.H{
				"type": "game_info",
				"data": map[string]interface{}{
					"game": game,
				},
			}

			client.Send <- response
		case "make_move":
			gameId := j.Data["gameId"].(string)
			move := j.Data["move"].(string)
			position := j.Data["position"].(string)
			blackToMove := int(j.Data["blackToMove"].(float64))
			blackPoints := int(j.Data["blackPoints"].(float64))
			whitePoints := j.Data["whitePoints"].(float64)

			err := s.store.Game().MakeMove(&model.Game{Id: gameId, Position: position, BlackToMove: blackToMove, BlackPoints: blackPoints, WhitePoints: whitePoints}, move)
			if err != nil {
				response := gin.H{
					"type": "make_move_error",
					"data": map[string]interface{}{
						"message": "Can't make move",
					},
				}
				client.Send <- response
				continue
			}

			moves, _ := s.store.Game().GetMoves(&model.Game{Id: gameId})

			game := s.store.Game().GetById(gameId)
			if game == nil {
				response := gin.H{
					"type": "make_move_error",
					"data": map[string]interface{}{
						"message": "Can't find game",
					},
				}
				client.Send <- response
				continue
			}
			if game.WhitePlayer.Id == client.User.Id {
				games := s.mainHub.GetCurrentGames(game.BlackPlayer, s.store.Game().GetAll())

				response := gin.H{
					"type": "current_games",
					"data": map[string]interface{}{
						"games": games,
					},
				}

				s.mainHub.GetClientById(game.BlackPlayer.Id).Send <- response
			} else if game.BlackPlayer.Id == client.User.Id {
				games := s.mainHub.GetCurrentGames(game.WhitePlayer, s.store.Game().GetAll())

				response := gin.H{
					"type": "current_games",
					"data": map[string]interface{}{
						"games": games,
					},
				}

				s.mainHub.GetClientById(game.WhitePlayer.Id).Send <- response
			}

			response1 := gin.H{
				"type": "make_move",
				"data": map[string]interface{}{
					"moves": moves,
					"gameId": gameId,
				},
			}

			games := s.store.Game().GetAll()
			response2 := gin.H{
				"type": "all_games",
				"data": map[string]interface{}{
					"games": games,
				},
			}

			for c := range s.mainHub.Clients {
				if c.User.Id != client.User.Id {
					c.Send <- response1
				}
				c.Send <- response2
			}
		}
	}
}

func (s *Server) writer(client *model.Client) {
	for {
		message := <-client.Send
		err := client.Conn.WriteJSON(message)
		if err != nil {
			log.Println(err)
			client.Conn.Close()
			s.mainHub.RemoveClient(client)
			break
		}
	}
}
