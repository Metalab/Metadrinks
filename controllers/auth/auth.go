package auth

import (
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"

	"metalab/drinks-pos/models"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
)

var JWTAuthMiddleware *jwt.GinJWTMiddleware

type LoginForm struct {
	Username string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password"`
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
		// IdentityKey:      identityKey,
		PayloadFunc: payloadFunc(),

		IdentityHandler: identityHandler(),
		Authenticator:   authenticator(),
		Authorizator:    authorize(),
		Unauthorized:    unauthorized(),
		SendCookie:      true,
		CookieName:      "drinks_pos_session",
		CookieSameSite:  http.SameSiteStrictMode,
		TokenLookup:     "cookie: drinks_pos_session, header: Authorization",
		TokenHeadName:   "Bearer",
		TimeFunc:        time.Now,
	}
}

func payloadFunc() func(data any) jwt.MapClaims {
	return func(data any) jwt.MapClaims {
		if v, ok := data.(*models.User); ok {
			return jwt.MapClaims{
				"userId":     v.UserID.String(),
				"sub":        v.Name,
				"restricted": v.IsRestricted,
				"trusted":    v.IsTrusted,
				"admin":      v.IsAdmin,
			}
		}
		return jwt.MapClaims{}
	}
}

func identityHandler() func(c *gin.Context) any {
	return func(c *gin.Context) any {
		claims := jwt.ExtractClaims(c)
		return &models.User{
			Name: claims["sub"].(string),
		}
	}
}

func authenticator() func(c *gin.Context) (any, error) {
	return func(c *gin.Context) (any, error) {
		var loginVals LoginForm
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

func authorize() func(data any, c *gin.Context) bool {
	return func(data any, c *gin.Context) bool {
		return jwt.ExtractClaims(c)["admin"].(bool)
	}
}

func unauthorized() func(c *gin.Context, code int, message string) {
	return func(c *gin.Context, code int, message string) {
		c.JSON(code, gin.H{
			"code":    code,
			"message": message,
		})
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

func VerifyPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func TryAuthenticate(username, password string) (*models.User, error) {
	var user models.User

	if err := models.DB.Where("name = ?", username).First(&user).Error; err != nil {
		return nil, err
	}

	if err := VerifyPassword(password, user.Password); err != nil {
		return nil, err
	}

	return &user, nil
}
