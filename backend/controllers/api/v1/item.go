package v1

import (
	"encoding/json"
	"fmt"
	sse "metalab/metadrinks/controllers/payment/v1"
	"net/http"

	"metalab/metadrinks/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type CreateItemInput struct {
	ProductName    string                 `json:"name" binding:"required"`
	ProductVariant string                 `json:"variant"`
	Image          string                 `json:"image"`
	Volume         uint                   `json:"volume" binding:"required"`
	Price          uint                   `json:"price" binding:"required"`
	Barcodes       pq.StringArray         `json:"barcodes"`
	NutritionInfo  []models.NutritionInfo `json:"nutrition_info"`
	IsActive       bool                   `json:"is_active" default:"true"`
}

//	@BasePath	/api/v1

// CreateItem godoc
//
//	@Summary		Create item
//	@Description	create new item
//	@Tags			items
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.Item
//	@Failure		401
//	@Failure		500
//
//	@Param			item	body	CreateItemInput	true	"Create item"
//
//	@Security		ApiKeyAuth
//
//	@Router			/items [post]
func CreateItem(c *gin.Context) {
	var input CreateItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := models.Item{ProductName: input.ProductName, ProductVariant: input.ProductVariant, Image: input.Image, Volume: input.Volume, Price: input.Price, Barcodes: input.Barcodes, NutritionInfo: input.NutritionInfo, IsActive: input.IsActive}
	if err := models.DB.Create(&item).Error; err != nil {
		c.AbortWithStatus(http.StatusBadRequest /*, gin.H{"error": err.Error()}*/)
		return
	}

	notification := sse.SSENotification{
		NotificationType: sse.SSENotificationType(sse.SSENotificationContentUpdate),
		NotificationData: sse.SSENotificationPayload{
			ContentPayload: &sse.SSENotificationContentUpdatePayload{
				Type: "items",
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
	c.JSON(http.StatusOK, gin.H{"data": item})
}

// FindItems godoc
//
//	@Summary		Find items
//	@Description	get items
//	@Tags			items
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]models.Item
//	@Failure		500
//	@Router			/items [get]
func FindItems(c *gin.Context) {
	var items []models.Item
	models.DB.Where("is_active = true").Find(&items)

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": items})
}

// FindItem godoc
//
//	@Summary		Find item
//	@Description	get specific item
//	@Tags			items
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.Item
//	@Failure		404
//	@Failure		500
//
//	@Param			id	path	string	true	"Item UUID"
//
//	@Router			/items/{id} [get]
func FindItem(c *gin.Context) {
	var item models.Item

	if err := models.DB.Order("created_at ASC").Where("item_id = ?", c.Param("id")).First(&item).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func FindItemById(id uuid.UUID) models.Item {
	var item models.Item

	if err := models.DB.Where("item_id = ?", id).First(&item).Error; err != nil {
		return models.Item{ProductName: "No item found", Price: 0}
	}

	return item
}

type UpdateItemInput struct {
	ProductName    string                 `json:"name,omitempty"`
	ProductVariant string                 `json:"variant,omitempty"`
	Image          string                 `json:"image,omitempty"`
	Volume         uint                   `json:"volume,omitempty"`
	Price          uint                   `json:"price,omitempty"`
	Barcodes       pq.StringArray         `json:"barcodes,omitempty"`
	NutritionInfo  []models.NutritionInfo `json:"nutrition_info,omitempty"`
	IsActive       bool                   `json:"is_active,omitempty"`
}

// UpdateItem godoc
//
//	@Summary		Update item
//	@Description	update specific item
//	@Tags			items
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.Item
//	@Failure		401
//	@Failure		404
//	@Failure		500
//
//	@Security		ApiKeyAuth
//
//	@Param			id	path	string	true	"Item UUID"
//
//	@Router			/items/{id} [put]
func UpdateItem(c *gin.Context) {
	var item models.Item
	if err := models.DB.Where("item_id = ?", c.Param("id")).First(&item).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	var input UpdateItemInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedItem := models.Item{ProductName: input.ProductName, ProductVariant: input.ProductVariant, Image: input.Image, Volume: input.Volume, Price: input.Price, Barcodes: input.Barcodes, NutritionInfo: input.NutritionInfo, IsActive: input.IsActive}

	models.DB.Model(&item).Updates(&updatedItem)

	notification := sse.SSENotification{
		NotificationType: sse.SSENotificationType(sse.SSENotificationContentUpdate),
		NotificationData: sse.SSENotificationPayload{
			ContentPayload: &sse.SSENotificationContentUpdatePayload{
				Type: "items",
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
	c.JSON(http.StatusOK, gin.H{"data": item})
}

// DeleteItem godoc
//
//	@Summary		Delete item
//	@Description	delete specific item
//	@Tags			items
//	@Accept			json
//	@Produce		json
//	@Success		200	{string} string	"success"
//	@Failure		401
//	@Failure		404
//	@Failure		500
//
//	@Security		ApiKeyAuth
//
//	@Param			id	path	string	true	"Item UUID"
//
//	@Router			/items/{id} [delete]
func DeleteItem(c *gin.Context) {
	var item models.Item
	if err := models.DB.Where("item_id = ?", c.Param("id")).First(&item).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	models.DB.Delete(&item)
	c.JSON(http.StatusOK, gin.H{"data": "success"})
}
