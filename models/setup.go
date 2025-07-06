package models

import (
	models "metalab/drinks-pos/models/sumup"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := "host=localhost user=backend password=backend-pw dbname=drinks port=5432 sslmode=disable timezone=Europe/Vienna"
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{}) // change the database provider if necessary

	if err != nil {
		panic("Failed to connect to database!" + err.Error())
	}

	database.AutoMigrate(&User{})
	database.AutoMigrate(&Item{})
	database.AutoMigrate(&Purchase{})
	database.AutoMigrate(&models.Reader{})

	if database.Limit(1).Find(&User{Name: "guest"}).RowsAffected == 0 {
		database.Create(&User{UserID: uuid.Nil, Name: "guest", IsTrusted: false})
	}

	DB = database
}
