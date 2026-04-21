package v1

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

//	@BasePath	/api/v1

// GetReadiness godoc
//
//	@Summary		Get application readiness
//	@Description	Checks the readiness of the application
//	@Produce		json
//	@Success		200
//	@Failure		500
//	@Failure		503
//
//	@Router			/ready [get]
func GetReadiness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
