package main

import (
	"caytoo/engine/internal/processor"
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/go-redis/redis/v8"
)

// Configuration constants (consider moving to a config file or env variables for production)
const (
	redisAddr      = "redis:6379"         // Your Redis server address
	redisPassword  = ""                   // Your Redis password, if any
	redisDB        = 0                    // Default Redis DB
	queueName      = "google_alert_links" // The name of the Redis list to use as a queue
	processingTime = 2 * time.Second      // Simulate some work
)

var processingJobs int32 // atomic counter to track processing tasks

func main() {
	log.Println("Starting Go engine...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle OS signals to allow graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigCh
		log.Printf("Received signal: %s, initiating shutdown...", sig)
		cancel()
	}()

	// Initialize Redis client
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPassword,
		DB:       redisDB,
	})

	// Ping Redis to check connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")
	log.Printf("Listening on queue: %s\n", queueName)

	// Buffered channel to avoid blocking on each message
	messageChan := make(chan string, 30)

	var wg sync.WaitGroup

	// Start 3 fetcher goroutines to read messages from Redis
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					log.Printf("[Fetcher %d] Shutting down", id)
					return
				default:
					result, err := rdb.BLPop(ctx, 0*time.Second, queueName).Result()
					if err != nil {
						if ctx.Err() != nil {
							log.Printf("[Fetcher %d] Context closed", id)
							return
						}
						log.Printf("[Fetcher %d] Error receiving message from Redis: %v\n", id, err)
						time.Sleep(5 * time.Second)
						continue
					}
					if len(result) == 2 {
						message := result[1]
						log.Printf("[Fetcher %d] Received message: %s\n", id, message)
						messageChan <- message // send to channel
					}
				}
			}
		}(i)
	}

	// Start 4 processor goroutines to handle messages
	for i := 0; i < 4; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					log.Printf("[Processor %d] Shutting down", id)
					return
				case msg := <-messageChan:
					atomic.AddInt32(&processingJobs, 1)

					log.Printf("[Processor %d] Processing message: %s...\n", id, msg)

					var payload struct {
						Category string `json:"category"`
						URL      string `json:"url"`
						Date     string `json:"date"`
					}

					err := json.Unmarshal([]byte(msg), &payload)
					if err != nil {
						log.Printf("[Processor %d] Failed to parse message JSON: %v\n", id, err)
						atomic.AddInt32(&processingJobs, -1)
						continue
					}

					processor.AnalyzeArticleAsLead(payload.URL, payload.Category, payload.Date)
					log.Printf("[Processor %d] Finished processing message.\n", id)
					atomic.AddInt32(&processingJobs, -1)
				}
			}
		}(i)
	}

	// Monitor job status and queue/channel state
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				log.Println("[Monitor] Shutting down")
				return
			case <-time.After(5 * time.Second):
				queueLength, err := rdb.LLen(ctx, queueName).Result()
				if err != nil {
					log.Printf("[Monitor] Error checking queue length: %v\n", err)
					continue
				}

				channelEmpty := len(messageChan) == 0
				activeJobs := atomic.LoadInt32(&processingJobs)

				if queueLength == 0 && channelEmpty && activeJobs == 0 {
					err := rdb.Set(ctx, "article_processing", "false", 0).Err()
					if err != nil {
						log.Printf("[Monitor] Error setting article_processing flag: %v\n", err)
					} else {
						log.Println("[Monitor] article_processing flag set to false.")
					}
				}
			}
		}
	}()

	wg.Wait()
	log.Println("Graceful shutdown complete.")
	if err := rdb.Close(); err != nil {
		log.Printf("Error closing Redis client: %v", err)
	} else {
		log.Println("Redis client closed successfully.")
	}
}
