#!/bin/bash
# Test script for interactive measurements

echo "Testing Interactive Benchmark Implementation"
echo "==========================================="

# Test measure-interactive.sh
echo -e "\n1. Testing measure-interactive.sh with vanilla:"
./src/measure-interactive.sh vanilla 0

# Test interactive-benchmark.ts
echo -e "\n2. Testing interactive-benchmark.ts with vanilla:"
deno run --allow-all ./src/interactive-benchmark.ts vanilla 0

# Test benchmark-cli with interactive flag
echo -e "\n3. Testing benchmark-cli with --interactive flag:"
deno run --allow-all ./src/benchmark-cli.ts benchmark --managers vanilla --counts 0 --interactive --runs 2 --warmup 1

echo -e "\nAll tests completed!"