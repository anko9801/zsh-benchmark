#!/bin/bash
# Measure zcomet download time by monitoring process hierarchy

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

echo "Monitoring process hierarchy for zsh PID: $ZSH_PID"

# Function to count child processes
count_child_processes() {
    local parent_pid=$1
    local count=0
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - use ps to find children
        count=$(ps -o pid,ppid,comm | awk -v ppid="$parent_pid" '$2 == ppid {print $1}' | wc -l)
        # Also count git processes system-wide
        local git_count=$(pgrep -f "git clone" 2>/dev/null | wc -l || echo 0)
        count=$((count + git_count))
    else
        # Linux - use /proc
        if [ -d "/proc/$parent_pid/task" ]; then
            for tid in /proc/$parent_pid/task/*/children; do
                if [ -r "$tid" ]; then
                    count=$((count + $(wc -w < "$tid")))
                fi
            done
        fi
    fi
    
    echo $count
}

# Function to check if any git processes are running
check_git_processes() {
    pgrep -f "git clone" >/dev/null 2>&1 || pgrep -f "git fetch" >/dev/null 2>&1
}

# Main monitoring loop
LAST_CHILD_COUNT=0
NO_CHANGE_COUNT=0
MAX_CHILD_COUNT=0

while true; do
    CURRENT_TIME=$(($(date +%s) - START_TIME))
    
    # Count child processes
    CHILD_COUNT=$(count_child_processes $ZSH_PID)
    
    # Track maximum child count
    if [ $CHILD_COUNT -gt $MAX_CHILD_COUNT ]; then
        MAX_CHILD_COUNT=$CHILD_COUNT
    fi
    
    # Check for git processes
    if check_git_processes; then
        GIT_STATUS="active"
        NO_CHANGE_COUNT=0
    else
        GIT_STATUS="none"
    fi
    
    # Debug output
    echo "Time: ${CURRENT_TIME}s | Children: $CHILD_COUNT | Git: $GIT_STATUS | Max children: $MAX_CHILD_COUNT"
    
    # Check for changes
    if [ $CHILD_COUNT -ne $LAST_CHILD_COUNT ]; then
        LAST_CHILD_COUNT=$CHILD_COUNT
        NO_CHANGE_COUNT=0
    else
        NO_CHANGE_COUNT=$((NO_CHANGE_COUNT + 1))
    fi
    
    # Exit conditions
    # If we had child processes but now have none for 5 seconds
    if [ $MAX_CHILD_COUNT -gt 0 ] && [ $CHILD_COUNT -eq 0 ] && [ $NO_CHANGE_COUNT -ge 5 ]; then
        echo "No child processes for 5 seconds, downloads complete"
        break
    fi
    
    # Also check if repos directory has content and no git activity
    if [ -d "$HOME/.zcomet/repos" ] && [ "$(ls -A "$HOME/.zcomet/repos" 2>/dev/null)" ] && [ "$GIT_STATUS" = "none" ] && [ $NO_CHANGE_COUNT -ge 5 ]; then
        echo "Repos exist and no git activity for 5 seconds"
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
if [ -d "$HOME/.zcomet/repos" ]; then
    FINAL_PLUGIN_COUNT=$(ls -1 "$HOME/.zcomet/repos" 2>/dev/null | wc -l)
fi

echo "Total time: ${TOTAL_TIME}s"
echo "Maximum child processes: $MAX_CHILD_COUNT"
echo "Total plugins downloaded: $FINAL_PLUGIN_COUNT"
exit 0