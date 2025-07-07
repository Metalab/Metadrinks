package payment

import (
	"github.com/gin-gonic/gin"
	v1 "metalab/drinks-pos/controllers/payment/v1"
)

func RegisterRoutesPayment(r *gin.RouterGroup) {
	groupV1 := r.Group("/v1")
	v1.RegisterRoutesV1(groupV1)
}
