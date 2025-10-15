package v1

import (
	"io"
	"log"
	"time"

	sumupmodels "metalab/metadrinks/models/sumup"

	"github.com/gin-gonic/gin"
)

type Event struct {
	Message           chan string
	NewClients        chan chan string
	ClosedClients     chan chan string
	TotalClients      map[chan string]bool
	HeartbeatInterval time.Duration
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
	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case client := <-Stream.NewClients:
			Stream.TotalClients[client] = true
			log.Printf("Client added. %d registered clients", len(Stream.TotalClients))

		case client := <-Stream.ClosedClients:
			if _, ok := Stream.TotalClients[client]; ok {
				delete(Stream.TotalClients, client)
				close(client)
				log.Printf("Removed client. %d registered clients", len(Stream.TotalClients))
			}

		case eventMsg := <-Stream.Message:
			for clientMessageChan := range Stream.TotalClients {
				select {
				case clientMessageChan <- eventMsg:
				default:
					log.Printf("Client channel blocked, removing")
					delete(Stream.TotalClients, clientMessageChan)
					close(clientMessageChan)
				}
			}

		case <-heartbeat.C:
			if len(Stream.TotalClients) == 0 {
				continue
			}

			log.Printf("Sending heartbeat to %d clients", len(Stream.TotalClients))
			var disconnectedClients []chan string

			for clientMessageChan := range Stream.TotalClients {
				select {
				case clientMessageChan <- `{"type":"heartbeat","data":{"timestamp":"` + time.Now().Format(time.RFC3339) + `"}}`:
				default:
					log.Printf("Client not responding to heartbeat, marking for removal")
					disconnectedClients = append(disconnectedClients, clientMessageChan)
				}
			}

			for _, client := range disconnectedClients {
				delete(Stream.TotalClients, client)
				close(client)
			}

			if len(disconnectedClients) > 0 {
				log.Printf("Removed %d disconnected clients. %d clients remaining", len(disconnectedClients), len(Stream.TotalClients))
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
		// buffered channel to prevent blocking
		clientChan := make(ClientChan, 10)
		Stream.NewClients <- clientChan

		c.SSEvent("onopen", gin.H{
			"type": "connection_established",
			"data": gin.H{
				"status":    "connected",
				"timestamp": time.Now().Unix(),
			},
		})
		c.Writer.Flush()

		defer func() {
			Stream.ClosedClients <- clientChan
		}()

		// Monitor for client disconnect
		notify := c.Writer.CloseNotify()
		go func() {
			<-notify
			log.Printf("Client disconnected (CloseNotify)")
			Stream.ClosedClients <- clientChan
		}()

		c.Stream(func(w io.Writer) bool {
			select {
			case msg, ok := <-clientChan:
				if !ok {
					log.Printf("Client channel closed")
					return false
				}
				c.SSEvent("message", msg)
				return true
			case <-notify:
				log.Printf("Client disconnected during stream")
				return false
			}
		})
	}
}
