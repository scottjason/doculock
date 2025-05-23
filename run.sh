#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status

echo "📸 Setting up the project..."

# Function to create a directory if it doesn't exist
mkdir_if_missing() {
  if [ ! -d "$1" ]; then
    mkdir -p "$1"
    echo "✅ Created directory: $1"
  else
    echo "ℹ️ Directory already exists: $1"
  fi
}

# Function to create a file if it doesn't exist
file_if_missing() {
  if [ ! -f "$1" ]; then
    touch "$1"
    echo "✅ Created file: $1"
  else
    echo "ℹ️ File already exists: $1"
  fi
}

# Create core directories
mkdir_if_missing "backend"
mkdir_if_missing "frontend"

# Create placeholder files
file_if_missing ".env"
file_if_missing ".gitignore"
file_if_missing "README.md"

echo "✅ Project scaffold complete!"
