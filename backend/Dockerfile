# Use the official Golang image as the base
FROM golang:1.24-alpine AS builder

# Set environment variables
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Set working directory inside the container
WORKDIR /build

# Copy go.mod and go.sum files for dependency installation
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the entire application source
COPY . .

# Build the Go binary
RUN go build -o /app cmd/main.go

# Final lightweight stage
FROM alpine:3.21 AS final

# Install netcat for database health check and ca-certificates for HTTPS
RUN apk add --no-cache netcat-openbsd ca-certificates

# Copy the compiled binary from the builder stage
COPY --from=builder /app /bin/app

# Copy migration files
COPY --from=builder /build/db/migrations /app/db/migrations

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the application's port
EXPOSE 8080

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]