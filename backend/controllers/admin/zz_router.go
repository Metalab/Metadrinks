package admin

import (
	"metalab/metadrinks/controllers/admin/v1"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesAdmin(r *gin.RouterGroup) {
	groupV1 := r.Group("/v1")
	v1.RegisterRoutesV1(groupV1)
}
