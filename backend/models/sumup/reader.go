package models

import "time"

// Meta is a set of user-defined key-value pairs attached to the object.
// Max properties: 50
type Meta map[string]any

// A Reader is a physical card reader device that can accept in-person payments.
type Reader struct {
	// Reader creation timestamp.
	CreatedAt time.Time `json:"created_at"`
	// Information about the underlying physical device.
	Device ReaderDevice `json:"device" gorm:"foreignKey:Identifier;type:bytes;serializer:gob"`
	// Unique identifier of the object.
	//
	// Note that this identifies the instance of the physical devices pairing with your SumUp account.
	//
	// If you DELETE a reader, and pair the device again, the ID will be different. Do not use this ID to refer to
	// a physical device.
	// Min length: 30
	// Max length: 30
	ReaderId ReaderId `json:"id"`
	// Set of user-defined key-value pairs attached to the object.
	// Max properties: 50
	Meta *Meta `json:"meta,omitempty" gorm:"type:bytes;serializer:json"`
	// Custom human-readable, user-defined name for easier identification of the reader.
	// Max length: 500
	Name ReaderName `json:"name" gorm:"unique"`
	// The status of the reader object gives information about the current state of the reader.
	//
	// Possible values:
	//
	// - `unknown` - The reader status is unknown.
	// - `processing` - The reader is created and waits for the physical device to confirm the pairing.
	// - `paired` - The reader is paired with a merchant account and can be used with SumUp APIs.
	// - `expired` - The pairing is expired and no longer usable with the account. The resource needs to get recreated
	Status ReaderStatus `json:"status"`
	// Reader last-modification timestamp.
	UpdatedAt time.Time `json:"updated_at"`
}

// ReaderDevice gives information about the underlying physical device.
type ReaderDevice struct {
	// A unique identifier of the physical device (e.g. serial number).
	Identifier string `json:"identifier"`
	// Identifier of the model of the device.
	Model ReaderDeviceModel `json:"model"`
}

// ReaderDeviceModel is the identifier of the model of the device.
type ReaderDeviceModel string

//goland:noinspection GoUnusedConst,GoUnusedConst
const (
	ReaderDeviceModelSolo        ReaderDeviceModel = "solo"
	ReaderDeviceModelVirtualSolo ReaderDeviceModel = "virtual-solo"
)

// ReaderId is the unique identifier of the object.
//
// Note that this identifies the instance of the physical devices pairing with your SumUp account.
//
// If you DELETE a reader, and pair the device again, the ID will be different. Do not use this ID to refer to
// a physical device.
//
// Min length: 30
// Max length: 30
type ReaderId string

// ReaderName is a custom human-readable, user-defined name for easier identification of the reader.
//
// Max length: 500
type ReaderName string

// ReaderPairingCode is an 8 or 9 character alphanumeric string that is displayed on a SumUp
// Device after initiating the pairing.
// It is used to link the physical device to the created pairing.
//
// Min length: 8
// Max length: 9
type ReaderPairingCode string

// ReaderStatus is the status of the reader object gives information about the current state of the reader.
//
// Possible values:
//
// - `unknown` - The reader status is unknown.
// - `processing` - The reader is created and waits for the physical device to confirm the pairing.
// - `paired` - The reader is paired with a merchant account and can be used with SumUp APIs.
// - `expired` - The pairing is expired and no longer usable with the account. The resource needs to get recreated
type ReaderStatus string

//goland:noinspection GoUnusedConst,GoUnusedConst,GoUnusedConst
const (
	ReaderStatusExpired    ReaderStatus = "expired"
	ReaderStatusPaired     ReaderStatus = "paired"
	ReaderStatusProcessing ReaderStatus = "processing"
	ReaderStatusUnknown    ReaderStatus = "unknown"
)

type ReaderCheckoutStatusChange struct {
	Id        string                            `json:"id"`
	EventType string                            `json:"event_type"`
	Payload   ReaderCheckoutStatusChangePayload `json:"payload" gorm:"foreignKey:ClientTransactionId;type:bytes;serializer:gob"`
	UpdatedAt time.Time                         `json:"timestamp"`
}

type ReaderCheckoutStatusChangePayload struct {
	ClientTransactionId string                `json:"client_transaction_id"`
	MerchantCode        string                `json:"merchant_code"`
	Status              TransactionFullStatus `json:"status"`
	TransactionId       string                `json:"transaction_id,omitempty"`
}

// TransactionFullStatus is the current status of the transaction.
type TransactionFullStatus string

//goland:noinspection GoUnusedConst,GoUnusedConst
const (
	TransactionFullStatusCancelled  TransactionFullStatus = "cancelled"
	TransactionFullStatusFailed     TransactionFullStatus = "failed"
	TransactionFullStatusPending    TransactionFullStatus = "pending"
	TransactionFullStatusSuccessful TransactionFullStatus = "successful"
)
