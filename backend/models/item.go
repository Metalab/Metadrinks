package models

import (
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Item struct {
	ItemId   uuid.UUID      `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()" example:"00000000-0000-0000-0000-000000000000"`
	Name     string         `json:"name" gorm:"unique"`
	Image    string         `json:"image,omitempty"`
	Price    uint           `json:"price"`
	Amount   uint           `json:"amount,omitempty" gorm:"-"` //do not write this to db - it is only used when creating a purchase
	Barcodes pq.StringArray `json:"barcodes,omitempty" gorm:"type:text"`
}
