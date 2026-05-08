package models

import (
	"time"

	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/google/uuid"
)

type Purchase struct {
	PurchaseId          uuid.UUID                         `json:"id" gorm:"primaryKey;unique;type:uuid;default:gen_random_uuid()"`
	Items               []PurchaseItem                    `json:"items,omitempty" gorm:"type:jsonb;serializer:json"`
	PaymentType         PaymentType                       `json:"payment_type"`
	TransactionStatus   sumupmodels.TransactionFullStatus `json:"status"`
	ClientTransactionId string                            `json:"client_transaction_id,omitempty"`
	FinalCost           uint                              `json:"final_cost"`              // price the user pays
	RefundAmount        uint                              `json:"refund_amount,omitempty"` // adds balance to the user account
	Profit              int                               `json:"profit,omitempty"`        // profit from the purchase, can be negative
	CreatedAt           time.Time                         `json:"created_at"`
	CreatedBy           uuid.UUID                         `json:"created_by"` // uuid of user, otherwise null uuid (for guests)
}

type PurchaseItem struct {
	ItemId         uuid.UUID `json:"id"`
	ProductName    string    `json:"name"`
	ProductVariant string    `json:"variant"`
	Volume         uint      `json:"volume"`
	Price          uint      `json:"price"`
	PurchasePrice  uint      `json:"purchase_price,omitempty"`
	DepositPrice   uint      `json:"deposit_price,omitempty"`
	Amount         uint      `json:"amount"`
}

// PaymentType The type of the payment object gives information about the type of payment.
//
// Possible values:
//
// - `cash`: The payment was made with cash.
// - `unpaid`: The payment was made with a credit/debit card.
// - `balance`: The payment was made using the balance of the logged-in user.
type PaymentType string

const (
	PaymentTypeCash    PaymentType = "cash"
	PaymentTypeCard    PaymentType = "card"
	PaymentTypeBalance PaymentType = "balance"
)
