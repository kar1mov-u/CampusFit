#!/bin/sh
set -e

echo "Running database migrations..."

# Install migrate tool
wget -q https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz
tar -xzf migrate.linux-amd64.tar.gz
mv migrate /usr/local/bin/migrate
chmod +x /usr/local/bin/migrate
rm migrate.linux-amd64.tar.gz

# Wait for database to be ready
echo "Waiting for database..."
until nc -z ${DB_HOST} ${DB_PORT}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is up!"

# Run migrations
DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
migrate -path /app/db/migrations -database "${DATABASE_URL}" up

echo "Migrations completed successfully!"

# Start the application
exec /bin/app
