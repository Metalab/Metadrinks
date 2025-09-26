package v1

import (
	"fmt"
	"net/http"
	"time"

	"metalab/metadrinks/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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

	userId := uuid.New()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user := models.User{UserID: userId, Name: input.Name, Password: string(hashedPassword), UsedAt: time.Now().Local()}
	models.DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{"data": user})
}

// FindUsers godoc
//
//	@Summary		Find users
//	@Description	Lists all users
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]models.User
//	@Failure		500
//
//
//	@Router			/users [get]
func FindUsers(c *gin.Context) {
	var users []map[string]interface{}
	models.DB.Model(&models.User{}).Find(&users).Order("used_at DESC")

	for _, user := range users { // do not return the user password
		delete(user, "password")
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
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": user})
}

type UpdateUserInput struct {
	Name string `json:"name" binding:"required"`
}

/*func UpdateUser(c *gin.Context) {
	var user models.Item
	if err := models.DB.Where("user_id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	var input UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser := models.User{Name: input.Name}

	models.DB.Model(&user).Updates(&updatedUser)
	c.JSON(http.StatusOK, gin.H{"data": user})
}

func DeleteUser(c *gin.Context) {
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

func GetUserBalance(userId uuid.UUID) (*int, error) {
	var user models.User

	if err := models.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return nil, err
	}

	if user.IsRestricted {
		return nil, fmt.Errorf("user is restricted")
	}

	return &user.Balance, nil
}

func UpdateUserBalance(userId uuid.UUID, change int) {
	var user models.User

	if err := models.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return
	}

	user.Balance = user.Balance + change
	models.DB.Save(&user)
}
