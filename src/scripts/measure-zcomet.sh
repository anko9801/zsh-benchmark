#!/bin/bash
# Measure zcomet download time by monitoring multiple signals

set -e

# Start time
START_TIME=$(date +%s)

# Start zsh in background
zsh -ic exit 2>/dev/null &
ZSH_PID=$!

# Wait for initial startup
sleep 3

# Track completion using multiple methods
REPOS_DIR="$HOME/.zcomet/repos"
LAST_FILE_COUNT=0
LAST_CHANGE_TIME=$(($(date +%s) - START_TIME))
NO_CHANGE_COUNT=0

echo "Monitoring zcomet downloads..."

while true; do
    CURRENT_TIME=$(($(date +%s) - START_TIME))
    
    # Method 1: Check file count
    if [ -d "$REPOS_DIR" ]; then
        CURRENT_FILE_COUNT=$(find "$REPOS_DIR" -type f 2>/dev/null | wc -l)
    else
        CURRENT_FILE_COUNT=0
    fi
    
    # Method 2: Check git processes
    GIT_COUNT=$(pgrep -f "git clone" 2>/dev/null | wc -l)
    
    # Method 3: Check for .git directories
    if [ -d "$REPOS_DIR" ]; then
        GIT_DIRS=$(find "$REPOS_DIR" -name ".git" -type d 2>/dev/null | wc -l)
    else
        GIT_DIRS=0
    fi
    
    # Debug output
    echo "Time: ${CURRENT_TIME}s | Files: $CURRENT_FILE_COUNT | Git processes: $GIT_COUNT | Git dirs: $GIT_DIRS"
    
    # Check if there's activity
    if [ $CURRENT_FILE_COUNT -ne $LAST_FILE_COUNT ] || [ $GIT_COUNT -gt 0 ]; then
        LAST_FILE_COUNT=$CURRENT_FILE_COUNT
        LAST_CHANGE_TIME=$CURRENT_TIME
        NO_CHANGE_COUNT=0
    else
        NO_CHANGE_COUNT=$((NO_CHANGE_COUNT + 1))
    fi
    
    # Exit conditions
    if [ $NO_CHANGE_COUNT -ge 5 ] && [ $LAST_FILE_COUNT -gt 0 ]; then
        echo "No activity for 5 seconds, downloads complete"
        break
    fi
    
    if [ $CURRENT_TIME -ge 300 ]; then
        echo "Timeout after 5 minutes"
        break
    fi
    
    sleep 1
done

# Clean up
kill $ZSH_PID 2>/dev/null || true

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo "Total time: ${TOTAL_TIME}s"
exit 0