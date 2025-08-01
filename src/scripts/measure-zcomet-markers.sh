#!/bin/bash
# Measure zcomet download time by monitoring zcomet-specific files

set -e

# Start time
START_TIME=$(date +%s)

# Clean any existing zcomet cache
rm -rf ~/.zcomet/downloads ~/.zcomet/repos 2>/dev/null || true

# Start zsh in background
zsh -ic exit 2>/dev/null &
ZSH_PID=$!

# Wait for initial startup
sleep 2

# Monitor zcomet-specific files
ZCOMET_DIR="$HOME/.zcomet"
DOWNLOADS_DIR="$ZCOMET_DIR/downloads"
REPOS_DIR="$ZCOMET_DIR/repos"

echo "Monitoring zcomet-specific markers..."

# Function to check for completion markers
check_completion() {
    local plugin_count=0
    local complete_count=0
    
    # Check for .git directories in repos
    if [ -d "$REPOS_DIR" ]; then
        for repo in "$REPOS_DIR"/*; do
            if [ -d "$repo" ]; then
                plugin_count=$((plugin_count + 1))
                # Check if the repository has been fully cloned
                if [ -d "$repo/.git" ] && [ -f "$repo/.git/HEAD" ]; then
                    # Check if git index is not locked
                    if [ ! -f "$repo/.git/index.lock" ]; then
                        complete_count=$((complete_count + 1))
                    fi
                fi
            fi
        done
    fi
    
    echo "Plugins found: $plugin_count, Complete: $complete_count"
    
    # Return 0 if all plugins are complete
    if [ $plugin_count -gt 0 ] && [ $plugin_count -eq $complete_count ]; then
        return 0
    else
        return 1
    fi
}

# Main monitoring loop
LAST_CHECK_TIME=0
NO_CHANGE_COUNT=0

while true; do
    CURRENT_TIME=$(($(date +%s) - START_TIME))
    
    # Check completion status
    if check_completion; then
        # All plugins downloaded
        echo "All plugins downloaded successfully"
        break
    fi
    
    # Check for activity in the last second
    CURRENT_MTIME=0
    if [ -d "$REPOS_DIR" ]; then
        # Get the most recent modification time in repos directory
        CURRENT_MTIME=$(find "$REPOS_DIR" -type f -exec stat -f "%m" {} \; 2>/dev/null | sort -nr | head -1 || echo 0)
    fi
    
    if [ "$CURRENT_MTIME" != "$LAST_CHECK_TIME" ]; then
        LAST_CHECK_TIME=$CURRENT_MTIME
        NO_CHANGE_COUNT=0
    else
        NO_CHANGE_COUNT=$((NO_CHANGE_COUNT + 1))
    fi
    
    # Exit if no changes for 10 seconds and we have some plugins
    if [ $NO_CHANGE_COUNT -ge 10 ] && [ -d "$REPOS_DIR" ] && [ "$(ls -A "$REPOS_DIR" 2>/dev/null)" ]; then
        echo "No activity for 10 seconds, assuming downloads complete"
        break
    fi
    
    # Timeout
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

# Count final plugins
FINAL_PLUGIN_COUNT=0
if [ -d "$REPOS_DIR" ]; then
    FINAL_PLUGIN_COUNT=$(ls -1 "$REPOS_DIR" 2>/dev/null | wc -l)
fi

echo "Total time: ${TOTAL_TIME}s"
echo "Total plugins downloaded: $FINAL_PLUGIN_COUNT"
exit 0