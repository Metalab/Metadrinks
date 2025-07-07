package api

import (
	"github.com/gin-gonic/gin"
	"metalab/drinks-pos/controllers/api/v1"
)

func RegisterRoutesAPI(r *gin.RouterGroup) {
	groupV1 := r.Group("/v1")
	v1.RegisterRoutesV1(groupV1)
}
