package main

import (
	"caytoo/engine/internal/processor"
	"context"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

// Configuration constants (consider moving to a config file or env variables for production)
const (
	redisAddr     = "localhost:6379" // Your Redis server address
	redisPassword = ""               // Your Redis password, if any
	redisDB       = 0                // Default Redis DB
	queueName     = "google_alert_links" // The name of the Redis list to use as a queue
	processingTime = 2 * time.Second    // Simulate some work
)

var ctx = context.Background()

func main() {
	log.Println("Starting Go engine...")

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

	// Main loop to listen for messages from the Redis queue
	for {
		// Blocking Pop from the right of the list (BRPOP)
		// Waits until an element is available in the list, or timeout occurs
		// A timeout of 0 means wait indefinitely
		result, err := rdb.BLPop(ctx, 0*time.Second, queueName).Result()
		if err != nil {
			// Handle potential errors, e.g., Redis connection lost
			log.Printf("Error receiving message from Redis queue %s: %v\n", queueName, err)
			// Implement backoff strategy or attempt to reconnect
			time.Sleep(5 * time.Second) // Wait before retrying
			continue
		}

		// result is a slice: [queueName, messageValue]
		if len(result) == 2 {
			message := result[1]
			log.Printf("Received message: %s\n", message)

			// --- YOUR MESSAGE PROCESSING LOGIC GOES HERE ---
			// Example: Call your AI filtering, database operations, etc.
			log.Printf("Processing message: %s...\n", message)
			// time.Sleep(processingTime) // Simulate work
			processor.AnalyzeArticleAsLead(message) // Call your processing function

			log.Printf("Finished processing message: %s\n", message)
			// --- END OF YOUR MESSAGE PROCESSING LOGIC ---

		} else {
			// This case should ideally not happen with BLPop if there's a message
			log.Printf("Received unexpected result from BLPop: %v\n", result)
		}
	}
}