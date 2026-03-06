#!/usr/bin/env -S deno run --allow-all

/**
 * Enhanced interactive zsh benchmark with improved stability
 * Implements retry logic and multiple measurement strategies
 */

import { BenchmarkResult } from "../types.ts";

interface InteractiveMetrics {
  firstPromptLag: number | null;
  firstCommandLag: number | null;
  commandLag: number | null;
  inputLag: number | null;
  confidence: number; // 0-1 confidence score
  method: 'pty' | 'expect' | 'simple' | 'docker-exec';
}

interface MeasurementOptions {
  retries: number;
  retryDelay: number; // ms
  timeout: number; // seconds
  warmup: boolean;
}

const DEFAULT_OPTIONS: MeasurementOptions = {
  retries: 3,
  retryDelay: 1000,
  timeout: 30,
  warmup: true,
};

/**
 * Enhanced PTY-based measurement using node-pty
 */
async function measureWithPTY(
  manager: string,
  pluginCount: number,
  options = DEFAULT_OPTIONS
): Promise<InteractiveMetrics> {
  // Implementation using pty.js or node-pty through Deno FFI
  // This would require a native module or FFI bindings
  console.warn("PTY measurement not yet implemented - falling back to docker-exec");
  return measureWithDockerExec(manager, pluginCount, options);
}

/**
 * Improved expect script with better error handling
 */
async function measureWithExpect(
  manager: string,
  pluginCount: number,
  options = DEFAULT_OPTIONS
): Promise<InteractiveMetrics> {
  const metrics: InteractiveMetrics = {
    firstPromptLag: null,
    firstCommandLag: null,
    commandLag: null,
    inputLag: null,
    confidence: 0,
    method: 'expect',
  };

  // Enhanced expect script with better timing and error handling
  const expectScript = `#!/usr/bin/expect -f
set timeout ${options.timeout}
log_user 0
set first_prompt_lag -1
set first_command_lag -1
set command_lag -1
set input_lag -1

# Helper to get current time in milliseconds
proc current_time_ms {} {
    return [clock milliseconds]
}

# Start timing
set start_time [current_time_ms]

# Launch docker container
spawn docker run --rm -i zsh-benchmark:${manager}-${pluginCount} /bin/bash -c "
    export HOME=/root
    export TERM=xterm-256color
    exec zsh -l
"

# Handle spawn errors
if {[catch {exp_pid} pid]} {
    puts "ERROR: Failed to spawn container"
    exit 1
}

# Wait for first prompt with multiple patterns
expect {
    -re {\\$|%|>|❯|➜} {
        set first_prompt_lag [expr {[current_time_ms] - $start_time}]
        puts "DEBUG: First prompt detected after $first_prompt_lag ms"
    }
    timeout {
        puts "ERROR: Timeout waiting for first prompt"
        exit 1
    }
    eof {
        puts "ERROR: Container exited unexpectedly"
        exit 1
    }
}

# Small delay to ensure prompt is ready
after 100

# Send test command
send -- "echo 'BENCH_MARKER'\\r"

# Wait for command output
expect {
    "BENCH_MARKER" {
        set first_command_lag [expr {[current_time_ms] - $start_time}]
        puts "DEBUG: First command executed after $first_command_lag ms"
    }
    timeout {
        puts "ERROR: Timeout waiting for command output"
        exit 1
    }
}

# Wait for next prompt
expect {
    -re {\\$|%|>|❯|➜} {
        # Now measure pure command lag
        set cmd_start [current_time_ms]
        send -- "\\r"
        expect -re {\\$|%|>|❯|➜}
        set cmd_end [current_time_ms]
        set command_lag [expr {$cmd_end - $cmd_start}]
        puts "DEBUG: Command lag measured: $command_lag ms"
    }
    timeout {
        puts "ERROR: Timeout waiting for prompt after command"
    }
}

# Measure input lag with multiple samples
set input_samples {}
set input_errors 0

for {set i 0} {$i < 10} {incr i} {
    set char_start [current_time_ms]
    send -- "a"
    
    expect {
        "a" {
            set char_end [current_time_ms]
            lappend input_samples [expr {$char_end - $char_start}]
        }
        timeout {
            incr input_errors
        }
    }
    
    # Small delay between samples
    after 50
}

# Calculate average input lag if we have enough samples
if {[llength $input_samples] >= 5} {
    set input_sum 0
    foreach sample $input_samples {
        set input_sum [expr {$input_sum + $sample}]
    }
    set input_lag [expr {$input_sum / [llength $input_samples]}]
    puts "DEBUG: Average input lag: $input_lag ms (${[llength $input_samples]} samples)"
}

# Clean exit
send -- "\\003"  ;# Ctrl+C
send -- "exit\\r"
expect eof

# Output results in parseable format
puts "RESULTS:"
puts "first_prompt_lag=$first_prompt_lag"
puts "first_command_lag=$first_command_lag"
puts "command_lag=$command_lag"
puts "input_lag=$input_lag"
puts "confidence=[expr {1.0 - ($input_errors / 10.0)}]"
`;

  for (let attempt = 0; attempt < options.retries; attempt++) {
    try {
      const tempFile = await Deno.makeTempFile({ suffix: ".expect" });
      await Deno.writeTextFile(tempFile, expectScript);
      await Deno.chmod(tempFile, 0o755);

      const proc = new Deno.Command("expect", {
        args: [tempFile],
        stdout: "piped",
        stderr: "piped",
      });

      const { stdout, stderr, success } = await proc.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      await Deno.remove(tempFile);

      if (!success || error.includes("ERROR:")) {
        console.error(`Attempt ${attempt + 1} failed:`, error || output);
        if (attempt < options.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, options.retryDelay));
          continue;
        }
      }

      // Parse results
      const lines = output.split("\n");
      for (const line of lines) {
        if (line.startsWith("first_prompt_lag=")) {
          const value = parseInt(line.split("=")[1]);
          if (value > 0) metrics.firstPromptLag = value;
        } else if (line.startsWith("first_command_lag=")) {
          const value = parseInt(line.split("=")[1]);
          if (value > 0) metrics.firstCommandLag = value;
        } else if (line.startsWith("command_lag=")) {
          const value = parseInt(line.split("=")[1]);
          if (value > 0) metrics.commandLag = value;
        } else if (line.startsWith("input_lag=")) {
          const value = parseFloat(line.split("=")[1]);
          if (value > 0) metrics.inputLag = value;
        } else if (line.startsWith("confidence=")) {
          metrics.confidence = parseFloat(line.split("=")[1]) || 0;
        }
      }

      // If we got at least some metrics, consider it successful
      if (metrics.firstPromptLag !== null || metrics.commandLag !== null) {
        return metrics;
      }
    } catch (e) {
      console.error(`Attempt ${attempt + 1} error:`, e);
    }
  }

  // All attempts failed
  metrics.confidence = 0;
  return metrics;
}

