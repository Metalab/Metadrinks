package models

import "github.com/google/uuid"

type Item struct {
	ItemId uuid.UUID `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()" example:"00000000-0000-0000-0000-000000000000"`
	Name   string    `json:"name" gorm:"unique"`
	Image  string    `json:"image" default:"assets/empty.webp"`
	Price  uint      `json:"price"`
}
