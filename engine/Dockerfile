# engine/Dockerfile
FROM golang:1.24

WORKDIR /app
COPY . .


# RUN go mod tidy

CMD ["go", "run", "cmd/engine/main.go"]

# ============= old Dockerfile =============
# # Stage 1: Build
# FROM golang:1.24 AS builder
# WORKDIR /app

# # Cache dependencies
# COPY go.mod go.sum ./
# RUN go mod download

# # Copy source code
# COPY . .

# # Build the binary
# RUN go build -o engine cmd/engine/main.go

# # Stage 2: Run
# FROM debian:bullseye-slim
# WORKDIR /app

# # Copy binary from builder
# COPY --from=builder /app/engine .

# # Run the binary
# CMD ["./engine"]