package models

import "github.com/google/uuid"

type Item struct {
	ItemId  uuid.UUID `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()" example:"00000000-0000-0000-0000-000000000000"`
	Name    string    `json:"name" gorm:"unique"`
	Image   string    `json:"image" gorm:"default:assets/empty.webp"`
	Price   uint      `json:"price"`
	Barcode string    `json:"barcode,omitempty" gorm:"size:13"` //barcodes are 13 numbers long
}