/**
 * Docker exec based measurement - more reliable but less accurate
 */
async function measureWithDockerExec(
  manager: string,
  pluginCount: number,
  options = DEFAULT_OPTIONS
): Promise<InteractiveMetrics> {
  const metrics: InteractiveMetrics = {
    firstPromptLag: null,
    firstCommandLag: null,
    commandLag: null,
    inputLag: null,
    confidence: 0.7, // Lower confidence for this method
    method: 'docker-exec',
  };

  try {
    // Create a container but don't start it yet
    const createCmd = new Deno.Command("docker", {
      args: ["create", "--name", `bench-${Date.now()}`, `zsh-benchmark:${manager}-${pluginCount}`, "sleep", "60"],
      stdout: "piped",
    });
    
    const { stdout: containerIdRaw } = await createCmd.output();
    const containerId = new TextDecoder().decode(containerIdRaw).trim();

    // Start the container
    await new Deno.Command("docker", {
      args: ["start", containerId],
    }).output();

    // Measure first prompt lag
    const startTime = Date.now();
    
    // Execute a command that waits for the prompt
    const promptCheckCmd = new Deno.Command("docker", {
      args: ["exec", containerId, "bash", "-c", `
        timeout 10 bash -c '
          while ! zsh -l -c "exit" 2>&1 | grep -E "\\$|%|>|❯|➜" > /dev/null; do
            sleep 0.01
          done
        '
      `],
    });
    
    await promptCheckCmd.output();
    metrics.firstPromptLag = Date.now() - startTime;

    // Measure command execution time
    const cmdStart = Date.now();
    const execCmd = new Deno.Command("docker", {
      args: ["exec", containerId, "zsh", "-l", "-c", "echo MARKER"],
      stdout: "piped",
    });
    
    const { stdout } = await execCmd.output();
    const output = new TextDecoder().decode(stdout);
    
    if (output.includes("MARKER")) {
      metrics.firstCommandLag = Date.now() - startTime;
      metrics.commandLag = Date.now() - cmdStart;
    }

    // Cleanup
    await new Deno.Command("docker", {
      args: ["rm", "-f", containerId],
    }).output();

    metrics.confidence = 0.7;
  } catch (e) {
    console.error("Docker exec measurement failed:", e);
    metrics.confidence = 0;
  }

  return metrics;
}

