package v1

import (
	"metalab/metadrinks/controllers/auth"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesV1(r *gin.RouterGroup) {
	i := r.Group("items")
	i.GET("/", FindItems)
	i.GET("/:id", FindItem)
	i.POST("/", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), CreateItem)
	i.PUT("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), UpdateItem)
	i.DELETE("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), DeleteItem)

	u := r.Group("users")
	u.POST("/", CreateUser)
	u.GET("/", FindUsers)
	u.GET("/:id", FindUser)
	u.PUT("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), UpdateUser)
	u.DELETE("//:id", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), DeleteUser)

	p := r.Group("purchases")
	p.POST("/", auth.JWTAuthMiddleware.MiddlewareFunc(), CreatePurchase)
	p.GET("/", auth.JWTAuthMiddleware.MiddlewareFunc(), FindPurchases)
	p.GET("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), FindPurchase)
	//p.PATCH("/:id", UpdatePurchase)
	//p.DELETE("/:id", DeletePurchase)
}
