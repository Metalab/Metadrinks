package auth

import (
	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"log"
)

func RegisterRoutesAuth(r *gin.Engine) {
	authMiddleware, err := jwt.New(InitParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}
	r.Use(HandlerMiddleware(authMiddleware))
	auth := r.Group("/auth", authMiddleware.MiddlewareFunc())
	auth.POST("/login", authMiddleware.LoginHandler)
	auth.POST("/logout", authMiddleware.LogoutHandler)
	auth.GET("/refresh_token", authMiddleware.RefreshHandler)
}
