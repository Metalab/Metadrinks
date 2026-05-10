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

	jwt "metalab/metadrinks/libs/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreatePurchaseInput struct {
	Items       []PurchaseItemInput `json:"items"`
	PaymentType models.PaymentType  `json:"payment_type" binding:"required"`
	Amount      uint                `json:"amount"` // used only for adding balance
	ReaderId    string              `json:"reader_id"`
}

type PurchaseItemInput struct {
	ItemId uuid.UUID `json:"id" binding:"required"`
	Amount uint      `json:"amount" binding:"required"` // quantity/amount from frontend
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
	var profit = 0
	clientTransactionId := ""
	var transactionDescription []string
	var transactionStatus sumupmodels.TransactionFullStatus
	var returnedItemsArray []models.PurchaseItem
	userClaims := jwt.ExtractClaims(c)
	userId := uuid.MustParse(userClaims["userId"].(string))
	userTrust := userClaims["trusted"].(bool)

	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	if input.Amount != 0 && len(input.Items) != 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Only one of 'items' and 'amount' can be specified"})
		return
	}

	if input.Amount != 0 && input.PaymentType == models.PaymentTypeBalance {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Balance payment type cannot be used with amount"})
		return
	}

	if input.Amount != 0 && userClaims["restricted"].(bool) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "User is restricted"})
		return
	}

	for _, v := range input.Items {
		item := FindItemById(v.ItemId)
		if item.IsActive != nil && *item.IsActive == false {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Attempted to purchase inactive item"})
			return
		}
		finalCost += item.Price * v.Amount
		if item.PurchasePrice != 0 {
			profit += int(((item.Price - item.PurchasePrice) - (item.DepositPrice)) * v.Amount)
		}
		returnedItemsArray = append(returnedItemsArray, models.PurchaseItem{ItemId: v.ItemId, ProductName: item.ProductName, ProductVariant: item.ProductVariant, Volume: item.Volume, Price: item.Price, PurchasePrice: item.PurchasePrice, DepositPrice: item.DepositPrice, Amount: v.Amount})
		if v.Amount > 1 {
			transactionDescription = append(transactionDescription, fmt.Sprintf("%s x%d ", item.ProductName, v.Amount))
		} else {
			transactionDescription = append(transactionDescription, fmt.Sprintf("%s ", item.ProductName))
		}
	}

	finalTransactionDescription := strings.Join(transactionDescription[:], ", ")
	switch input.PaymentType {
	case models.PaymentTypeCard:
		if finalCost == 0 && input.Amount != 0 {
			finalCost = input.Amount
			finalTransactionDescription = fmt.Sprintf("Balance top-up of €%d", input.Amount)
		}
		var err error
		transactionStatus = sumupmodels.TransactionFullStatusPending
		clientTransactionId, err = libs.StartReaderCheckout(input.ReaderId, finalCost, &finalTransactionDescription)
		if err != nil {
			fmt.Printf("error while creating reader checkout: %s\n", libs.FormatSumUpError(err))
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": libs.FormatSumUpError(err)})
			return
		}
	case models.PaymentTypeCash:
		if input.Amount != 0 {
			finalCost = input.Amount
			libs.UpdateUserBalance(userId, int(input.Amount))
		}
		transactionStatus = sumupmodels.TransactionFullStatusSuccessful
	case models.PaymentTypeBalance:
		balance, err := libs.GetUserBalance(userId)
		if err != nil {
			if err.Error() == "user is restricted" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "user is restricted"})
				return
			}
			fmt.Printf("error while getting user balance for purchase: user_id=%s final_cost=%d error=%s\n", userId, finalCost, err.Error())
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		if finalCost >= math.MaxInt32 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Final cost exceeds maximum allowed value"})
			return
		}

		if (*balance-int(finalCost) < 0) && !userTrust {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Not enough balance"})
			return
		}

		transactionStatus = sumupmodels.TransactionFullStatusSuccessful
		libs.UpdateUserBalance(userId, -int(finalCost))
	}

	purchase := models.Purchase{Items: returnedItemsArray, PaymentType: input.PaymentType, ClientTransactionId: clientTransactionId, TransactionStatus: transactionStatus, FinalCost: finalCost, RefundAmount: input.Amount, Profit: profit, CreatedBy: userId}
	if err := models.DB.Create(&purchase).Error; err != nil {
		fmt.Printf("error while creating purchase: user_id=%s payment_type=%s final_cost=%d error=%s\n", userId, input.PaymentType, finalCost, err.Error())
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	purchase.Profit = 0 // omit from response
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
	isAdmin := userClaims["admin"].(bool)

	limit := c.DefaultQuery("limit", "-1")
	limitInt, err := strconv.Atoi(limit)

	page := c.DefaultQuery("page", "1")
	pageInt, err := strconv.Atoi(page)

	offsetInt := (pageInt - 1) * limitInt

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	if !isAdmin {
		models.DB.Where("created_by = ?", userId).Order("created_at DESC").Limit(limitInt).Offset(offsetInt).Find(&purchases)
		for i := range purchases {
			purchases[i].Profit = 0 // do not return profit for non-admins
		}
	} else {
		models.DB.Order("created_at DESC").Limit(limitInt).Offset(offsetInt).Find(&purchases)
	}

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
	isAdmin := userClaims["admin"].(bool)

	if !isAdmin {
		if err := models.DB.Where("created_by = ?", userId).Where("purchase_id = ?", c.Param("id")).First(&purchase).Error; err != nil {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		purchase.Profit = 0 // do not return profit for non-admins
	} else {
		if err := models.DB.Where("purchase_id = ?", c.Param("id")).First(&purchase).Error; err != nil {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": purchase})
}
