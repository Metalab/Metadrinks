package controllers

import (
	"fmt"
	"math"
	"metalab/drinks-pos/libs"
	"metalab/drinks-pos/models"
	sumup_models "metalab/drinks-pos/models/sumup"
	"net/http"
	"strings"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreatePurchaseInput struct {
	Items       []models.Item `json:"items" binding:"required"`
	PaymentType string        `json:"payment_type" binding:"required"`
	ReaderId    string        `json:"reader_id"`
}

func CreatePurchase(c *gin.Context) {
	var input CreatePurchaseInput
	var finalCost uint = 0
	var client_transaction_id string = ""
	var transaction_description []string
	var transaction_status sumup_models.TransactionFullStatus
	returnedItemsArray := []models.Item{}
	var userClaims = jwt.ExtractClaims(c)
	var userId = uuid.MustParse(userClaims["userId"].(string))
	var userTrust = userClaims["trusted"].(bool)

	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, v := range input.Items {
		item := FindItemById(v.ItemId)
		finalCost += item.Price
		returnedItemsArray = append(returnedItemsArray, models.Item{ItemId: v.ItemId, Name: item.Name, Price: item.Price})
		transaction_description = append(transaction_description, fmt.Sprintf("%s", item.Name))
	}

	var final_transaction_description = strings.Join(transaction_description[:], ", ")
	switch input.PaymentType {
	case "card":
		var err error
		transaction_status = sumup_models.TransactionFullStatusPending
		client_transaction_id, err = libs.StartReaderCheckout(input.ReaderId, finalCost, &final_transaction_description)
		if err != nil {
			fmt.Printf("error while creating reader checkout: %s\n", err.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	case "cash":
		transaction_status = sumup_models.TransactionFullStatusSuccessful
	case "balance":
		if balance, err := GetUserBalance(userId); err != nil {
			if finalCost >= math.MaxInt32 {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "final cost exceeds maximum allowed value"})
				transaction_status = sumup_models.TransactionFullStatusFailed
				return
			}
			if (int(*balance)-int(finalCost) < 0) && !userTrust {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "not enough balance"})
				transaction_status = sumup_models.TransactionFullStatusFailed
				return
			} else {
				transaction_status = sumup_models.TransactionFullStatusSuccessful
				UpdateUserBalance(userId, -int(finalCost))
			}
		}
	}

	purchase := models.Purchase{Items: returnedItemsArray, PaymentType: models.PaymentType(input.PaymentType), ClientTransactionId: client_transaction_id, TransactionStatus: transaction_status, FinalCost: finalCost, CreatedBy: userId}
	models.DB.Create(&purchase)

	c.JSON(http.StatusOK, gin.H{"data": purchase})
}

func FindPurchases(c *gin.Context) {
	var purchases []models.Purchase
	models.DB.Find(&purchases)

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": purchases})
}

func FindPurchase(c *gin.Context) {
	var purchase models.Purchase

	if err := models.DB.Where("purchase_id = ?", c.Param("id")).First(&purchase).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": purchase})
}

func FindPurchaseByTransactionId(id string) (*models.Purchase, error) {
	var purchase models.Purchase
	if err := models.DB.Where("client_transaction_id = ?", id).First(&purchase).Error; err != nil {
		return nil, err
	}
	return &purchase, nil
}

/*type UpdatePurchaseInput struct {
	Items       []models.Item `json:"items" binding:"required"`
	PaymentType string        `json:"payment_type" binding:"required"`
}

func UpdatePurchase(c *gin.Context) {
	var purchase models.Purchase
	if err := models.DB.Where("purchase_id = ?", c.Param("id")).First(&purchase).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	var input UpdatePurchaseInput
	var finalCost uint = 0
	returnArray := []models.Item{}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, v := range input.Items {
		item := FindItemById(v.ItemId)
		if item.Name == "No item found" {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "itemid " + strconv.FormatUint(uint64(v.ItemId), 10) + " not found"})
		}
		finalCost += (item.Price * v.Quantity)
		returnArray = append(returnArray, models.Item{ItemId: v.ItemId, Name: item.Name, Quantity: v.Quantity, Price: item.Price})
	}

	finalCost += input.Tip
	updatedPurchase := models.Purchase{Items: returnArray, PaymentType: input.PaymentType, Tip: input.Tip, FinalCost: finalCost}

	models.DB.Model(&purchase).Updates(&updatedPurchase)
	c.JSON(http.StatusOK, gin.H{"data": purchase})
}

func DeletePurchase(c *gin.Context) {
	var purchase models.Purchase
	if err := models.DB.Where("purchase_id = ?", c.Param("id")).First(&purchase).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	models.DB.Delete(&purchase)
	c.JSON(http.StatusOK, gin.H{"data": "success"})
}*/
