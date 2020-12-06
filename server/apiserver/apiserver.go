package apiserver

import (
	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/arideno/gogame/model"
	"github.com/arideno/gogame/store"
	"github.com/arideno/gogame/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"time"
)

type Server struct {
	router *gin.Engine
	store  *store.Store
	dbUrl  string
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
	authMiddleware, err := jwt.New(&jwt.GinJWTMiddleware{
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
				UserName string `json:"username" binding:"required"`
				Password string `json:"password" binding:"required"`
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

	s.router.POST("/auth/login", authMiddleware.LoginHandler)
	s.router.POST("/auth/register", s.registerHandler())

	api := s.router.Group("/api")
	api.Use(authMiddleware.MiddlewareFunc())
	api.GET("/profile", s.profileHandler())
	api.POST("/password/change", s.changePasswordHandler())

	return nil
}

func (s *Server) registerHandler() gin.HandlerFunc {
	type userCredentials struct {
		UserName string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
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
		OldPassword string `json:"oldPassword" binding:"required"`
		NewPassword string `json:"newPassword" binding:"required"`
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
