package v1

import (
	"encoding/json"
	"fmt"
	sse "metalab/metadrinks/controllers/api/payment/v1"
	"metalab/metadrinks/libs/crypto"
	"metalab/metadrinks/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateUserAdminInput struct {
	Name         string `json:"name" binding:"required"`
	Password     string `json:"password,omitempty"`
	IsTrusted    *bool  `json:"is_trusted,omitempty"`
	IsAdmin      *bool  `json:"is_admin,omitempty"`
	IsActive     *bool  `json:"is_active,omitempty"`
	IsRestricted *bool  `json:"is_restricted,omitempty"`
}

// CreateUser godoc
//
//	@Summary		Create user
//	@Description	creates a new user
//	@Tags			admin
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.User
//	@Failure		400
//	@Failure		500
//
//	@Param			user	body	CreateUserAdminInput	true	"Create user"
//
//	@Router			/users [post]
func CreateUser(c *gin.Context) {
	var input CreateUserAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.Name) > 24 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "name must not be longer than 24 characters"})
		return
	}

	userId := uuid.New()

	hashedPassword, err := crypto.HashPasswordSecure(input.Password) //bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{UserID: userId, Name: input.Name, Password: hashedPassword, IsTrusted: input.IsTrusted, IsAdmin: input.IsAdmin, IsActive: input.IsActive, IsRestricted: input.IsRestricted, UsedAt: time.Now().Local()}
	models.DB.Create(&user)

	notification := sse.SSENotification{
		NotificationType: sse.SSENotificationType(sse.SSENotificationContentUpdate),
		NotificationData: sse.SSENotificationPayload{
			ContentPayload: &sse.SSENotificationContentUpdatePayload{
				Type: "users",
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
	c.JSON(http.StatusOK, gin.H{"data": user})
}

// FindUsers godoc
//
//	@Summary		Find users
//	@Description	Lists all users
//	@Tags			admin
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]models.User
//	@Failure		500
//
//
//	@Router			/users [get]
func FindUsers(c *gin.Context) {
	var users []models.User

	models.DB.Order("used_at DESC").Find(&users)

	for i := range users { // do not return the user password
		users[i].Password = ""
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": users})
}

type UpdateUserInput struct {
	Name         string `json:"name,omitempty"`
	Password     string `json:"password,omitempty"`
	LoginBarcode string `json:"login_barcode,omitempty"`
	Image        string `json:"image,omitempty"`
	Balance      int    `json:"balance,omitempty"`
	IsTrusted    *bool  `json:"is_trusted,omitempty"`
	IsAdmin      *bool  `json:"is_admin,omitempty"`
	IsActive     *bool  `json:"is_active,omitempty"`
	IsRestricted *bool  `json:"is_restricted,omitempty"`
}

func UpdateUser(c *gin.Context) {
	var input UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("user_id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	if len(input.Name) > 24 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "name must not be longer than 24 characters"})
		return
	}

	if input.Password != "" {
		hashedPassword, err := crypto.HashPasswordSecure(input.Password)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.Password = hashedPassword
	}

	if input.Balance < 0 {
		// add logic for removing balance as administrative action in log
	} else if input.Balance > 0 {
		// add logic for adding balance as administrative action in log
	}

	updatedUser := models.User{Name: input.Name, Password: input.Password, LoginBarcode: input.LoginBarcode, Image: input.Image, Balance: input.Balance, IsTrusted: input.IsTrusted, IsAdmin: input.IsAdmin, IsActive: input.IsActive, IsRestricted: input.IsRestricted}

	models.DB.Model(&user).Updates(&updatedUser)

	notification := sse.SSENotification{
		NotificationType: sse.SSENotificationType(sse.SSENotificationContentUpdate),
		NotificationData: sse.SSENotificationPayload{
			ContentPayload: &sse.SSENotificationContentUpdatePayload{
				Type: "users",
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
	c.JSON(http.StatusOK, gin.H{"data": user})
}
