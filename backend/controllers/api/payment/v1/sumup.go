package v1

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"metalab/metadrinks/libs"
	"metalab/metadrinks/models"
	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/sumup/sumup-go/readers"

	"github.com/gin-gonic/gin"
)

// CreateReader godoc
//
//	@Summary		Create reader
//	@Description	Creates and links new reader
//	@Tags			sumup
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	sumupmodels.Reader
//	@Failure		400
//	@Failure		500
//
//	@Param			user	body	readers.CreateReaderBody	true	"Create reader"
//
//	@Router			/readers/link [post]
func CreateReader(c *gin.Context) {
	var input readers.CreateReaderBody
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if string(input.PairingCode) == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "missing pairing code"})
		return
	}

	reader, err := libs.SumupClient.Readers.Create(context.Background(), *libs.SumupAccount.MerchantProfile.MerchantCode, readers.CreateReaderBody{Name: input.Name, PairingCode: input.PairingCode})
	if err != nil {
		fmt.Printf("error while creating reader: %s\n", err.Error())
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	dbReader := sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(reader.Id), Name: sumupmodels.ReaderName(reader.Name), Status: sumupmodels.ReaderStatus(reader.Status), Device: sumupmodels.ReaderDevice{Identifier: reader.Device.Identifier, Model: sumupmodels.ReaderDeviceModel(reader.Device.Model)}, CreatedAt: reader.CreatedAt, UpdatedAt: reader.UpdatedAt}

	result, err := libs.InitiallyCheckIfReaderIsReady(string(reader.Id)) // polls the reader a few times to see if it is ready
	if err != nil {
		fmt.Printf("error while checking reader status: %s\n", err.Error())
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	} else {
		dbReader.Status = result.Status
		dbReader.UpdatedAt = result.UpdatedAt

		models.DB.Create(&dbReader)

		c.JSON(http.StatusOK, gin.H{"data": dbReader})
	}
}

