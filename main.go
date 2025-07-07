package main

import (
	"metalab/drinks-pos/controllers/api"
	"metalab/drinks-pos/controllers/auth"
	_ "metalab/drinks-pos/controllers/auth"
	"metalab/drinks-pos/controllers/payment"
	"metalab/drinks-pos/libs"
	"metalab/drinks-pos/models"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	enforcedVars := []string{
		"SUMUP_API_KEY",
		//"SUMUP_RETURN_URL",
		//"JWT_SECRET",
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

	trustedProxies := strings.Split(os.Getenv("GIN_TRUSTEDPROXIES"), ",")
	router.SetTrustedProxies(trustedProxies)

	models.ConnectDatabase()

	libs.Login(os.Getenv("SUMUP_API_KEY"))
	libs.InitAPIReaders()

	// auth shit

	// auth shit end

	api.RegisterRoutesAPI(router.Group("/api"))
	auth.RegisterRoutesAuth(router)
	payment.RegisterRoutesPayment(router.Group("/payment"))

	err := router.Run("0.0.0.0:8080")
	if err != nil {
		return
	}
}
