#!/bin/bash
# Simple interactive latency measurement script

MANAGER=$1
PLUGIN_COUNT=${2:-25}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Measuring interactive latencies for $MANAGER with $PLUGIN_COUNT plugins${NC}"

# Measure first prompt lag
echo -e "${GREEN}Measuring first prompt lag...${NC}"
START=$(date +%s%N)
docker run --rm zsh-benchmark bash -c "
  # Wait for prompt to appear
  (zsh -l -c 'exit' 2>&1 | head -1) &
  PID=\$!
  
  # Monitor for prompt character
  while kill -0 \$PID 2>/dev/null; do
    sleep 0.001
  done
"
END=$(date +%s%N)
FIRST_PROMPT_LAG=$((($END - $START) / 1000000))
echo "First prompt lag: ${FIRST_PROMPT_LAG}ms"

# Measure first command lag
echo -e "${GREEN}Measuring first command lag...${NC}"
START=$(date +%s%N)
echo 'echo BENCH_MARKER' | docker run --rm -i zsh-benchmark zsh -l 2>&1 | grep -m1 'BENCH_MARKER' > /dev/null
END=$(date +%s%N)
FIRST_COMMAND_LAG=$((($END - $START) / 1000000))
echo "First command lag: ${FIRST_COMMAND_LAG}ms"

# Measure command lag (using hyperfine as proxy)
echo -e "${GREEN}Measuring command lag...${NC}"
HYPERFINE_OUTPUT=$(docker run --rm zsh-benchmark hyperfine \
  --warmup 3 --runs 10 --export-json /tmp/cmd.json \
  'zsh -c "echo -n"' 2>/dev/null | grep 'Time' | awk '{print $3}')

if [ -n "$HYPERFINE_OUTPUT" ]; then
  # Extract milliseconds from output (e.g., "3.2 ms" -> "3.2")
  COMMAND_LAG=$(echo $HYPERFINE_OUTPUT | sed 's/[^0-9.]//g')
  echo "Command lag: ${COMMAND_LAG}ms"
else
  echo "Command lag: measurement failed"
fi

# Summary
echo -e "${BLUE}Summary:${NC}"
echo "  Manager: $MANAGER"
echo "  Plugin count: $PLUGIN_COUNT"
echo "  First prompt lag: ${FIRST_PROMPT_LAG}ms"
echo "  First command lag: ${FIRST_COMMAND_LAG}ms"
echo "  Command lag: ${COMMAND_LAG}ms"