package auth

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutesAuth(r *gin.RouterGroup) {
	r.POST("/login", JWTAuthMiddleware.LoginHandler)
	r.POST("/logout", JWTAuthMiddleware.LogoutHandler)
	r.GET("/refresh_token", JWTAuthMiddleware.RefreshHandler)
}
