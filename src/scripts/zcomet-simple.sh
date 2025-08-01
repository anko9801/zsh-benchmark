#!/bin/bash
# Simple and precise zcomet measurement

set -e

# Clean cache
rm -rf ~/.zcomet/repos ~/.zcomet/downloads 2>/dev/null || true

# Start zsh and wait for plugins to load
zsh -ic exit &
sleep 2

# Monitor until all git operations are complete
for i in {1..180}; do
    # Count .git directories (completed repositories)
    REPOS=$(find ~/.zcomet/repos -maxdepth 2 -name ".git" -type d 2>/dev/null | wc -l)
    
    # Count lock files (ongoing operations)
    LOCKS=$(find ~/.zcomet/repos -name "*.lock" 2>/dev/null | wc -l)
    
    # If we have repos and no locks, wait 2 more seconds to confirm
    if [ $REPOS -gt 0 ] && [ $LOCKS -eq 0 ]; then
        sleep 2
        LOCKS2=$(find ~/.zcomet/repos -name "*.lock" 2>/dev/null | wc -l)
        if [ $LOCKS2 -eq 0 ]; then
            echo "Complete after ${i}s - $REPOS repositories"
            break
        fi
    fi
    
    sleep 1
done

echo "Total time: ${i}s"