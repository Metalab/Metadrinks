package libs

import (
	"context"
	"fmt"
	"os"
	"time"

	"metalab/metadrinks/models"
	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/sumup/sumup-go"
	"github.com/sumup/sumup-go/client"
	"github.com/sumup/sumup-go/merchant"
	"github.com/sumup/sumup-go/readers"
)

var (
	SumupAccount *merchant.MerchantAccount
	SumupClient  *sumup.Client
)

func Login(apiKey string) {
	SumupClient = sumup.NewClient(client.WithAPIKey(apiKey))
	var settings models.Settings

	if err := models.DB.Where("id = ?", 1).First(&settings).Error; err != nil {
		panic(err.Error())
	}

	account, err := SumupClient.Merchant.Get(context.Background(), merchant.GetAccountParams{})
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error getting merchant account: %s\n", err.Error())
		updatedSettings := models.Settings{MaintenanceMode: settings.MaintenanceMode, DefaultReaderId: settings.DefaultReaderId, MerchantInfo: nil}
		models.DB.Model(&settings).Updates(&updatedSettings)
		return
	}

	formattedDbString := fmt.Sprintf("%s (%s)", *account.MerchantProfile.CompanyName, *account.MerchantProfile.MerchantCode)
	fmt.Printf("[INFO] SumUp API: Authorized for merchant %q (%s)\n\n", *account.MerchantProfile.MerchantCode, *account.MerchantProfile.CompanyName)
	updatedSettings := models.Settings{MaintenanceMode: settings.MaintenanceMode, DefaultReaderId: settings.DefaultReaderId, MerchantInfo: &formattedDbString}
	models.DB.Model(&settings).Updates(&updatedSettings)
	SumupAccount = account
}

func InitAPIReaders() {
	response, err := SumupClient.Readers.List(context.Background(), *SumupAccount.MerchantProfile.MerchantCode)
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error fetching readers: %s\n", err.Error())
		return
	}

	var r []sumupmodels.Reader

	var rIds []string
	for _, v := range response.Items {
		rIds = append(rIds, string(v.Id))
	}

	// do not delete and only update existing readers that are still in api response,
	// delete the readers not in api response. add the new ones.
	deletedReadersCount := models.DB.Not("reader_id IN (?)", rIds).Delete(&r).RowsAffected
	if deletedReadersCount > 0 {
		fmt.Printf("[INFO] SumUp API: Deleted %d reader(s).\n", deletedReadersCount)
	}

	readersCount := 0
	for _, v := range response.Items {
		apiReader := sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(v.Id), Name: sumupmodels.ReaderName(v.Name), Status: sumupmodels.ReaderStatus(v.Status), Device: sumupmodels.ReaderDevice{Identifier: v.Device.Identifier, Model: sumupmodels.ReaderDeviceModel(v.Device.Model)}, CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt}
		models.DB.Where("reader_id = ?", v.Id).Save(&apiReader)
		readersCount++
	}

	fmt.Printf("[INFO] SumUp API: Initialized %d linked reader(s).\n", readersCount)
}

func StartReaderCheckout(ReaderId string, TotalAmount uint, Description *string) (ClientTransactionId string, Error error) {
	returnUrl := os.Getenv("SUMUP_RETURN_URL")
	response, checkoutErr := SumupClient.Readers.CreateCheckout(context.Background(), *SumupAccount.MerchantProfile.MerchantCode, ReaderId, readers.CreateReaderCheckoutBody{Description: Description, ReturnUrl: &returnUrl, TotalAmount: readers.CreateReaderCheckoutAmount{Currency: "EUR", MinorUnit: 2, Value: int(TotalAmount)}})
	if checkoutErr != nil {
		return "error", fmt.Errorf(checkoutErr.Error())
	}
	return *response.Data.ClientTransactionId, nil
}

func InitiallyCheckIfReaderIsReady(ReaderId string) (Result *sumupmodels.Reader, Error error) {
	readerReady := false
	count := 5
	secondsBetween := 5
	for i := 0; i <= count; i++ {
		time.Sleep(time.Second * time.Duration(secondsBetween))
		// response, err := SumupClient.Readers.List(context.Background(), *SumupAccount.MerchantProfile.MerchantCode)
		reader, err := SumupClient.Readers.Get(context.Background(), *SumupAccount.MerchantProfile.MerchantCode, readers.ReaderId(ReaderId), readers.GetReaderParams{})
		if err != nil {
			fmt.Printf("[ERROR] SumUp API: Error getting reader %s (Iteration %d/%d): %s\n", ReaderId, i, count, err.Error())
			continue
		}
		if reader.Status != readers.ReaderStatusPaired {
			editedReader := sumupmodels.Reader{Status: sumupmodels.ReaderStatus(reader.Status)}
			models.DB.Where(&sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(ReaderId)}).Updates(editedReader)
			fmt.Printf("[INFO] SumUp API: Reader %s not ready (Iteration %d/%d)\n", ReaderId, i, count)
			continue
		}
		fmt.Printf("[INFO] SumUp API: Reader %s returned ready\n", ReaderId)
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

//goland:noinspection GoUnusedExportedFunction
func CheckIfReaderIsReady(ReaderId string) (IsReady bool, Error error) {
	reader, err := SumupClient.Readers.Get(context.Background(), *SumupAccount.MerchantProfile.MerchantCode, readers.ReaderId(ReaderId), readers.GetReaderParams{})
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error getting reader %s: %s\n", ReaderId, err.Error())
		return false, err
	}
	if reader.Status != readers.ReaderStatusPaired {
		fmt.Printf("[INFO] SumUp API: Reader %s not ready\n", ReaderId)
		return false, fmt.Errorf("reader is not ready")
	}
	editedReader := sumupmodels.Reader{Status: sumupmodels.ReaderStatusPaired}
	models.DB.Where(&sumupmodels.Reader{ReaderId: sumupmodels.ReaderId(ReaderId)}).Updates(editedReader)
	fmt.Printf("[INFO] SumUp API: Reader %s returned ready\n", ReaderId)
	return true, nil
}
