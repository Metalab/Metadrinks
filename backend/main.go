package main

import (
	"log"
	"os"
	"strings"

	jwt "github.com/appleboy/gin-jwt/v2"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"metalab/metadrinks/controllers/api"
	"metalab/metadrinks/controllers/auth"
	"metalab/metadrinks/controllers/payment"
	"metalab/metadrinks/libs"
	"metalab/metadrinks/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	_ "metalab/metadrinks/docs"
)

//	@title			Metadrinks Backend API
//	@version		1.0
//	@license.name	GPLv3
//	@license.url	https://www.gnu.org/licenses/gpl-3.0.html

//	@securityDefinitions.apikey	ApiKeyAuth
//	@in							cookie
//	@name						drinks_pos_session

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

	r := gin.Default()

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AddAllowHeaders("Authorization")
	r.Use(cors.New(corsConfig))

	trustedProxies := strings.Split(os.Getenv("GIN_TRUSTED_PROXIES"), ",")
	r.SetTrustedProxies(trustedProxies)

	models.ConnectDatabase()

	libs.Login(os.Getenv("SUMUP_API_KEY"))
	libs.InitAPIReaders()

	authMiddleware, err := jwt.New(auth.InitParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}
	r.Use(auth.HandlerMiddleware(authMiddleware))
	auth.JWTAuthMiddleware = authMiddleware

	api.RegisterRoutesAPI(r.Group("/api"))
	auth.RegisterRoutesAuth(r.Group("/auth"))
	payment.RegisterRoutesPayment(r.Group("/payment"))

	swaggerGroup := r.Group("/docs")
	swaggerGroup.StaticFile("/swagger.json", "docs/swagger.json")
	swaggerGroup.StaticFile("/swagger.yaml", "docs/swagger.yaml")
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	err = r.Run("0.0.0.0:8080")
	if err != nil {
		return
	}
}
