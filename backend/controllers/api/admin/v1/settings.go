package v1

import (
	"encoding/json"
	"fmt"
	sse "metalab/metadrinks/controllers/api/payment/v1"
	"metalab/metadrinks/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func FindSettings(c *gin.Context) {
	var settings models.Settings
	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": settings})
}

type UpdateSettingsInput struct {
	MaintenanceMode *bool  `json:"maintenance,omitempty"`
	DefaultReaderId string `json:"default_reader_id,omitempty"`
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

	notification := sse.SSENotification{
		NotificationType: sse.SSENotificationType(sse.SSENotificationContentUpdate),
		NotificationData: sse.SSENotificationPayload{
			ContentPayload: &sse.SSENotificationContentUpdatePayload{
				Type: "settings",
			},
		},
	}

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		fmt.Printf("error marshalling notification: %s\n", err.Error())
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to process notification"})
		return
	}

	sse.Stream.SendMessage(string(notificationJSON))
	c.JSON(http.StatusOK, gin.H{"data": settings})
}
