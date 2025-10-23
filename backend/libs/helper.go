package libs

import (
	"fmt"
	"metalab/metadrinks/models"

	"github.com/google/uuid"
)

func GetUserBalance(userId uuid.UUID) (*int, error) {
	var user models.User

	if err := models.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return nil, err
	}

	if *user.IsRestricted {
		return nil, fmt.Errorf("user is restricted")
	}

	return &user.Balance, nil
}

func UpdateUserBalance(userId uuid.UUID, change int) {
	var user models.User

	if err := models.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return
	}

	if *user.IsRestricted {
		return
	}

	user.Balance = user.Balance + change
	models.DB.Save(&user)
}
