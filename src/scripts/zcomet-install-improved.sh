#!/bin/bash
# Improved zcomet installation measurement with detailed logging

# Enable debug output if ZCOMET_DEBUG is set
[ -n "$ZCOMET_DEBUG" ] && set -x

# Start zsh in background
zsh -ic exit 2>/dev/null &
ZSH_PID=$!

# Initial wait for zcomet to start downloading
sleep 3

# Initialize counters
LAST_FILE_COUNT=0
LAST_CHANGE_TIME=0
NO_CHANGE_COUNT=0
ITERATION=0

# Log function
log() {
    [ -n "$ZCOMET_DEBUG" ] && echo "[zcomet-measure] $1" >&2
}

log "Started monitoring zcomet downloads"

# Main monitoring loop
for i in {1..300}; do
    # Count files in repos directory
    if [ -d ~/.zcomet/repos ]; then
        FILE_COUNT=$(find ~/.zcomet/repos -type f 2>/dev/null | wc -l)
    else
        FILE_COUNT=0
    fi
    
    # Check for changes
    if [ $FILE_COUNT -ne $LAST_FILE_COUNT ]; then
        log "Iteration $i: File count changed from $LAST_FILE_COUNT to $FILE_COUNT"
        LAST_FILE_COUNT=$FILE_COUNT
        LAST_CHANGE_TIME=$i
        NO_CHANGE_COUNT=0
    else
        NO_CHANGE_COUNT=$((NO_CHANGE_COUNT + 1))
    fi
    
    # Log progress every 10 iterations
    if [ $((i % 10)) -eq 0 ]; then
        log "Iteration $i: Files=$FILE_COUNT, No change for ${NO_CHANGE_COUNT}s"
    fi
    
    # Exit conditions
    if [ $LAST_CHANGE_TIME -gt 0 ] && [ $NO_CHANGE_COUNT -ge 5 ]; then
        log "No changes for 5 seconds after downloads started, assuming complete"
        break
    fi
    
    # Also check for completion markers
    if [ $FILE_COUNT -gt 0 ] && [ -d ~/.zcomet/repos ]; then
        # Check if all repos have .git/HEAD (indicating complete clone)
        REPO_COUNT=$(ls -1d ~/.zcomet/repos/*/ 2>/dev/null | wc -l)
        COMPLETE_COUNT=$(find ~/.zcomet/repos -name HEAD -path "*/.git/HEAD" 2>/dev/null | wc -l)
        
        if [ $REPO_COUNT -gt 0 ] && [ $REPO_COUNT -eq $COMPLETE_COUNT ] && [ $NO_CHANGE_COUNT -ge 3 ]; then
            log "All $REPO_COUNT repositories have complete .git directories"
            break
        fi
    fi
    
    sleep 1
done

# Clean up
kill $ZSH_PID 2>/dev/null || true

log "Monitoring complete after $i seconds"