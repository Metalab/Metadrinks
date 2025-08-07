package api

import (
	"metalab/metadrinks/controllers/api/v1"

	"github.com/gin-gonic/gin"
)

func RegisterRoutesAPI(r *gin.RouterGroup) {
	groupV1 := r.Group("/v1")
	v1.RegisterRoutesV1(groupV1)
}
