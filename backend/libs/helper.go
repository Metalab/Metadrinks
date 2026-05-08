package libs

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"metalab/metadrinks/models"
	sumupmodels "metalab/metadrinks/models/sumup"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetUserBalance(userId uuid.UUID) (*int, error) {
	var user models.User

	if err := models.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return nil, err
	}

	if *user.IsRestricted {
		return nil, fmt.Errorf("user is restricted")
	}

	return user.Balance, nil
}

func UpdateUserBalance(userId uuid.UUID, change int) {
	var user models.User
	changePtr := &change

	if err := models.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return
	}

	if *user.IsRestricted {
		return
	}

	balancePtr := *user.Balance + *changePtr
	user.Balance = &balancePtr
	models.DB.Save(&user)
}

// calculateEAN13Checksum calculates the check digit for an EAN-13 barcode
func calculateEAN13Checksum(barcode string) string {
	if len(barcode) != 12 {
		return ""
	}

	sum := 0
	for i, digit := range barcode {
		num := int(digit - '0')
		if i%2 == 0 {
			sum += num
		} else {
			sum += num * 3
		}
	}

	checkDigit := (10 - (sum % 10)) % 10
	return strconv.Itoa(checkDigit)
}

// isBarcodeUsed checks if a barcode has already been assigned to a user
func isBarcodeUsed(barcode string) bool {
	var count int64
	models.DB.Model(&models.User{}).Where("login_barcode = ?", barcode).Count(&count)
	return count > 0
}

// GenerateSecureEAN13 generates a secure random and unique EAN-13 barcode with prefix 040-049
func GenerateSecureEAN13() (string, error) {
	const maxAttempts = 100

	for attempt := 0; attempt < maxAttempts; attempt++ {
		prefixNum, err := rand.Int(rand.Reader, big.NewInt(10)) // 0-9
		if err != nil {
			return "", fmt.Errorf("failed to generate random prefix: %w", err)
		}
		prefix := fmt.Sprintf("04%d", prefixNum.Int64())

		randomDigits := make([]byte, 9)
		for i := 0; i < 9; i++ {
			num, err := rand.Int(rand.Reader, big.NewInt(10))
			if err != nil {
				return "", fmt.Errorf("failed to generate random digit: %w", err)
			}
			randomDigits[i] = byte('0' + num.Int64())
		}

		barcode12 := prefix + string(randomDigits)

		checkDigit := calculateEAN13Checksum(barcode12)
		ean13 := barcode12 + checkDigit

		if !isBarcodeUsed(ean13) {
			return ean13, nil
		}
	}

	return "", fmt.Errorf("failed to generate unique barcode after %d attempts", maxAttempts)
}

func SendSSEContentUpdateNotification(contentType string) error {
	notification := SSENotification{
		NotificationType: SSENotificationType(SSENotificationContentUpdate),
		NotificationData: SSENotificationPayload{
			ContentPayload: &SSENotificationContentUpdatePayload{
				Type: contentType,
			},
		},
	}

	return sendSSENotification(notification)
}

func SendSSETransactionUpdateNotification(clientTransactionId string, transactionStatus sumupmodels.TransactionFullStatus) error {
	notification := SSENotification{
		NotificationType: SSENotificationType(SSENotificationTransactionUpdate),
		NotificationData: SSENotificationPayload{
			TransactionPayload: &SSENotificationTransactionUpdatePayload{
				ClientTransactionId: clientTransactionId,
				TransactionStatus:   transactionStatus,
			},
		},
	}

	return sendSSENotification(notification)
}

func HandleSSENotificationError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}

	fmt.Printf("%s\n", err.Error())
	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to process notification"})
	return true
}

func sendSSENotification(notification SSENotification) error {
	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("error marshalling notification: %w", err)
	}

	Stream.SendMessage(string(notificationJSON))
	return nil
}
