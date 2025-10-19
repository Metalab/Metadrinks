package api

import (
	"metalab/metadrinks/controllers/api/admin"
	"metalab/metadrinks/controllers/api/payment"
	"metalab/metadrinks/controllers/api/v1"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesAPI(r *gin.RouterGroup) {
	groupV1 := r.Group("/v1")
	groupAdmin := r.Group("/admin")
	groupPayment := r.Group("/payment")
	v1.RegisterRoutesV1(groupV1)
	admin.RegisterRoutesAdmin(groupAdmin)
	payment.RegisterRoutesPayment(groupPayment)
}
