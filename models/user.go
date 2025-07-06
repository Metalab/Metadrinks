package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	UserID    uuid.UUID      `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()"`
	Name      string         `json:"name" gorm:"index,unique"`
	Password  string         `json:"password,omitempty"`
	Balance   int            `json:"balance" gorm:"default:0"`
	IsTrusted bool           `json:"is_trusted" gorm:"default:false"`
	IsAdmin   bool           `json:"is_admin" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UsedAt    time.Time      `json:"used_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at"`
}
