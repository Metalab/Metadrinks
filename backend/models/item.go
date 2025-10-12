package models

import "github.com/google/uuid"

type Item struct {
	ItemId  uuid.UUID `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()" example:"00000000-0000-0000-0000-000000000000"`
	Name    string    `json:"name" gorm:"unique"`
	Image   string    `json:"image,omitempty"`
	Price   uint      `json:"price"`
	Amount  uint      `json:"amount,omitempty" gorm:"default:1"`
	Barcode string    `json:"barcode,omitempty" gorm:"size:13"` //barcodes are 13 numbers long
}
