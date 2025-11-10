package v1

import (
	"metalab/metadrinks/controllers/auth"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesV1(r *gin.RouterGroup) {
	u := r.Group("users")
	u.POST("", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), CreateUser)
	u.GET("", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), FindUsers)
	u.PUT("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), UpdateUser)

	s := r.Group("settings")
	s.POST("", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), UpdateSettings)
	s.GET("", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), FindAdminSettings)
}
