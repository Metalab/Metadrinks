package v1

import "github.com/gin-gonic/gin"

func RegisterRoutesV1(r *gin.RouterGroup) {
	r.POST("/callback", GetIncomingWebhook)
	r.GET("/events", SSEHeadersMiddleware(), Stream.ServeHTTP())

	re := r.Group("readers")
	re.GET("/", FindReaders)
	re.GET("/:id", FindReader)
	re.GET("/api", FindApiReaders)
	re.POST("/link", CreateReader)
	re.DELETE("/terminate", TerminateReaderCheckout)
	re.DELETE("/unlink", UnlinkReader)
}
