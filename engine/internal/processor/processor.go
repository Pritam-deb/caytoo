package processor

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"google.golang.org/genai"
)

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func TextToClean(message string) {
	// api key is in env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or couldn't load it.")
	}
    ctx := context.Background()

    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey: getEnv("GEMINI_API_KEY", ""), // Set your Google API key here
        Backend: genai.BackendGeminiAPI,
    })
    if err != nil {
        log.Fatal(err)
    }
	prompt := fmt.Sprintf("Get rid of all HTML tags from the following text and return only the plain text content. Text: %s", message)
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.0-flash",
        genai.Text(prompt),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
	SaveCleanText(result.Text())
}

func SaveCleanText(cleanedText string) {
	filename := "cleaned_text.json"
	data := map[string]string{
		"result": cleanedText,
	}

	jsonBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return
	}

	// Write to file (create if not exists, overwrite if exists)
	err = os.WriteFile(filename, jsonBytes, 0644)
	if err != nil {
		fmt.Printf("Error writing to file: %v\n", err)
		return
	}

	fmt.Println("Saved result to cleaned_text.json")

}