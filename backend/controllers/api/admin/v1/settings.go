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
	MaintenanceMode *bool                  `json:"maintenance,omitempty"`
	DefaultReaderId *string                `json:"default_reader_id,omitempty"`
	BalanceSettings *BalanceSettingsUpdate `json:"balance_settings,omitempty"`
}

type BalanceSettingsUpdate struct {
	Enabled *bool `json:"enabled,omitempty"`
	Max     *int  `json:"max,omitempty"`
	Min     *int  `json:"min,omitempty"`
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

	balanceSettings := settings.BalanceSettings
	if input.BalanceSettings != nil {
		if input.BalanceSettings.Enabled != nil {
			balanceSettings.IsEnabled = *input.BalanceSettings.Enabled
		}
		if input.BalanceSettings.Max != nil {
			balanceSettings.MaxBalance = *input.BalanceSettings.Max
		}
		if input.BalanceSettings.Min != nil {
			balanceSettings.MinBalance = *input.BalanceSettings.Min
		}
	}

	updatedSettings := models.Settings{
		MaintenanceMode: input.MaintenanceMode,
		DefaultReaderId: input.DefaultReaderId,
		BalanceSettings: balanceSettings,
	}

	if err := models.DB.Model(&settings).Updates(&updatedSettings).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to update settings"})
		return
	}

	if libs.HandleSSENotificationError(c, libs.SendSSEContentUpdateNotification("settings")) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": settings})
}

func GetSettings() (*models.Settings, error) {
	var settings models.Settings
	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}
