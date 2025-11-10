package v1

import (
	"encoding/json"
	"fmt"
	sse "metalab/metadrinks/controllers/api/payment/v1"
	"metalab/metadrinks/libs"
	jwt "metalab/metadrinks/libs/auth"
	"metalab/metadrinks/libs/crypto"
	"net/http"
	"time"

	"metalab/metadrinks/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateUserInput struct {
	Name     string `json:"name" binding:"required"`
	Password string `json:"password,omitempty"`
}

// CreateUser godoc
//
//	@Summary		Create user
//	@Description	creates a new user
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.User
//	@Failure		400
//	@Failure		500
//
//	@Param			user	body	CreateUserInput	true	"Create user"
//
//	@Router			/users [post]
func CreateUser(c *gin.Context) {
	var input CreateUserInput
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

	user := models.User{UserID: userId, Name: input.Name, Password: hashedPassword, UsedAt: time.Now().Local()}
	models.DB.Create(&user)

	notification := sse.SSENotification{
		NotificationType: sse.SSENotificationType(sse.SSENotificationContentUpdate),
		NotificationData: sse.SSENotificationPayload{
			ContentPayload: &sse.SSENotificationContentUpdatePayload{
				Type: "users",
			},
		},
	}

	user.Password = ""
	user.LoginBarcode = ""

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
//	@Description	Lists all users except admins
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]models.User
//	@Failure		500
//
//
//	@Router			/users [get]
func FindUsers(c *gin.Context) {
	var users []models.User

	models.DB.Where("is_admin = false").Order("used_at DESC").Find(&users)

	for i := range users { // do not return the user password
		users[i].Password = ""
		users[i].LoginBarcode = ""
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": users})
}

// FindUser godoc
//
//	@Summary		Find user
//	@Description	Returns specific user
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.User
//	@Failure		500
//
//	@Param			id	path	string	true	"User UUID"
//
//	@Router			/users/{id} [get]
func FindUser(c *gin.Context) {
	var user models.User

	if err := models.DB.Where("user_id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user.Password = ""
	user.LoginBarcode = ""
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": user})
}

type UpdateUserInput struct {
	OldPassword          string `json:"old_password,omitempty"`
	Password             string `json:"password,omitempty"`
	GenerateLoginBarcode *bool  `json:"generate_login_barcode,omitempty"`
}

func UpdateUser(c *gin.Context) {
	var input UpdateUserInput
	var loginBarcode = ""
	userClaims := jwt.ExtractClaims(c)
	userId := uuid.MustParse(userClaims["userId"].(string))
	userRestricted := userClaims["restricted"].(bool)
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if userRestricted {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "user is restricted"})
		return
	}

	if uId, err := uuid.Parse(c.Param("id")); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	} else if userId != uId {
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	var user models.User
	if err := models.DB.Where("user_id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	if input.Password != "" {
		if input.OldPassword == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "old_password cannot be empty"})
			return
		}

		if err := crypto.AuthenticateUser(user.Password, input.OldPassword); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "old_password does not match"})
			return
		}

		hashedPassword, err := crypto.HashPasswordSecure(input.Password)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.Password = hashedPassword
	}

	if input.GenerateLoginBarcode != nil && *input.GenerateLoginBarcode == true {
		generatedBarcode, err := libs.GenerateSecureEAN13()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to generate barcode: %s", err.Error())})
			return
		}
		loginBarcode = generatedBarcode
	}

	updatedUser := models.User{Password: input.Password, LoginBarcode: loginBarcode}

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

	user.Password = ""
	if loginBarcode == "" {
		user.LoginBarcode = ""
	}
	sse.Stream.SendMessage(string(notificationJSON))
	c.JSON(http.StatusOK, gin.H{"data": user})
}

/*func DeleteUser(c *gin.Context) {
	var user models.User
	if err := models.DB.Where("user_id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	models.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"data": "success"})
}*/

/*
	func UpdateUserBalance(c *gin.Context) {
		var user models.User
		if err := models.DB.Where("user_id = ?", c.Param("id")).First(&user).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
			return
		}

		var input struct {
			Balance int `json:"balance" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Balance > 0 {

		} else if input.Balance < 0 {

		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "added balance must not be 0"})
			return
		}

		user.Balance = user.Balance + input.Balance
		models.DB.Save(&user)

		c.JSON(http.StatusOK, gin.H{"data": user})
	}
*/
