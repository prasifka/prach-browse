#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Prach Browse functionality tests...${NC}"

# Create test directory
TEST_DIR="$(pwd)/test_results"
mkdir -p $TEST_DIR

# Function to run a test and log results
run_test() {
  local test_name=$1
  local test_command=$2
  local expected_exit_code=${3:-0}
  
  echo -e "\n${YELLOW}Running test: ${test_name}${NC}"
  echo "Command: $test_command"
  
  # Run the command and capture output
  OUTPUT_FILE="${TEST_DIR}/${test_name}.log"
  eval $test_command > $OUTPUT_FILE 2>&1
  EXIT_CODE=$?
  
  # Check if exit code matches expected
  if [ $EXIT_CODE -eq $expected_exit_code ]; then
    echo -e "${GREEN}✓ Test passed: ${test_name}${NC}"
  else
    echo -e "${RED}✗ Test failed: ${test_name} (Exit code: ${EXIT_CODE}, Expected: ${expected_exit_code})${NC}"
  fi
  
  echo "Output saved to: $OUTPUT_FILE"
  echo "----------------------------------------"
}

# Test 1: Check if Node.js is installed with correct version
run_test "node_version" "node -v"

# Test 2: Check if npm is installed with correct version
run_test "npm_version" "npm -v"

# Test 3: Install dependencies
run_test "npm_install" "npm install"

# Test 4: Check help text
run_test "help_text" "node src/index.js --help" 0

# Test 5: Start server with default settings (background)
run_test "server_start_default" "node src/index.js & echo $! > ${TEST_DIR}/server.pid; sleep 3"

# Test 6: Check if server is running
run_test "server_running" "curl -s http://localhost:3000 | grep -q 'Prach Browse'"

# Test 7: Test browsing functionality
run_test "browse_functionality" "curl -s 'http://localhost:3000/browse?url=https://example.com' | grep -q 'Example Domain'"

# Test 8: Test search functionality
run_test "search_functionality" "curl -s 'http://localhost:3000/search?q=test' | grep -q 'Search Results'"

# Test 9: Kill the server
run_test "server_kill" "kill \$(cat ${TEST_DIR}/server.pid)"

# Test 10: Start server with custom settings (background)
run_test "server_start_custom" "node src/index.js --port=3001 --disable-js --content-filter=medium & echo $! > ${TEST_DIR}/server_custom.pid; sleep 3"

# Test 11: Check if server is running on custom port
run_test "server_running_custom" "curl -s http://localhost:3001 | grep -q 'Prach Browse'"

# Test 12: Kill the custom server
run_test "server_kill_custom" "kill \$(cat ${TEST_DIR}/server_custom.pid)"

# Test 13: Check Docker build
run_test "docker_build" "docker build -t prach-browse ."

echo -e "\n${YELLOW}All tests completed. Check ${TEST_DIR} for detailed logs.${NC}"
