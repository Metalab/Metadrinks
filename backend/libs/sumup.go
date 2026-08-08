package libs

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"metalab/metadrinks/models"
	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/sumup/sumup-go"
	"github.com/sumup/sumup-go/client"
)

var (
	SumupMerchant *sumup.Merchant
	SumupClient   *sumup.Client
)

func Login(apiKey string, merchantId string) {
	SumupClient = sumup.NewClient(client.WithAPIKey(apiKey))
	var settings models.Settings

	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		panic(err.Error())
	}

	merchant, err := SumupClient.Merchants.Get(context.Background(), merchantId, sumup.MerchantsGetParams{}) //this is why we need the merchant id. there is no way to check what merchant we currently are (i guess?)
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error getting merchant account: %s\n", err.Error())
		updatedSettings := models.Settings{MaintenanceMode: settings.MaintenanceMode, DefaultReaderId: settings.DefaultReaderId, MerchantInfo: nil}
		models.DB.Model(&settings).Updates(&updatedSettings)
		return
	}

	formattedDbString := fmt.Sprintf("%s (%s)", *merchant.Company.Name, merchant.MerchantCode)
	fmt.Printf("[INFO] SumUp API: Authorized for merchant %q (%s)\n", merchant.MerchantCode, *merchant.Company.Name)
	updatedSettings := models.Settings{MaintenanceMode: settings.MaintenanceMode, DefaultReaderId: settings.DefaultReaderId, MerchantInfo: &formattedDbString}
	models.DB.Model(&settings).Updates(&updatedSettings)
	SumupMerchant = merchant
}

func InitAPIReaders() {
	response, err := SumupClient.Readers.List(context.Background(), SumupMerchant.MerchantCode)
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error fetching readers: %s\n", err.Error())
		return
	}

	var rIds []string
	for _, v := range response.Items {
		rIds = append(rIds, string(v.ID))
	}

	// do not delete and only update existing readers that are still in api response,
	// delete the readers not in api response. add the new ones.
	var deletedReadersCount int64
	if len(rIds) > 0 {
		deletedReadersCount = models.DB.Where("reader_id NOT IN (?)", rIds).Delete(&sumupmodels.Reader{}).RowsAffected
	} else {
		// if no readers in api response, delete all readers
		deletedReadersCount = models.DB.Delete(&sumupmodels.Reader{}, "1=1").RowsAffected
	}
	if deletedReadersCount > 0 {
		fmt.Printf("[INFO] SumUp API: Deleted %d reader(s).\n", deletedReadersCount)
	}

	readersCount := 0
	for _, v := range response.Items {
		apiReader := sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(v.ID), Name: sumupmodels.ReaderName(v.Name), Status: sumupmodels.ReaderStatus(v.Status), Device: sumupmodels.ReaderDevice{Identifier: v.Device.Identifier, Model: sumupmodels.ReaderDeviceModel(v.Device.Model)}, CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt}
		models.DB.Where("reader_id = ?", v.ID).Save(&apiReader)
		readersCount++
	}

	fmt.Printf("[INFO] SumUp API: Initialized %d linked reader(s).\n", readersCount)
}

func StartReaderCheckout(ReaderId string, TotalAmount uint, Description *string) (ClientTransactionID string, Error error) {
	returnUrl := os.Getenv("SUMUP_RETURN_URL")
	response, checkoutErr := SumupClient.Readers.CreateCheckout(context.Background(), SumupMerchant.MerchantCode, ReaderId, sumup.ReadersCreateCheckoutParams{Description: Description, ReturnURL: &returnUrl, TotalAmount: sumup.CreateCheckoutRequestTotalAmount{Currency: "EUR", MinorUnit: 2, Value: int(TotalAmount)}})
	if checkoutErr != nil {
		return "error", checkoutErr
	}
	return response.Data.ClientTransactionID, nil
}

