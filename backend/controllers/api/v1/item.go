package v1

import (
	"net/http"

	"metalab/metadrinks/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateItemInput struct {
	Name  string `json:"name" binding:"required"`
	Image string `json:"image"`
	Price uint   `json:"price" binding:"required"`
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

	item := models.Item{Name: input.Name, Image: input.Image, Price: input.Price}
	if err := models.DB.Create(&item).Error; err != nil {
		c.AbortWithStatus(http.StatusBadRequest /*, gin.H{"error": err.Error()}*/)
		return
	}

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
	models.DB.Find(&items).Order("sort_index ASC")

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

	if err := models.DB.Where("item_id = ?", c.Param("id")).First(&item).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func FindItemById(id uuid.UUID) models.Item {
	var item models.Item

	if err := models.DB.Where("item_id = ?", id).First(&item).Error; err != nil {
		return models.Item{Name: "No item found", Price: 0}
	}

	return item
}

type UpdateItemInput struct {
	Name  string `json:"name,omitempty"`
	Image string `json:"image,omitempty"`
	Price uint   `json:"price,omitempty"`
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

	updatedItem := models.Item{Name: input.Name, Image: input.Image, Price: input.Price}

	models.DB.Model(&item).Updates(&updatedItem)
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
