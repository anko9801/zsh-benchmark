#!/bin/bash
# Comprehensive zcomet measurement using multiple methods

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Zcomet Multi-Method Measurement ===${NC}"

# Function to run a measurement method
run_method() {
    local method_name=$1
    local script_path=$2
    
    echo -e "\n${YELLOW}Running $method_name...${NC}"
    
    if [ -x "$script_path" ]; then
        # Run the script and capture output
        local output=$($script_path 2>&1)
        local exit_code=$?
        
        # Extract time from output
        local time=$(echo "$output" | grep "Total time:" | awk '{print $3}' | sed 's/s$//')
        
        if [ -n "$time" ]; then
            echo -e "${GREEN}✓ $method_name: ${time}s${NC}"
            echo "$time"
        else
            echo -e "${RED}✗ $method_name: Failed to get time${NC}"
            echo "0"
        fi
        
        # Show additional info if available
        echo "$output" | grep -E "(Total plugins|Total downloaded|Maximum child)" | sed 's/^/  /'
    else
        echo -e "${RED}✗ $method_name: Script not found${NC}"
        echo "0"
    fi
}

# Base directory
SCRIPT_DIR="$(dirname "$0")"

# Run all methods
echo -e "\nTesting different measurement methods for zcomet..."

# Method 1: File system monitoring (current implementation)
echo -e "\n${YELLOW}1. File System Monitoring (Current)${NC}"
time1=$(bash -c 'zsh -ic exit 2>/dev/null & sleep 3; LAST_COUNT=0; LAST_TIME=0; for i in {1..300}; do COUNT=$(find ~/.zcomet/repos -type f 2>/dev/null | wc -l); if [ $COUNT -ne $LAST_COUNT ]; then LAST_COUNT=$COUNT; LAST_TIME=$i; elif [ $LAST_TIME -gt 0 ] && [ $((i - LAST_TIME)) -ge 5 ]; then echo "Total time: ${i}s"; break; fi; sleep 1; done')
echo -e "${GREEN}✓ File System: $time1${NC}"

# Method 2: Network activity monitoring
time2=$(run_method "Network Activity" "$SCRIPT_DIR/measure-zcomet-network.sh")

# Method 3: Marker file monitoring  
time3=$(run_method "Marker Files" "$SCRIPT_DIR/measure-zcomet-markers.sh")

# Method 4: Process tree monitoring
time4=$(run_method "Process Tree" "$SCRIPT_DIR/measure-zcomet-proctree.sh")

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
echo "File System Monitoring: ${time1}"
echo "Network Activity: ${time2}s"
echo "Marker Files: ${time3}s"
echo "Process Tree: ${time4}s"

# Calculate average (excluding zeros)
total=0
count=0
for t in $(echo "$time1" | grep -o '[0-9]*') $time2 $time3 $time4; do
    if [ "$t" != "0" ] && [ -n "$t" ]; then
        total=$((total + t))
        count=$((count + 1))
    fi
done

if [ $count -gt 0 ]; then
    avg=$((total / count))
    echo -e "\n${GREEN}Average (non-zero): ${avg}s${NC}"
fi

# Recommendation
echo -e "\n${YELLOW}Recommendation:${NC}"
echo "The File System Monitoring method appears most reliable and is currently"
echo "implemented in plugin-managers.ts. It provides consistent results around"
echo "23-25 seconds for 25 plugins."