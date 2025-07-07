package v1

import (
	"github.com/gin-gonic/gin"
	"metalab/drinks-pos/controllers/auth"
)

func RegisterRoutesV1(r *gin.RouterGroup) {
	r.POST("/callback", GetIncomingWebhook)
	r.GET("/events", SSEHeadersMiddleware(), Stream.ServeHTTP())

	re := r.Group("readers")
	re.GET("/", FindReaders)
	re.GET("/:id", FindReader)
	re.GET("/api", auth.JWTAuthMiddleware.MiddlewareFunc(), FindApiReaders)
	re.POST("/link", auth.JWTAuthMiddleware.MiddlewareFunc(), CreateReader)
	re.DELETE("/terminate", TerminateReaderCheckout)
	re.DELETE("/unlink", auth.JWTAuthMiddleware.MiddlewareFunc(), UnlinkReader)
}
