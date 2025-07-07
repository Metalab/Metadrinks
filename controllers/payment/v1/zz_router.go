package v1

import "github.com/gin-gonic/gin"

func RegisterRoutesV1(r *gin.RouterGroup) {
	r.POST("/callback", GetIncomingWebhook)
}
