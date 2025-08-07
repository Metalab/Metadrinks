package main

import (
	"log"
	"os"
	"strings"

	jwt "github.com/appleboy/gin-jwt/v2"

	"metalab/metadrinks/controllers/api"
	"metalab/metadrinks/controllers/auth"
	"metalab/metadrinks/controllers/payment"
	"metalab/metadrinks/libs"
	"metalab/metadrinks/models"

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

	authMiddleware, err := jwt.New(auth.InitParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}
	router.Use(auth.HandlerMiddleware(authMiddleware))
	auth.JWTAuthMiddleware = authMiddleware

	api.RegisterRoutesAPI(router.Group("/api"))
	auth.RegisterRoutesAuth(router.Group("/auth"))
	payment.RegisterRoutesPayment(router.Group("/payment"))

	err = router.Run("0.0.0.0:8080")
	if err != nil {
		return
	}
}
