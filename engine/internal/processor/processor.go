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

var primed bool = false

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func AnalyzeArticleAsLead(link string) {
	// api key is in env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or couldn't load it.")
	}
	ctx := context.Background()

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  getEnv("GEMINI_API_KEY", ""),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}
	
	var primmingprompt string
	var prompt string
	if !primed {
		primmingprompt = fmt.Sprintf(`You are a sponsorship opportunity analyst. Your job is to access the URL and read any article and identify whether it contains buying signals indicating that the company mentioned may be a good fit to approach for a sports or esports sponsorship opportunity.

Review the article carefully. If any of the following signals are present, mark it as a potential lead and explain which signals were detected. Otherwise, mark it as not relevant.

Buying Signal Categories:

Market Expansion
- Entering or expanding into new regions or countries
- Opening new offices or regional HQs
- Setting up local operations or supply chains

Marketing & Brand Investment
- Launching brand campaigns (TV, digital, social, or 360°)
- Announcing rebrands or visual identity refresh
- Increasing ad spend or appointing new ad agencies

New Leadership in Marketing or Branding
- Hiring or promoting:
  - CMO (Chief Marketing Officer)
  - Brand Manager
  - Head of Marketing or Communications
  - VP/Director of Consumer Marketing or Global Growth

Funding or M&A Activity
- Closed a funding round (Seed to Series E or IPO)
- Undergoing mergers, acquisitions, or spin-offs
- Mention of budget allocated to brand or marketing growth

Partnerships & Sponsorships
- Announcing a brand ambassador (celebrity or athlete)
- Partnering with other brands or entertainment properties
- Engaging in product collaborations or co-branded campaigns
- Sponsorship of events, teams, music, esports, etc.

Youth, Culture, or Fan Engagement Focus
- Mention of Gen Z, youth marketing, or fan-centric campaigns
- Launch of experiential events, metaverse activations, gaming tie-ins
- Launching loyalty programs or fan platforms

Instructions for Output:

Return a classification:
Lead: Yes or Lead: No

If yes, specify which signal(s) were detected (from the above categories).
Provide a brief explanation (1–2 sentences) of why this article is relevant.
Optionally, extract the company name, region of activity, and industry if mentioned.

Industries I wish to work with:
Forex trading - Online Trading
Betting and Gambling
Airlines
Automobiles
Electric Vehicles
Banks
Cryptocurrency
Telecommunication
Manufacturing
PVC Pipe Manufacturers
Paints & Lubricants
Solar Panel Manufacturers
Beverages
Luxury Goods
Travel and Tourism
Education and Online Learning
Insurance Companies

You mark other industries as not valid.

Example Output:
Lead: Yes
Industry: FMCG`)
	}
	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(primmingprompt, genai.RoleUser),
	}

	
	prompt = fmt.Sprintf(`Here is the Link to article: %s`, link)

	countResp, err := client.Models.CountTokens(
		ctx,
		"gemini-2.5-flash-preview-05-20",
		genai.Text(prompt),
		nil, // No system instruction for token count
	)
	if err != nil {
		log.Printf("Token count error: %v\n", err)
	} else {
		log.Printf("Total tokens in prompt: %d\n", countResp.TotalTokens)
	}
	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash-preview-05-20",
		genai.Text(prompt),
		config,
	)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Received result: %s\n", result.Text())
	SaveCleanText(result.Text())
}

func SaveCleanText(cleanedText string) {
	filename := "lead_analysis_results.json"

	// Load existing entries if file exists
	var entries []map[string]string
	if _, err := os.Stat(filename); err == nil {
		existing, err := os.ReadFile(filename)
		if err == nil {
			_ = json.Unmarshal(existing, &entries)
		}
	}

	// Append new entry
	entry := map[string]string{
		"result": cleanedText,
	}
	entries = append(entries, entry)

	// Save back to file
	jsonBytes, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return
	}

	err = os.WriteFile(filename, jsonBytes, 0644)
	if err != nil {
		fmt.Printf("Error writing to file: %v\n", err)
		return
	}

	fmt.Println("Saved result to lead_analysis_results.json")
}