package libs

import (
	"context"
	"fmt"
	"metalab/drinks-pos/models"
	sumup_models "metalab/drinks-pos/models/sumup"
	"os"
	"time"

	"github.com/sumup/sumup-go"
	"github.com/sumup/sumup-go/client"
	"github.com/sumup/sumup-go/merchant"
	"github.com/sumup/sumup-go/readers"
	"gorm.io/gorm"
)

var SumupAccount *merchant.MerchantAccount
var SumupClient *sumup.Client

func Login(apiKey string) {
	SumupClient = sumup.NewClient(client.WithAPIKey(apiKey))

	account, err := SumupClient.Merchant.Get(context.Background(), merchant.GetAccountParams{})
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error getting merchant account: %s\n", err.Error())
		return
	}

	fmt.Printf("[INFO] SumUp API: Authorized for merchant %q (%s)\n\n", *account.MerchantProfile.MerchantCode, *account.MerchantProfile.CompanyName)
	SumupAccount = account
}

func InitAPIReaders() {
	response, err := SumupClient.Readers.List(context.Background(), *SumupAccount.MerchantProfile.MerchantCode)
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error fetching readers: %s\n", err.Error())
		return
	}

	var readers []sumup_models.Reader
	models.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&readers)

	// lookup if readers are in db by reader id, create only non added ones.
	readers_count := 0
	for _, v := range response.Items {
		api_reader := sumup_models.Reader{ReaderId: sumup_models.ReaderId(v.Id), Name: sumup_models.ReaderName(v.Name), Status: sumup_models.ReaderStatus(v.Status), Device: sumup_models.ReaderDevice{Identifier: v.Device.Identifier, Model: sumup_models.ReaderDeviceModel(v.Device.Model)}, CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt}
		models.DB.Create(&api_reader)
		readers_count++
	}
	fmt.Printf("[INFO] SumUp API: Initialized %d reader(s).\n", readers_count)
}

func StartReaderCheckout(ReaderId string, TotalAmount uint, Description *string) (ClientTransactionId string, Error error) {
	var returnUrl string = os.Getenv("SUMUP_RETURN_URL")
	response, checkout_err := SumupClient.Readers.CreateCheckout(context.Background(), *SumupAccount.MerchantProfile.MerchantCode, ReaderId, readers.CreateReaderCheckoutBody{Description: Description, ReturnUrl: &returnUrl, TotalAmount: readers.CreateReaderCheckoutAmount{Currency: "EUR", MinorUnit: 2, Value: int(TotalAmount)}})
	if checkout_err != nil {
		return "error", fmt.Errorf("Error while creating reader checkout: %s", checkout_err.Error())
	}
	return *response.Data.ClientTransactionId, nil
}

func InitiallyCheckIfReaderIsReady(ReaderId string) (Result *sumup_models.Reader, Error error) {
	readerReady := false
	count := 5
	seconds_between := 5
	for i := 0; i <= count; i++ {
		time.Sleep(time.Second * time.Duration(seconds_between))
		//response, err := SumupClient.Readers.List(context.Background(), *SumupAccount.MerchantProfile.MerchantCode)
		reader, err := SumupClient.Readers.Get(context.Background(), *SumupAccount.MerchantProfile.MerchantCode, readers.ReaderId(ReaderId), readers.GetReaderParams{})
		if err != nil {
			fmt.Printf("[ERROR] SumUp API: Error getting reader %s (Iteration %d/%d): %s\n", ReaderId, i, count, err.Error())
			continue
		}
		if reader.Status != readers.ReaderStatusPaired {
			fmt.Printf("[INFO] SumUp API: Reader %s not ready (Iteration %d/%d)\n", ReaderId, i, count)
			continue
		}
		fmt.Printf("[INFO] SumUp API: Reader %s returned ready\n", ReaderId)
		readerReady = true
		break
	}
	if readerReady {
		edited_reader := sumup_models.Reader{Status: sumup_models.ReaderStatusPaired}
		models.DB.Where(&sumup_models.Reader{ReaderId: sumup_models.ReaderId(ReaderId)}).Updates(edited_reader)
		fmt.Printf("[INFO] SumUp API: Reader %s is ready\n", ReaderId)
		return &edited_reader, nil
	}
	fmt.Printf("[ERROR] SumUp API: Reader %s not ready after waiting %d seconds\n", ReaderId, count*seconds_between)
	return nil, fmt.Errorf("Reader %s not ready after waiting %d seconds", ReaderId, count*seconds_between)
}

func CheckIfReaderIsReady(ReaderId string) (IsReady bool, Error error) {
	reader, err := SumupClient.Readers.Get(context.Background(), *SumupAccount.MerchantProfile.MerchantCode, readers.ReaderId(ReaderId), readers.GetReaderParams{})
	if err != nil {
		fmt.Printf("[ERROR] SumUp API: Error getting reader %s: %s\n", ReaderId, err.Error())
		return false, err
	}
	if reader.Status != readers.ReaderStatusPaired {
		fmt.Printf("[INFO] SumUp API: Reader %s not ready\n", ReaderId)
		return false, fmt.Errorf("reader not ready yet")
	}
	edited_reader := sumup_models.Reader{Status: sumup_models.ReaderStatusPaired}
	models.DB.Where(&sumup_models.Reader{ReaderId: sumup_models.ReaderId(ReaderId)}).Updates(edited_reader)
	fmt.Printf("[INFO] SumUp API: Reader %s returned ready\n", ReaderId)
	return true, nil
}
