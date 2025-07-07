package v1

import (
	"encoding/json"
	"fmt"
	"metalab/drinks-pos/models"
	sumupmodels "metalab/drinks-pos/models/sumup"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetIncomingWebhook(c *gin.Context) {
	//After receiving a webhook call, your application must always verify if the event really took place, by calling a relevant SumUp's API.
	var input sumupmodels.ReaderCheckoutStatusChange
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	insertData := models.Purchase{TransactionStatus: input.Payload.Status}
	fmt.Printf("incoming sumup webhook: %v", input.Payload)

	models.DB.Where("client_transaction_id = ?", input.Payload.ClientTransactionId).Updates(insertData)

	//notification := TransactionNotification{ClientTransactionId: input.Payload.ClientTransactionId, TransactionStatus: input.Payload.Status}

	notification := SSENotification{
		NotificationType: SSENotificationType(SSENotificationTransactionUpdate),
		NotificationData: SSENotificationPayload{
			TransactionPayload: &SSENotificationTransactionUpdatePayload{
				ClientTransactionId: input.Payload.TransactionId,
				TransactionStatus:   input.Payload.Status,
			},
		},
	}

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		fmt.Printf("error marshalling notification: %s\n", err.Error())
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to process notification"})
		return
	}

	Stream.SendMessage(string(notificationJSON))
	c.JSON(http.StatusOK, gin.H{"data": "success"})
}
