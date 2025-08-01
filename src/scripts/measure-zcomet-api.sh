#!/bin/bash
# Measure zcomet download time using zcomet's internal commands/API

set -e

# Start time
START_TIME=$(date +%s)

# Clean any existing zcomet cache
rm -rf ~/.zcomet/downloads ~/.zcomet/repos 2>/dev/null || true

echo "Starting zcomet with API monitoring..."

# Create a custom zshrc that tracks zcomet state
cat > /tmp/zcomet-test.zsh << 'EOF'
# Load zcomet
[[ -d $HOME/.zcomet/bin ]] && export PATH="$HOME/.zcomet/bin:$PATH"
source $HOME/.zcomet/zcomet.zsh

# Function to check if zcomet is still downloading
zcomet_is_downloading() {
    # Check if there are any background jobs
    local job_count=$(jobs -r 2>/dev/null | wc -l)
    
    # Check zcomet's internal state if available
    if (( $+functions[zcomet::utils::async_job_count] )); then
        # If zcomet exposes async job count
        local async_count=$(zcomet::utils::async_job_count 2>/dev/null || echo 0)
        echo "Async jobs: $async_count"
        [[ $async_count -gt 0 ]] && return 0
    fi
    
    # Check for git processes
    pgrep -f "git clone" >/dev/null 2>&1 && return 0
    
    # Check job count
    [[ $job_count -gt 0 ]] && return 0
    
    return 1
}

# Load plugins
source ~/.zshrc.zcomet

# Monitor download progress
echo "Monitoring zcomet downloads..."
DOWNLOAD_START=$(date +%s)

while zcomet_is_downloading; do
    CURRENT_TIME=$(($(date +%s) - DOWNLOAD_START))
    echo "Time: ${CURRENT_TIME}s - Downloads in progress..."
    
    # Try to get status from zcomet if available
    if (( $+functions[zcomet::status] )); then
        zcomet::status 2>/dev/null || true
    fi
    
    # Safety timeout
    if [[ $CURRENT_TIME -ge 300 ]]; then
        echo "Timeout after 5 minutes"
        break
    fi
    
    sleep 1
done

DOWNLOAD_END=$(date +%s)
TOTAL_TIME=$((DOWNLOAD_END - DOWNLOAD_START))

echo "Downloads complete!"
echo "Total time: ${TOTAL_TIME}s"

# Try to get final status
if (( $+functions[zcomet::list] )); then
    echo "Loaded plugins:"
    zcomet::list 2>/dev/null || true
fi

exit 0
EOF

# Run the test script
zsh /tmp/zcomet-test.zsh

# Clean up
rm -f /tmp/zcomet-test.zsh

END_TIME=$(date +%s)
SCRIPT_TIME=$((END_TIME - START_TIME))
echo "Script total time: ${SCRIPT_TIME}s"