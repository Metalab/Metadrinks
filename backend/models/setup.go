package models

import (
	"fmt"
	"metalab/metadrinks/libs/crypto"
	"os"
	"time"

	models "metalab/metadrinks/models/sumup"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := "host=" + os.Getenv("DB_HOST") + " user=" + os.Getenv("POSTGRES_USER") + " password=" + os.Getenv("POSTGRES_PASSWORD") + " dbname=" + os.Getenv("POSTGRES_DATABASE") + " port=" + os.Getenv("DB_PORT") + " sslmode=disable timezone=" + os.Getenv("DB_TIMEZONE")
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{}) // change the database provider if necessary
	if err != nil {
		panic("Failed to connect to database!" + err.Error())
	}

	database.AutoMigrate(&User{})
	database.AutoMigrate(&Item{})
	database.AutoMigrate(&Purchase{})
	database.AutoMigrate(&models.Reader{})

	hashedPassword, err := crypto.HashPasswordSecure("") //bcrypt.GenerateFromPassword([]byte(""), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error generating password hash: ", err)
		return
	}

	if database.Limit(1).Find(&User{Name: "guest"}).RowsAffected == 0 {
		database.Create(&User{UserID: uuid.Nil, Name: "Guest", Password: string(hashedPassword), IsTrusted: false, IsRestricted: true, UsedAt: time.Now().Local()})
	}

	DB = database
}

func LoadEnvironmentVariables() error {
	enforcedVars := []string{
		"SUMUP_API_KEY",
		"SUMUP_RETURN_URL",
		"JWT_SECRET",
		"GIN_TRUSTED_PROXIES",
		"CORS_ALLOWED_ORIGINS",
		"DB_HOST",
		"POSTGRES_USER",
		"POSTGRES_PASSWORD",
		"POSTGRES_DATABASE",
		"DB_PORT",
		"DB_TIMEZONE",
	}

	// Check if any required vars are missing
	missingVars := []string{}
	for _, envVar := range enforcedVars {
		if os.Getenv(envVar) == "" {
			missingVars = append(missingVars, envVar)
		}
	}

	// If some vars are missing, try loading from .env
	if len(missingVars) > 0 {
		fmt.Println("[INFO] Some environment variables not set, attempting to load from .env file...")
		if err := godotenv.Load(); err != nil {
			return fmt.Errorf("error loading .env file: %w", err)
		}
	}

	// Verify all required vars are now set
	stillMissing := []string{}
	for _, envVar := range enforcedVars {
		if os.Getenv(envVar) == "" {
			stillMissing = append(stillMissing, envVar)
		}
	}

	if len(stillMissing) > 0 {
		return fmt.Errorf("missing required environment variables: %v", stillMissing)
	}

	fmt.Println("[INFO] All required environment variables are set")
	return nil
}
