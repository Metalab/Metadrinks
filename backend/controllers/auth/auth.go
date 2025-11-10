package auth

import (
	"log"
	"metalab/metadrinks/libs/auth"
	"metalab/metadrinks/libs/crypto"
	"metalab/metadrinks/models"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

var JWTAuthMiddleware *auth.GinJWTMiddleware

type LoginForm struct {
	Username string `form:"username" json:"username"`
	Password string `form:"password" json:"password"`
	Barcode  string `form:"barcode" json:"barcode"`
}

func HandlerMiddleware(authMiddleware *auth.GinJWTMiddleware) gin.HandlerFunc {
	return func(context *gin.Context) {
		errInit := authMiddleware.MiddlewareInit()
		if errInit != nil {
			log.Fatal("authMiddleware.MiddlewareInit() Error:" + errInit.Error())
		}
	}
}

func InitParams() *auth.GinJWTMiddleware {
	return &auth.GinJWTMiddleware{
		Realm:            "drinks-pos",
		Key:              []byte(os.Getenv("JWT_SECRET")),
		SigningAlgorithm: "HS512",
		Timeout:          time.Minute * 5,
		MaxRefresh:       time.Minute * 5,
		// IdentityKey:   identityKey,
		PayloadFunc: payloadFunc(),

		IdentityHandler: identityHandler(),
		Authenticator:   authenticator(),
		Unauthorized:    unauthorized(),
		LoginResponse:   loginResponse(),
		SendCookie:      true,
		CookieName:      "drinks_pos_session",
		CookieSameSite:  http.SameSiteStrictMode,
		TokenLookup:     "cookie: drinks_pos_session, header: Authorization",
		TokenHeadName:   "Bearer",
		TimeFunc:        time.Now,
	}
}

func payloadFunc() func(data any) auth.MapClaims {
	return func(data any) auth.MapClaims {
		if v, ok := data.(*models.User); ok {
			return auth.MapClaims{
				"userId":     v.UserID.String(),
				"sub":        v.Name,
				"restricted": v.IsRestricted,
				"trusted":    v.IsTrusted,
				"admin":      v.IsAdmin,
			}
		}
		return auth.MapClaims{}
	}
}

func identityHandler() func(c *gin.Context) any {
	return func(c *gin.Context) any {
		claims := auth.ExtractClaims(c)
		return &models.User{
			Name: claims["sub"].(string),
		}
	}
}

func authenticator() func(c *gin.Context) (any, error) {
	return func(c *gin.Context) (any, error) {
		var loginVals LoginForm
		if err := c.ShouldBind(&loginVals); err != nil {
			return "", auth.ErrMissingLoginValues
		}
		username := loginVals.Username
		password := loginVals.Password
		barcode := loginVals.Barcode

		if username != "" && password != "" {
			user, err := TryAuthenticate(username, password)
			if err != nil {
				log.Printf("Failed authentication for user %s: %v\n", username, err)
				return nil, auth.ErrFailedAuthentication
			}
			return user, nil
		} else if barcode != "" {
			user, err := TryAuthenticateByBarcode(barcode)
			if err != nil {
				log.Printf("Failed authentication for barcode %s: %v\n", username, err)
				return nil, auth.ErrFailedAuthentication
			}
			return user, nil
		}
		return nil, auth.ErrFailedAuthentication
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

func loginResponse() func(c *gin.Context, code int, token string, expire time.Time) {
	return func(c *gin.Context, code int, token string, expire time.Time) {
		// Extract user data from context
		userData, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "Failed to get user data",
			})
			return
		}

		user, ok := userData.(*models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "Invalid user data",
			})
			return
		}

		// Clear sensitive fields before returning
		user.Password = ""
		user.LoginBarcode = ""

		c.JSON(http.StatusOK, gin.H{
			"code":   http.StatusOK,
			"token":  token,
			"expire": expire.UTC().Format(http.TimeFormat),
			"user":   user,
		})
	}
}

func TryAuthenticate(username, password string) (*models.User, error) {
	var user models.User

	if err := models.DB.Where("name = ?", username).First(&user).Error; err != nil {
		return nil, err
	}

	if err := crypto.AuthenticateUser(user.Password, password); err != nil {
		return nil, err
	}

	user.UsedAt = time.Now().Local()
	models.DB.Save(&user)
	return &user, nil
}

func TryAuthenticateByBarcode(barcode string) (*models.User, error) {
	var user models.User
	if err := models.DB.Where("login_barcode = ?", barcode).First(&user).Error; err != nil {
		return nil, err
	}
	user.UsedAt = time.Now().Local()
	models.DB.Save(&user)
	return &user, nil
}

func IsUserAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !auth.ExtractClaims(c)["admin"].(bool) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
	}
}
