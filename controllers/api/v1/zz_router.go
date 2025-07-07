package v1

import "github.com/gin-gonic/gin"

func RegisterRoutesV1(r *gin.RouterGroup) {
	i := r.Group("items")
	i.GET("/", FindItems)
	i.GET("/:id", FindItem)
	i.POST("/", CreateItem)
	i.PUT("/:id", UpdateItem)
	i.DELETE("/:id", DeleteItem)

	u := r.Group("users")
	u.POST("/", CreateUser)
	u.GET("/", FindUsers)
	u.GET("/:id", FindUser)
	u.PUT("/:id", UpdateUser)
	u.DELETE("//:id", DeleteUser)

	p := r.Group("purchases")
	p.POST("/", CreatePurchase)
	p.GET("/", FindPurchases)
	p.GET("/:id", FindPurchase)
	//p.PATCH("/:id", UpdatePurchase)
	//p.DELETE("/:id", DeletePurchase)
}