/**
 * Simple measurement with improved accuracy
 */
async function measureSimple(
  manager: string,
  pluginCount: number,
  options = DEFAULT_OPTIONS
): Promise<InteractiveMetrics> {
  const metrics: InteractiveMetrics = {
    firstPromptLag: null,
    firstCommandLag: null,
    commandLag: null,
    inputLag: null,
    confidence: 0.5,
    method: 'simple',
  };

  // Build the appropriate docker image tag
  const imageTag = `zsh-benchmark:${manager}-${pluginCount}`;
  
  // First prompt lag measurement with better timing
  try {
    const startNs = Date.now();
    const proc = new Deno.Command("docker", {
      args: ["run", "--rm", imageTag, "bash", "-c", `
        start=$(date +%s%N)
        zsh -l -c 'exit' 2>&1 | head -1 > /dev/null
        end=$(date +%s%N)
        echo $((($end - $start) / 1000000))
      `],
      stdout: "piped",
    });
    
    const { stdout } = await proc.output();
    const result = parseInt(new TextDecoder().decode(stdout).trim());
    if (!isNaN(result) && result > 0) {
      metrics.firstPromptLag = result;
    }
  } catch (e) {
    console.error("Failed to measure first prompt lag:", e);
  }

  // First command lag measurement
  try {
    const proc = new Deno.Command("docker", {
      args: ["run", "--rm", "-i", imageTag, "bash", "-c", `
        start=$(date +%s%N)
        echo 'echo MARKER' | zsh -l 2>&1 | grep -m1 'MARKER' > /dev/null
        end=$(date +%s%N)
        echo $((($end - $start) / 1000000))
      `],
      stdout: "piped",
    });
    
    const { stdout } = await proc.output();
    const result = parseInt(new TextDecoder().decode(stdout).trim());
    if (!isNaN(result) && result > 0) {
      metrics.firstCommandLag = result;
    }
  } catch (e) {
    console.error("Failed to measure first command lag:", e);
  }

  // Command lag using hyperfine for accuracy
  try {
    const hyperfineCmd = `docker run --rm ${imageTag} hyperfine \
      --warmup 3 --runs 10 --export-json /tmp/cmd.json \
      'zsh -l -c "exit"' && cat /tmp/cmd.json`;
    
    const proc = new Deno.Command("bash", {
      args: ["-c", hyperfineCmd],
      stdout: "piped",
    });
    
    const { stdout } = await proc.output();
    const output = new TextDecoder().decode(stdout);
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      metrics.commandLag = Math.round(data.results[0].mean * 1000);
      metrics.confidence = 0.6; // Higher confidence with hyperfine
    }
  } catch (e) {
    console.error("Failed to measure command lag with hyperfine:", e);
  }

  return metrics;
}

/**
 * Measure with automatic method selection and fallback
 */
export async function measureInteractiveMetrics(
  manager: string,
  pluginCount: number,
  options = DEFAULT_OPTIONS
): Promise<InteractiveMetrics> {
  console.log(`📊 Measuring interactive metrics for ${manager} (${pluginCount} plugins)`);

  // Try methods in order of preference
  const methods = [
    { name: 'expect', fn: measureWithExpect },
    { name: 'docker-exec', fn: measureWithDockerExec },
    { name: 'simple', fn: measureSimple },
  ];

  for (const method of methods) {
    try {
      // Check if method is available
      if (method.name === 'expect') {
        const { success } = await new Deno.Command("which", { 
          args: ["expect"],
          stdout: "null",
          stderr: "null",
        }).output();
        if (!success) continue;
      }

      console.log(`  Trying ${method.name} method...`);
      const result = await method.fn(manager, pluginCount, options);
      
      // Accept result if confidence is above threshold
      if (result.confidence >= 0.5) {
        console.log(`  ✅ Success with ${method.name} (confidence: ${result.confidence.toFixed(2)})`);
        return result;
      }
      
      console.log(`  ⚠️  Low confidence with ${method.name}: ${result.confidence.toFixed(2)}`);
    } catch (e) {
      console.error(`  ❌ ${method.name} failed:`, e.message);
    }
  }

  // Return best effort result
  return {
    firstPromptLag: null,
    firstCommandLag: null,
    commandLag: null,
    inputLag: null,
    confidence: 0,
    method: 'simple',
  };
}

