package models

import (
	"fmt"
	models "metalab/drinks-pos/models/sumup"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(""), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error generating password hash: ", err)
		return
	}

	if database.Limit(1).Find(&User{Name: "guest"}).RowsAffected == 0 {
		database.Create(&User{UserID: uuid.Nil, Name: "guest", Password: string(hashedPassword), IsTrusted: false, UsedAt: time.Now().Local()})
	}

	DB = database
}