func InitiallyCheckIfReaderIsReady(ReaderId string) (Result *sumupmodels.Reader, Error error) {
	readerReady := false
	count := 5
	secondsBetween := 5
	for i := 0; i <= count; i++ {
		time.Sleep(time.Second * time.Duration(secondsBetween))
		reader, err := SumupClient.Readers.Get(context.Background(), SumupMerchant.MerchantCode, sumup.ReaderID(ReaderId), sumup.ReadersGetParams{})
		if err != nil {
			fmt.Printf("[ERROR] SumUp API: Error getting reader %s (Iteration %d/%d): %s\n", ReaderId, i, count, err.Error())
			continue
		}
		if reader.Status != sumup.ReaderStatusPaired {
			editedReader := sumupmodels.Reader{Status: sumupmodels.ReaderStatus(reader.Status)}
			models.DB.Where(&sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(ReaderId)}).Updates(editedReader)
			fmt.Printf("[INFO] SumUp API: Reader %s not ready (Iteration %d/%d)\n", ReaderId, i, count)
			continue
		}
		//fmt.Printf("[INFO] SumUp API: Reader %s returned ready\n", ReaderId)
		readerReady = true
		break
	}
	if readerReady {
		editedReader := sumupmodels.Reader{Status: sumupmodels.ReaderStatusPaired}
		models.DB.Where(&sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(ReaderId)}).Updates(editedReader)
		fmt.Printf("[INFO] SumUp API: Reader %s is ready\n", ReaderId)
		return &editedReader, nil
	}
	fmt.Printf("[ERROR] SumUp API: Reader %s not ready after waiting %d seconds\n", ReaderId, count*secondsBetween)
	return nil, fmt.Errorf("reader %s not ready after waiting %d seconds", ReaderId, count*secondsBetween)
}

func ValidateTransactionState(ClientTransactionId string, TransactionStatus sumup.TransactionFullStatus) (Error error) {
	transaction, err := SumupClient.Transactions.Get(context.Background(), SumupMerchant.MerchantCode, sumup.TransactionsGetParams{ClientTransactionID: &ClientTransactionId})
	if transaction != nil && err == nil {
		/*if transaction.Timestamp.Before(time.Now().Add(-24 * time.Hour)) {
			return false, fmt.Errorf("transaction %s is too old", ClientTransactionId)
		}*/
		if strings.EqualFold(string(*transaction.Status), string(TransactionStatus)) {
			return nil
		}
		return fmt.Errorf("transaction %s is not in %s state", ClientTransactionId, TransactionStatus)
	}
	return err
}

func CheckIfReaderIsReady(ReaderId string) (IsReady bool, Error error) {
	reader, err := SumupClient.Readers.Get(context.Background(), SumupMerchant.MerchantCode, sumup.ReaderID(ReaderId), sumup.ReadersGetParams{})
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error getting reader %s: %s\n", ReaderId, err.Error())
		return false, err
	}
	if reader.Status != sumup.ReaderStatusPaired {
		fmt.Printf("[INFO] SumUp API: Reader %s not ready\n", ReaderId)
		return false, fmt.Errorf("reader is not ready")
	}
	editedReader := sumupmodels.Reader{Status: sumupmodels.ReaderStatusPaired}
	models.DB.Where(&sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(ReaderId)}).Updates(editedReader)
	fmt.Printf("[INFO] SumUp API: Reader %s returned ready\n", ReaderId)
	return true, nil
}

// FormatSumUpError formats SumUp API errors with dereferenced pointer values for better readability
func FormatSumUpError(err error) string {
	// handle specific reader checkout errors
	var readerErr *sumup.CreateReaderCheckoutUnprocessableEntity
	if errors.As(err, &readerErr) {
		if len(readerErr.Errors) > 0 {
			for _, errDetail := range readerErr.Errors {
				if problemDetail, ok := errDetail.(*sumup.Problem); ok {
					detail := ""
					if problemDetail.Detail != nil {
						detail = *problemDetail.Detail
					}
					return fmt.Sprintf("%s", detail)
				}
				return fmt.Sprintf("%v", errDetail)
			}
		}
	}

	// handle generic sumup.Problem errors
	var problem *sumup.Problem
	if errors.As(err, &problem) {
		detail := "<nil>"
		if problem.Detail != nil {
			detail = *problem.Detail
		}
		status := 0
		if problem.Status != nil {
			status = *problem.Status
		}
		title := "<nil>"
		if problem.Title != nil {
			title = *problem.Title
		}
		return fmt.Sprintf("[Error %d] %s (%s)",
			status, title, detail)
	}

	return err.Error()
}
