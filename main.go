package main

import (
	"log"
	"metalab/drinks-pos/controllers"
	"metalab/drinks-pos/libs"
	"metalab/drinks-pos/models"
	"os"
	"strings"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	enforced_vars := []string{
		"SUMUP_API_KEY",
		"SUMUP_RETURN_URL",
		"JWT_SECRET",
	}
	for _, v := range enforced_vars {
		if os.Getenv(v) == "" {
			panic("Environment variable " + v + " is not set. Please set it before running the application.")
		}
	}

	router := gin.Default()

	cors_config := cors.DefaultConfig()
	cors_config.AllowAllOrigins = true
	cors_config.AddAllowHeaders("Authorization")
	router.Use(cors.New(cors_config))

	trustedProxies := strings.Split(os.Getenv("GIN_TRUSTEDPROXIES"), ",")
	router.SetTrustedProxies(trustedProxies)

	models.ConnectDatabase()

	libs.Login(os.Getenv("SUMUP_API_KEY"))
	libs.InitAPIReaders()

	// auth shit
	authMiddleware, err := jwt.New(controllers.InitParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}
	router.Use(controllers.HandlerMiddleware(authMiddleware))
	controllers.RegisterRoute(router, authMiddleware)
	// auth shit end

	router.POST("/api/items", controllers.CreateItem)
	router.GET("/api/items", controllers.FindItems)
	router.GET("/api/items/:id", controllers.FindItem)
	router.PATCH("/api/items/:id", controllers.UpdateItem)
	router.DELETE("/api/items/:id", controllers.DeleteItem)

	router.POST("/api/purchases", controllers.CreatePurchase)
	router.GET("/api/purchases", controllers.FindPurchases)
	router.GET("/api/purchases/:id", controllers.FindPurchase)
	//router.PATCH("/api/purchases/:id", controllers.UpdatePurchase)
	//router.DELETE("/api/purchases/:id", controllers.DeletePurchase)

	router.POST("/api/users", controllers.CreateUser)
	router.GET("/api/users", controllers.FindUsers)
	router.GET("/api/users/:id", controllers.FindUser)
	router.PATCH("/api/users", controllers.UpdateUser)
	router.DELETE("/api/users", controllers.DeleteUser)

	router.POST("/api/payments/callback", controllers.GetIncomingWebhook)

	router.Run("0.0.0.0:8080")
}
