package payment

import (
	v1 "metalab/metadrinks/controllers/payment/v1"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesPayment(r *gin.RouterGroup) {
	groupV1 := r.Group("/v1")
	v1.RegisterRoutesV1(groupV1)
}
