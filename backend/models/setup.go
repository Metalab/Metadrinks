package models

import (
	"crypto/rand"
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
	dsn := "host=" + os.Getenv("DB_HOST") + " user=" + os.Getenv("POSTGRES_USER") + " password=" + os.Getenv("POSTGRES_PASSWORD") + " dbname=" + os.Getenv("POSTGRES_DB") + " port=" + os.Getenv("DB_PORT") + " sslmode=disable timezone=" + os.Getenv("TZ")
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{}) // change the database provider if necessary
	if err != nil {
		panic("Failed to connect to database!" + err.Error())
	}

	database.AutoMigrate(&User{})
	database.AutoMigrate(&Item{})
	database.AutoMigrate(&Purchase{})
	database.AutoMigrate(&Settings{})
	database.AutoMigrate(&models.Reader{})

	if database.Limit(1).Find(&User{Name: "guest"}).RowsAffected == 0 {
		hashedPassword, err := crypto.HashPasswordSecure("")
		if err != nil {
			fmt.Println("Error generating guest password hash: ", err)
			return
		}
		database.Create(&User{UserID: uuid.Nil, Name: "Guest", Password: hashedPassword, IsAdmin: BoolPointer(false), IsTrusted: BoolPointer(false), IsRestricted: BoolPointer(true), UsedAt: time.Now().Local()})
		fmt.Println("[INFO] Created guest user")
	}

	if database.Where("is_admin = true").Find(&User{}).RowsAffected == 0 {
		key := rand.Text()
		hashedPassword, err := crypto.HashPasswordSecure(key)
		if err != nil {
			fmt.Println("Error generating admin password hash: ", err)
			return
		}
		database.Create(&User{UserID: uuid.Nil, Name: "a-admin", Password: hashedPassword, IsAdmin: BoolPointer(true), IsTrusted: BoolPointer(false), IsRestricted: BoolPointer(false), UsedAt: time.Now().Local()})
		fmt.Printf("\n[INFO] Created default admin user with password %s\n", key)
	}

	if database.Where("id = ?", 1).Find(&Settings{}).RowsAffected == 0 {
		database.Create(&Settings{ID: 1, MaintenanceMode: BoolPointer(false), MerchantInfo: nil})
		fmt.Println("[INFO] Created default settings")
	}

	DB = database
}

func BoolPointer(b bool) *bool {
	return &b
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
		"POSTGRES_DB",
		"DB_PORT",
		"TZ",
	}

	// Check if any required vars are missing
	var missingVars []string
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
	var stillMissing []string
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
