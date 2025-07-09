package v1

import (
	"metalab/drinks-pos/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var balance int

type CreateUserInput struct {
	Name     string `json:"name" binding:"required"`
	Password string `json:"password,omitempty"`
}

func CreateUser(c *gin.Context) {
	var input CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userId = uuid.New()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user := models.User{UserID: userId, Name: input.Name, Password: string(hashedPassword), UsedAt: time.Now().Local()}
	models.DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func FindUsers(c *gin.Context) {
	var users []map[string]interface{}
	models.DB.Model(&models.User{}).Find(&users).Order("used_at DESC")

	for _, user := range users { //do not return the user password
		delete(user, "password")
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, gin.H{"data": users})
}

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

func FindUserById(id uuid.UUID) (*models.User, error) {
	var user models.User

	if err := models.DB.Where("user_id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

type UpdateUserInput struct {
	Name string `json:"name" binding:"required"`
}

func UpdateUser(c *gin.Context) {
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
}

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

func VerifyPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func TryAuthenticate(username, password string) (*models.User, error) {
	var user models.User

	if err := models.DB.Where("name = ?", username).First(&user).Error; err != nil {
		return nil, err
	}

	if err := VerifyPassword(password, user.Password); err != nil {
		return nil, err
	}

	return &user, nil
}
