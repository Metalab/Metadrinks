package v1

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"metalab/metadrinks/libs"
	"metalab/metadrinks/models"
	sumupmodels "metalab/metadrinks/models/sumup"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreatePurchaseInput struct {
	Items       []models.Item      `json:"items"`
	PaymentType models.PaymentType `json:"payment_type" binding:"required"`
	Amount      uint               `json:"amount"` // used only for adding balance
	ReaderId    string             `json:"reader_id"`
}

// CreatePurchase godoc
//
//	@Summary		Create purchase
//	@Description	create new purchase - only item id is needed in initial creation request
//	@Tags			purchases
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.Purchase
//	@Failure		400 "Bad Request"
//	@Failure		400	"only one of 'items' and 'amount' can be specified"
//	@Failure		400	"final cost exceeds maximum allowed value"
//	@Failure		401 "Unauthorized"
//	@Failure		403 "Forbidden"
//	@Failure		403	"user is restricted"
//	@Failure		403	"not enough balance"
//	@Failure		500 "Internal Server Error"
//	@Failure		500	"error while creating reader checkout"
//
//	@Security		ApiKeyAuth
//
//	@Param			purchase	body	CreatePurchaseInput	true	"Create purchase"
//
//	@Router			/purchases [post]
func CreatePurchase(c *gin.Context) {
	var input CreatePurchaseInput
	var finalCost uint = 0
	clientTransactionId := ""
	var transactionDescription []string
	var transactionStatus sumupmodels.TransactionFullStatus
	var returnedItemsArray []models.Item
	userClaims := jwt.ExtractClaims(c)
	userId := uuid.MustParse(userClaims["userId"].(string))
	userTrust := userClaims["trusted"].(bool)

	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	if input.Amount != 0 && len(input.Items) != 0 {
		c.AbortWithError(http.StatusBadRequest, fmt.Errorf("only one of 'items' and 'amount' can be specified"))
		return
	}

	if input.Amount != 0 && userClaims["restricted"].(bool) {
		c.AbortWithError(http.StatusForbidden, fmt.Errorf("user is restricted"))
		return
	}

	for _, v := range input.Items {
		item := FindItemById(v.ItemId)
		finalCost += item.Price
		returnedItemsArray = append(returnedItemsArray, models.Item{ItemId: v.ItemId, Name: item.Name, Price: item.Price})
		transactionDescription = append(transactionDescription, fmt.Sprintf("%s", item.Name))
	}

	finalTransactionDescription := strings.Join(transactionDescription[:], ", ")
	switch input.PaymentType {
	case models.PaymentTypeCard:
		var err error
		transactionStatus = sumupmodels.TransactionFullStatusPending
		clientTransactionId, err = libs.StartReaderCheckout(input.ReaderId, finalCost, &finalTransactionDescription)
		if err != nil {
			fmt.Printf("error while creating reader checkout: %s\n", err.Error())
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	case models.PaymentTypeCash:
		transactionStatus = sumupmodels.TransactionFullStatusSuccessful
	case models.PaymentTypeBalance:
		if balance, err := GetUserBalance(userId); err == nil {
			if finalCost >= math.MaxInt32 {
				c.AbortWithError(http.StatusBadRequest, fmt.Errorf("final cost exceeds maximum allowed value"))
				return
			}
			if (*balance-int(finalCost) < 0) && !userTrust {
				c.AbortWithError(http.StatusForbidden, fmt.Errorf("not enough balance"))
				return
			} else {
				transactionStatus = sumupmodels.TransactionFullStatusSuccessful
				UpdateUserBalance(userId, -int(finalCost))
			}
		} else if err.Error() == "user is restricted" {
			c.AbortWithError(http.StatusForbidden, err)
			return
		} else {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}

	purchase := models.Purchase{Items: returnedItemsArray, PaymentType: input.PaymentType, ClientTransactionId: clientTransactionId, TransactionStatus: transactionStatus, FinalCost: finalCost, RefundAmount: input.Amount, CreatedBy: userId}
	models.DB.Create(&purchase)
	if input.Amount != 0 {
		UpdateUserBalance(userId, int(input.Amount))
	}

	c.JSON(http.StatusOK, gin.H{"data": purchase})
}

// FindPurchases godoc
//
//	@Summary		Find purchases
//	@Description	find purchases - only returns purchases of the currently logged-in user
//	@Tags			purchases
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]models.Purchase
//	@Failure		401
//	@Failure		500
//
//	@Security		ApiKeyAuth
//
//	@Router			/purchases [get]
func FindPurchases(c *gin.Context) {
	var purchases []models.Purchase
	userClaims := jwt.ExtractClaims(c)
	userId := uuid.MustParse(userClaims["userId"].(string))

	limit := c.DefaultQuery("limit", "-1")
	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	models.DB.Where("created_by = ?", userId).Find(&purchases).Limit(limitInt)

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": purchases})
}

// FindPurchase godoc
//
//	@Summary		Find purchase
//	@Description	find purchase - only returns purchases of the currently logged-in user
//	@Tags			purchases
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.Purchase
//	@Failure		401
//	@Failure		404
//	@Failure		500
//
//	@Param			id	path	string	true	"Purchase UUID"
//
//	@Security		ApiKeyAuth
//
//	@Router			/purchases/{id} [get]
func FindPurchase(c *gin.Context) {
	var purchase models.Purchase
	userClaims := jwt.ExtractClaims(c)
	userId := uuid.MustParse(userClaims["userId"].(string))

	if err := models.DB.Where("created_by = ?", userId).Where("purchase_id = ?", c.Param("id")).First(&purchase).Error; err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": purchase})
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
