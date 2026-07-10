#!/bin/bash
# Build script for Render deployment

echo "Starting backend build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations if alembic is configured
echo "Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head || echo "Alembic migration failed or not configured, using create_all"
fi

echo "Backend build completed successfully!"