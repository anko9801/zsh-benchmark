#!/bin/bash
# Measure zcomet download time by monitoring network activity

set -e

# Start time
START_TIME=$(date +%s)

# Get initial network stats (bytes received)
get_network_bytes() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        netstat -ib | grep -E '^en[0-9]' | awk '{sum+=$7} END {print sum}'
    else
        # Linux
        cat /proc/net/dev | grep -E '^\s*(eth|en|wl)' | awk '{sum+=$2} END {print sum}'
    fi
}

INITIAL_BYTES=$(get_network_bytes)
echo "Initial network bytes: $INITIAL_BYTES"

# Start zsh in background
zsh -ic exit 2>/dev/null &
ZSH_PID=$!

# Wait for initial startup
sleep 2

# Track network activity
LAST_BYTES=$INITIAL_BYTES
LAST_ACTIVITY_TIME=$(($(date +%s) - START_TIME))
NO_ACTIVITY_COUNT=0
ACTIVITY_THRESHOLD=10000  # 10KB threshold for activity detection

echo "Monitoring network activity..."

while true; do
    CURRENT_TIME=$(($(date +%s) - START_TIME))
    CURRENT_BYTES=$(get_network_bytes)
    BYTES_DIFF=$((CURRENT_BYTES - LAST_BYTES))
    
    # Debug output
    echo "Time: ${CURRENT_TIME}s | Total bytes: $CURRENT_BYTES | Diff: ${BYTES_DIFF}B"
    
    # Check if there's significant network activity
    if [ $BYTES_DIFF -gt $ACTIVITY_THRESHOLD ]; then
        LAST_BYTES=$CURRENT_BYTES
        LAST_ACTIVITY_TIME=$CURRENT_TIME
        NO_ACTIVITY_COUNT=0
        echo "  Network activity detected: ${BYTES_DIFF} bytes"
    else
        NO_ACTIVITY_COUNT=$((NO_ACTIVITY_COUNT + 1))
    fi
    
    # Exit conditions
    # Wait for at least 5 seconds of no significant network activity
    if [ $NO_ACTIVITY_COUNT -ge 5 ] && [ $LAST_ACTIVITY_TIME -gt 0 ]; then
        echo "No network activity for 5 seconds, downloads complete"
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
TOTAL_BYTES=$((CURRENT_BYTES - INITIAL_BYTES))

echo "Total time: ${TOTAL_TIME}s"
echo "Total downloaded: ${TOTAL_BYTES} bytes (~$((TOTAL_BYTES / 1024 / 1024))MB)"
exit 0