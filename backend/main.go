package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	authLib "metalab/metadrinks/libs/auth"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"metalab/metadrinks/controllers/api"
	"metalab/metadrinks/controllers/auth"
	"metalab/metadrinks/libs"
	"metalab/metadrinks/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

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
	if err := models.LoadEnvironmentVariables(); err != nil {
		fmt.Printf("[ERROR] %s\n", err.Error())
		os.Exit(1)
	}

	r := gin.Default()

	corsConfig := cors.DefaultConfig()
	//corsConfig.AllowOrigins = strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ",")
	corsConfig.AllowHeaders = []string{"Authorization", "Content-Type"}
	corsConfig.AllowCredentials = true
	corsConfig.AllowPrivateNetwork = true
	corsConfig.AllowOriginFunc = func(origin string) bool {
		return true
	}
	// Use the CORS middleware with the specified configuration
	r.Use(cors.New(corsConfig))

	trustedProxies := strings.Split(os.Getenv("GIN_TRUSTED_PROXIES"), ",")
	r.SetTrustedProxies(trustedProxies)

	models.ConnectDatabase()

	libs.Login(os.Getenv("SUMUP_API_KEY"))
	libs.InitAPIReaders()

	authMiddleware, err := authLib.New(auth.InitParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}
	r.Use(auth.HandlerMiddleware(authMiddleware))
	auth.JWTAuthMiddleware = authMiddleware

	api.RegisterRoutesAPI(r.Group("/api"))
	auth.RegisterRoutesAuth(r.Group("/auth"))

	swaggerGroup := r.Group("/docs")
	swaggerGroup.StaticFile("/swagger.json", "docs/swagger.json")
	swaggerGroup.StaticFile("/swagger.yaml", "docs/swagger.yaml")
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	err = r.Run("0.0.0.0:8080")
	if err != nil {
		return
	}
}
