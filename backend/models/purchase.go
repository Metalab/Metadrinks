package models

import (
	"time"

	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/google/uuid"
)

type Purchase struct {
	PurchaseId          uuid.UUID                         `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()"`
	Items               []Item                            `json:"items" gorm:"foreignKey:ItemID;type:bytes;serializer:gob"`
	PaymentType         PaymentType                       `json:"payment_type"`
	TransactionStatus   sumupmodels.TransactionFullStatus `json:"status"`
	ClientTransactionId string                            `json:"client_transaction_id,omitempty"`
	FinalCost           uint                              `json:"final_cost"`
	RefundAmount        uint                              `json:"refund_amount,omitempty"` // adds balance to the user account
	CreatedAt           time.Time                         `json:"created_at"`
	CreatedBy           uuid.UUID                         `json:"created_by"` // uuid of user, otherwise null uuid (for guests)
}

// PaymentType The type of the payment object gives information about the type of payment.
//
// Possible values:
//
// - `cash`: The payment was made with cash.
// - `unpaid`: The payment was made with a credit/debit card.
// - `balance`: The payment was made using the balance of the logged in user.
type PaymentType string

const (
	PaymentTypeCash    PaymentType = "cash"
	PaymentTypeCard    PaymentType = "card"
	PaymentTypeBalance PaymentType = "balance"
	PaymentTypeOther   PaymentType = "other"
)
