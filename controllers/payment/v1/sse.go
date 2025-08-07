package v1

import (
	"io"
	"log"

	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/gin-gonic/gin"
)

type Event struct {
	Message       chan string
	NewClients    chan chan string
	ClosedClients chan chan string
	TotalClients  map[chan string]bool
}

type ClientChan chan string

var Stream = NewServer()

func NewServer() *Event {
	event := &Event{
		Message:       make(chan string),
		NewClients:    make(chan chan string),
		ClosedClients: make(chan chan string),
		TotalClients:  make(map[chan string]bool),
	}

	go event.listen()
	return event
}

func (Stream *Event) listen() {
	for {
		select {
		case client := <-Stream.NewClients:
			Stream.TotalClients[client] = true
			log.Printf("Client added. %d registered clients", len(Stream.TotalClients))

		case client := <-Stream.ClosedClients:
			delete(Stream.TotalClients, client)
			close(client)
			log.Printf("Removed client. %d registered clients", len(Stream.TotalClients))

		case eventMsg := <-Stream.Message:
			for clientMessageChan := range Stream.TotalClients {
				select {
				case clientMessageChan <- eventMsg:
				default:
				}
			}
		}
	}
}

/*type SSENotification struct {
	ClientTransactionId string                             `json:"client_transaction_id"`
	TransactionStatus   sumup_models.TransactionFullStatus `json:"transaction_status"`
}*/

type SSENotification struct {
	NotificationType SSENotificationType    `json:"type"`
	NotificationData SSENotificationPayload `json:"data"`
}

type SSENotificationType string

const (
	SSENotificationContentUpdate     string = "content_update"
	SSENotificationTransactionUpdate string = "transaction_update"
)

type SSENotificationTransactionUpdatePayload struct {
	ClientTransactionId string                            `json:"client_transaction_id"`
	TransactionStatus   sumupmodels.TransactionFullStatus `json:"transaction_status"`
}

type SSENotificationPayload struct {
	TransactionPayload *SSENotificationTransactionUpdatePayload
}

func (Stream *Event) SendMessage(message string) {
	go func() {
		Stream.Message <- message
	}()
}

func SSEHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("Transfer-Encoding", "chunked")
		c.Next()
	}
}

func (Stream *Event) ServeHTTP() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientChan := make(ClientChan)
		Stream.NewClients <- clientChan

		go func() {
			<-c.Writer.CloseNotify()
			for range clientChan {
			}
			Stream.ClosedClients <- clientChan
		}()

		c.Stream(func(w io.Writer) bool {
			if msg, ok := <-clientChan; ok {
				c.SSEvent("message", msg)
				return true
			}
			return false
		})
	}
}
