package v1

import (
	"github.com/gin-gonic/gin"
	"metalab/drinks-pos/controllers/auth"
)

func RegisterRoutesV1(r *gin.RouterGroup) {
	i := r.Group("items")
	i.GET("/", FindItems)
	i.GET("/:id", FindItem)
	i.POST("/", auth.JWTAuthMiddleware.MiddlewareFunc(), CreateItem)
	i.PUT("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), UpdateItem)
	i.DELETE("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), DeleteItem)

	u := r.Group("users")
	u.POST("/", CreateUser)
	u.GET("/", FindUsers)
	u.GET("/:id", FindUser)
	u.PUT("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), UpdateUser)
	u.DELETE("//:id", auth.JWTAuthMiddleware.MiddlewareFunc(), DeleteUser)

	p := r.Group("purchases")
	p.POST("/", CreatePurchase)
	p.GET("/", FindPurchases)
	p.GET("/:id", FindPurchase)
	//p.PATCH("/:id", UpdatePurchase)
	//p.DELETE("/:id", DeletePurchase)
}
