package v1

import (
	"metalab/metadrinks/libs"
	"metalab/metadrinks/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func FindAdminSettings(c *gin.Context) {
	var settings models.Settings

	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": settings})
}

func FindSettings(c *gin.Context) {
	var settings models.Settings
	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	settings.MerchantInfo = nil // remove merchant info from normal response
	c.JSON(http.StatusOK, gin.H{"data": settings})
}

type UpdateSettingsInput struct {
	MaintenanceMode *bool   `json:"maintenance,omitempty"`
	DefaultReaderId *string `json:"default_reader_id,omitempty"`
}

func UpdateSettings(c *gin.Context) {
	var input UpdateSettingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var settings models.Settings
	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	updatedSettings := models.Settings{MaintenanceMode: input.MaintenanceMode, DefaultReaderId: input.DefaultReaderId}

	models.DB.Model(&settings).Updates(&updatedSettings)

	if libs.HandleSSENotificationError(c, libs.SendSSEContentUpdateNotification("settings")) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": settings})
}