// FindReaders godoc
//
//	@Summary		Find readers
//	@Description	Returns all readers
//	@Tags			sumup
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]sumupmodels.Reader
//	@Failure		500
//
//	@Router			/readers [get]
func FindReaders(c *gin.Context) {
	var r []sumupmodels.Reader
	err := models.DB.Find(&r).Error
	if err != nil {
		fmt.Printf("error finding readers: %s\n", err.Error())
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": r})
}

func FindApiReaders(c *gin.Context) {
	response, err := libs.SumupClient.Readers.List(context.Background(), *libs.SumupAccount.MerchantProfile.MerchantCode)
	if err != nil {
		fmt.Printf("error finding reader by name: %s\n", err.Error())
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// FindReader godoc
//
//	@Summary		Find reader
//	@Description	Returns specific reader
//	@Tags			sumup
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	sumupmodels.Reader
//	@Failure		500
//
//	@Param			id	path	string	true	"Reader UUID"
//
//	@Router			/readers/{id} [get]
func FindReader(c *gin.Context) {
	var reader sumupmodels.Reader

	if err := models.DB.Where("reader_id = ?", c.Param("id")).First(&reader).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reader})
}

func FindReaderByName(name string) (*sumupmodels.Reader, error) {
	var reader sumupmodels.Reader

	if err := models.DB.Where("name = ?", name).First(&reader).Error; err != nil {
		return nil, err
	}

	return &reader, nil
}

func DeleteReaderById(id string) error {
	var reader sumupmodels.Reader

	if err := models.DB.Where("reader_id = ?", id).Delete(&reader).Error; err != nil {
		return err
	}
	return nil
}

func DeleteReaderByName(name string) error {
	var reader sumupmodels.Reader

	if err := models.DB.Where("name = ?", name).Delete(&reader).Error; err != nil {
		return err
	}
	return nil
}

type TerminateReaderInput struct {
	ReaderId   string `json:"id"`
	ReaderName string `json:"name"`
}

// TerminateReaderCheckout godoc
//
//	@Summary		Terminate reader checkout
//	@Description	Stops the running reader checkout
//	@Tags			sumup
//	@Accept			json
//	@Produce		json
//	@Success		200
//	@Failure		500
//
//	@Param			reader	body	TerminateReaderInput	true	"Terminate reader input"
//
//	@Router			/readers/terminate [delete]
func TerminateReaderCheckout(c *gin.Context) {
	var input TerminateReaderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.ReaderId == "" && input.ReaderName == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "reader id/name missing"})
		return
	} else if input.ReaderId == "" && input.ReaderName != "" { // name defined, id undefined
		var dbReader *sumupmodels.Reader
		var findErr error
		dbReader, findErr = FindReaderByName(input.ReaderName)
		if findErr != nil {
			fmt.Printf("error finding reader by name: %s\n", findErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": findErr.Error()})
			return
		}

		terminateErr := libs.SumupClient.Readers.TerminateCheckout(context.Background(), *libs.SumupAccount.MerchantProfile.MerchantCode, string(dbReader.ReaderId)) // uses reader id from db, retrieved from name
		if terminateErr != nil {
			fmt.Printf("error while terminating checkout by name: %s\n", terminateErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": terminateErr.Error()})
			return
		}
	} else if input.ReaderId != "" && input.ReaderName == "" { // name undefined, id defined
		terminateErr := libs.SumupClient.Readers.TerminateCheckout(context.Background(), *libs.SumupAccount.MerchantProfile.MerchantCode, input.ReaderId) // uses reader id from input
		if terminateErr != nil {
			fmt.Printf("error while terminating checkout by id: %s\n", terminateErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": terminateErr.Error()})
			return
		}
	} else {
		fmt.Printf("unknown error while terminating checkout\n")
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "unknown error while terminating checkout"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": "success"})
}

type UnlinkReaderInput struct {
	ReaderId   string `json:"id"`
	ReaderName string `json:"name"`
}

// UnlinkReader godoc
//
//	@Summary		Unlink reader
//	@Description	Unlinks the specified reader
//	@Tags			sumup
//	@Accept			json
//	@Produce		json
//	@Success		200
//	@Failure		500
//
//	@Param			reader	body	UnlinkReaderInput	true	"Unlink reader input"
//
//	@Router			/readers/unlink [delete]
func UnlinkReader(c *gin.Context) {
	var input UnlinkReaderInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.ReaderId == "" && input.ReaderName == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "reader id/name missing"})
		return
	} else if input.ReaderId == "" && input.ReaderName != "" { // name defined
		var dbReader *sumupmodels.Reader
		var findErr error
		dbReader, findErr = FindReaderByName(input.ReaderName)
		if findErr != nil {
			fmt.Printf("error finding reader by name: %s\n", findErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": findErr.Error()})
			return
		}

		unlinkErr := libs.SumupClient.Readers.DeleteReader(context.Background(), *libs.SumupAccount.MerchantProfile.MerchantCode, readers.ReaderId(dbReader.ReaderId))
		if unlinkErr != nil {
			fmt.Printf("error while unlinking reader by name: %s\n", unlinkErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": unlinkErr.Error()})
			return
		}
		if deleteErr := DeleteReaderByName(input.ReaderName); deleteErr != nil {
			fmt.Printf("error while deleting reader by name: %s\n", deleteErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": deleteErr.Error()})
			return
		}
	} else if input.ReaderId != "" && input.ReaderName == "" { // name undefined
		unlinkErr := libs.SumupClient.Readers.DeleteReader(context.Background(), *libs.SumupAccount.MerchantProfile.MerchantCode, readers.ReaderId(input.ReaderId))
		if unlinkErr != nil {
			fmt.Printf("error while unlinking reader by id: %s\n", unlinkErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": unlinkErr.Error()})
			return
		}

		if deleteErr := DeleteReaderById(input.ReaderId); deleteErr != nil {
			fmt.Printf("error while deleting reader by id: %s\n", deleteErr.Error())
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": deleteErr.Error()})
			return
		}
	} else {
		fmt.Printf("unknown error while unlinking reader\n")
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "unknown error while unlinking reader"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "success"})
}

// GetIncomingWebhook godoc
//
//	@Summary		Get incoming webhook
//	@Description	Processes the incoming sumup webhook
//	@Tags			sumup
//	@Accept			json
//	@Produce		json
//	@Success		200
//	@Failure		500
//
//	@Param			webhook	body	sumupmodels.ReaderCheckoutStatusChange	true	"Webhook data"
//
//	@Router			/callback [post]
func GetIncomingWebhook(c *gin.Context) {
	// After receiving a webhook call, your application must always verify if the event really took place, by calling a relevant SumUp's API.
	var input sumupmodels.ReaderCheckoutStatusChange
	if err := c.ShouldBindJSON(&input); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	insertData := models.Purchase{TransactionStatus: input.Payload.Status}
	fmt.Printf("incoming sumup webhook: %v", input.Payload)

	models.DB.Where("client_transaction_id = ?", input.Payload.ClientTransactionId).Updates(insertData)

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
