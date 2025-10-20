package models

type Settings struct {
	ID              uint   `gorm:"primaryKey;unique" json:"-"`
	MaintenanceMode *bool  `json:"maintenance"`
	DefaultReaderId string `json:"default_reader_id"`
}
