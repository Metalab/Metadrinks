package v1

import (
	"metalab/metadrinks/controllers/auth"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesV1(r *gin.RouterGroup) {
	u := r.Group("users")
	u.POST("", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), CreateUser)
	u.GET("", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), FindUsers)
}