/**
 * Calculate aggregate metrics from multiple measurements
 */
export function aggregateMetrics(measurements: InteractiveMetrics[]): InteractiveMetrics {
  const validMeasurements = measurements.filter(m => m.confidence > 0);
  
  if (validMeasurements.length === 0) {
    return {
      firstPromptLag: null,
      firstCommandLag: null,
      commandLag: null,
      inputLag: null,
      confidence: 0,
      method: 'simple',
    };
  }

  // Weighted average based on confidence
  const totalConfidence = validMeasurements.reduce((sum, m) => sum + m.confidence, 0);
  
  const aggregate: InteractiveMetrics = {
    firstPromptLag: null,
    firstCommandLag: null,
    commandLag: null,
    inputLag: null,
    confidence: totalConfidence / validMeasurements.length,
    method: validMeasurements[0].method,
  };

  // Calculate weighted averages for each metric
  for (const metric of ['firstPromptLag', 'firstCommandLag', 'commandLag', 'inputLag'] as const) {
    const values = validMeasurements
      .filter(m => m[metric] !== null)
      .map(m => ({ value: m[metric]!, confidence: m.confidence }));
    
    if (values.length > 0) {
      const weightedSum = values.reduce((sum, v) => sum + v.value * v.confidence, 0);
      const weightSum = values.reduce((sum, v) => sum + v.confidence, 0);
      aggregate[metric] = Math.round(weightedSum / weightSum);
    }
  }

  return aggregate;
}

// CLI interface
if (import.meta.main) {
  const manager = Deno.args[0] || "vanilla";
  const pluginCount = parseInt(Deno.args[1] || "25");
  const iterations = parseInt(Deno.args[2] || "3");

  console.log(`🚀 Enhanced Interactive Benchmark`);
  console.log(`  Manager: ${manager}`);
  console.log(`  Plugins: ${pluginCount}`);
  console.log(`  Iterations: ${iterations}`);
  console.log();

  const measurements: InteractiveMetrics[] = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`\n📏 Iteration ${i + 1}/${iterations}`);
    const result = await measureInteractiveMetrics(manager, pluginCount);
    measurements.push(result);
    
    if (result.confidence > 0) {
      console.log(`  First Prompt: ${result.firstPromptLag?.toFixed(1) || '-'}ms`);
      console.log(`  First Command: ${result.firstCommandLag?.toFixed(1) || '-'}ms`);
      console.log(`  Command Lag: ${result.commandLag?.toFixed(1) || '-'}ms`);
      console.log(`  Input Lag: ${result.inputLag?.toFixed(1) || '-'}ms`);
    }
  }

  console.log("\n📊 Aggregate Results:");
  const aggregate = aggregateMetrics(measurements);
  
  console.log(`  Method: ${aggregate.method}`);
  console.log(`  Confidence: ${(aggregate.confidence * 100).toFixed(0)}%`);
  console.log(`  First Prompt Lag: ${aggregate.firstPromptLag?.toFixed(1) || 'N/A'}ms`);
  console.log(`  First Command Lag: ${aggregate.firstCommandLag?.toFixed(1) || 'N/A'}ms`);
  console.log(`  Command Lag: ${aggregate.commandLag?.toFixed(1) || 'N/A'}ms`);
  console.log(`  Input Lag: ${aggregate.inputLag?.toFixed(1) || 'N/A'}ms`);
  
  // Human perception evaluation
  if (aggregate.firstPromptLag !== null) {
    const rating = aggregate.firstPromptLag < 50 ? "🟢 Imperceptible" :
                   aggregate.firstPromptLag < 150 ? "🟡 Noticeable" : "🔴 Slow";
    console.log(`  First Prompt Rating: ${rating}`);
  }
  
  if (aggregate.commandLag !== null) {
    const rating = aggregate.commandLag < 10 ? "🟢 Imperceptible" :
                   aggregate.commandLag < 30 ? "🟡 Noticeable" : "🔴 Slow";
    console.log(`  Command Lag Rating: ${rating}`);
  }
}