package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Item struct {
	ItemId         uuid.UUID       `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()" example:"00000000-0000-0000-0000-000000000000"`
	ProductName    string          `json:"name" gorm:"uniqueIndex:name_variant_volume_idx"`
	ProductVariant string          `json:"variant,omitempty" gorm:"uniqueIndex:name_variant_volume_idx"`
	Image          string          `json:"image,omitempty"`
	Volume         uint            `json:"volume" gorm:"uniqueIndex:name_variant_volume_idx"` // in ml
	Price          uint            `json:"price"`                                             // price we are selling for
	PurchasePrice  uint            `json:"purchase_price,omitempty"`                          // price we bought for
	DepositPrice   uint            `json:"deposit_price,omitempty"`                           // how much the deposit is on the bottle/can/etc from selling price
	Tags           pq.StringArray  `json:"tags,omitempty" gorm:"type:jsonb;serializer:json"`  // describes the item (vegan, sugarfree, etc)
	Amount         uint            `json:"amount,omitempty" gorm:"-"`                         // do not write this to db - it is only used when creating a purchase
	Barcodes       pq.StringArray  `json:"barcodes,omitempty" gorm:"type:jsonb;serializer:json"`
	NutritionInfo  []NutritionInfo `json:"nutrition_info,omitempty" gorm:"type:jsonb;serializer:json"`
	IsActive       *bool           `json:"is_active" gorm:"default:true"`
	CreatedAt      time.Time       `json:"-"`
	DeletedAt      gorm.DeletedAt  `json:"deleted_at,omitempty"`
}

type NutritionInfo struct {
	Name  string `json:"name" gorm:"unique" binding:"required"`
	Value string `json:"value" binding:"required"`
}
