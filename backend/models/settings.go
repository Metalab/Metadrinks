package models

type Settings struct {
	ID              uint            `gorm:"primaryKey;unique" json:"-"`
	MaintenanceMode *bool           `json:"maintenance"`
	DefaultReaderId *string         `json:"default_reader_id"`
	BalanceSettings BalanceSettings `json:"balance_settings" gorm:"type:jsonb;serializer:json"`
	MerchantInfo    *string         `json:"merchant_info,omitempty"`
}

type BalanceSettings struct {
	IsEnabled  bool `json:"enabled" gorm:"default:true"`
	MaxBalance int  `json:"max,omitempty" gorm:"default:0"` // nullable not needed - 0 disables
	MinBalance int  `json:"min,omitempty" gorm:"default:0"` // nullable not needed - 0 disables
}
