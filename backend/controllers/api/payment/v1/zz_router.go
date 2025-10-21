package v1

import (
	"metalab/metadrinks/controllers/auth"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesV1(r *gin.RouterGroup) {
	r.POST("/callback", GetIncomingWebhook)
	r.GET("/events", SSEHeadersMiddleware(), Stream.ServeHTTP())

	re := r.Group("readers")
	re.GET("", FindReaders)
	re.GET("/:id", FindReader)
	//re.GET("/api", auth.JWTAuthMiddleware.MiddlewareFunc(), FindApiReaders)
	re.POST("/link", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), CreateReader)
	re.DELETE("/terminate", auth.JWTAuthMiddleware.MiddlewareFunc(), TerminateReaderCheckout)
	re.DELETE("/unlink", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), UnlinkReader)
	re.DELETE("/:id", auth.JWTAuthMiddleware.MiddlewareFunc(), auth.IsUserAdmin(), DeleteReader)
}
