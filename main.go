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
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	enforcedVars := []string{
		"SUMUP_API_KEY",
		"SUMUP_RETURN_URL",
		"JWT_SECRET",
		"GIN_TRUSTED_PROXIES",
		"DB_HOST",
		"DB_USER",
		"DB_PASSWORD",
		"DB_DATABASE",
		"DB_PORT",
		"DB_TIMEZONE",
	}
	for _, v := range enforcedVars {
		if os.Getenv(v) == "" {
			panic("Environment variable " + v + " is not set. Please set it before running the application.")
		}
	}

	router := gin.Default()

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AddAllowHeaders("Authorization")
	router.Use(cors.New(corsConfig))

	trustedProxies := strings.Split(os.Getenv("GIN_TRUSTED_PROXIES"), ",")
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
