package controllers

import (
	"log"
	"metalab/drinks-pos/models"
	"os"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
)

type login struct {
	Username string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password"`
}

func RegisterRoute(r *gin.Engine, handle *jwt.GinJWTMiddleware) {
	r.POST("/login", handle.LoginHandler)
	r.POST("/logout", handle.LogoutHandler)

	auth := r.Group("/auth", handle.MiddlewareFunc())
	auth.GET("/refresh_token", handle.RefreshHandler)
	//auth.GET("/hello", HelloHandler)
}

func HandlerMiddleware(authMiddleware *jwt.GinJWTMiddleware) gin.HandlerFunc {
	return func(context *gin.Context) {
		errInit := authMiddleware.MiddlewareInit()
		if errInit != nil {
			log.Fatal("authMiddleware.MiddlewareInit() Error:" + errInit.Error())
		}
	}
}

func InitParams() *jwt.GinJWTMiddleware {

	return &jwt.GinJWTMiddleware{
		Realm:            "drinks-pos",
		Key:              []byte(os.Getenv("JWT_SECRET")),
		SigningAlgorithm: "HS512",
		Timeout:          time.Minute * 1,
		MaxRefresh:       time.Minute * 1,
		//IdentityKey:      identityKey,
		PayloadFunc: payloadFunc(),

		//IdentityHandler: identityHandler(),
		Authenticator: authenticator(),
		//Authorizator:    authorizator(),
		Unauthorized:  unauthorized(),
		TokenLookup:   "cookie: jwt, header: Authorization",
		TokenHeadName: "Bearer",
		TimeFunc:      time.Now,
	}
}

func payloadFunc() func(data any) jwt.MapClaims {
	return func(data any) jwt.MapClaims {
		if v, ok := data.(*models.User); ok {
			return jwt.MapClaims{
				"userId":  v.UserID.String(),
				"sub":     v.Name,
				"trusted": v.IsTrusted,
				"admin":   v.IsAdmin,
			}
		}
		return jwt.MapClaims{}
	}
}

/*func identityHandler() func(c *gin.Context) any {
	return func(c *gin.Context) any {
		claims := jwt.ExtractClaims(c)
		return &models.User{
			Name: claims[identityKey].(string),
		}
	}
}*/

func authenticator() func(c *gin.Context) (any, error) {
	return func(c *gin.Context) (any, error) {
		var loginVals login
		if err := c.ShouldBind(&loginVals); err != nil {
			return "", jwt.ErrMissingLoginValues
		}
		username := loginVals.Username
		password := loginVals.Password

		user, err := TryAuthenticate(username, password)
		if err != nil {
			log.Printf("Failed authentication for user %s: %v\n", username, err)
			return nil, jwt.ErrFailedAuthentication
		}
		return user, nil
	}
}

/*func authorizator() func(data any, c *gin.Context) bool {
	return func(data any, c *gin.Context) bool {
		if v, ok := data.(*User); ok && v.UserName == "admin" {
			return true
		}
		return false
	}
}*/

func unauthorized() func(c *gin.Context, code int, message string) {
	return func(c *gin.Context, code int, message string) {
		c.JSON(code, gin.H{
			"code":    code,
			"message": message,
		})
	}
}

func HandleNoRoute() func(c *gin.Context) {
	return func(c *gin.Context) {
		claims := jwt.ExtractClaims(c)
		log.Printf("NoRoute claims: %#v\n", claims)
		c.JSON(404, gin.H{"code": "PAGE_NOT_FOUND", "message": "Page not found"})
	}
}

/*func HelloHandler(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	user, _ := c.Get(identityKey)
	c.JSON(200, gin.H{
		"userID":   claims[identityKey],
		"userName": user.(*models.User).Name,
		"text":     "Hello World.",
	})
}*/
