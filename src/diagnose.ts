#!/usr/bin/env -S deno run --allow-all

// Diagnostic script to check plugin manager installations

import { runCommand, exists, expandPath } from "./utils.ts";
import { PLUGIN_MANAGERS } from "./plugin-managers.ts";

async function diagnoseManager(managerName: string) {
  console.log(`\n=== Diagnosing ${managerName} ===`);
  
  const manager = PLUGIN_MANAGERS[managerName];
  if (!manager) {
    console.log("❌ Manager not found in configuration");
    return;
  }

  // Check if config files exist
  for (const config of manager.configFiles) {
    const path = expandPath(config.path);
    const fileExists = await exists(path);
    console.log(`Config file ${config.path}: ${fileExists ? "✅ exists" : "❌ missing"}`);
    
    if (fileExists && managerName === "zim") {
      // Check zim specific files
      const zimInit = await exists(expandPath("~/.zim/init.zsh"));
      console.log(`~/.zim/init.zsh: ${zimInit ? "✅ exists" : "❌ missing"}`);
      
      const zimfw = await exists(expandPath("~/.zim/zimfw.zsh"));
      console.log(`~/.zim/zimfw.zsh: ${zimfw ? "✅ exists" : "❌ missing"}`);
    }
  }

  // Try to run a simple test
  console.log("\nTesting shell startup:");
  const testCmd = `timeout 5 zsh -ic 'echo "TEST_OK"' 2>&1`;
  const { success, output, error } = await runCommand(testCmd);
  
  if (success && output.includes("TEST_OK")) {
    console.log("✅ Shell starts successfully");
  } else {
    console.log("❌ Shell startup failed");
    console.log("Output:", output);
    console.log("Error:", error);
  }

  // Check for specific manager files
  switch (managerName) {
    case "antigen": {
      const antigenExists = await exists(expandPath("~/antigen.zsh"));
      console.log(`~/antigen.zsh: ${antigenExists ? "✅ exists" : "❌ missing"}`);
      break;
    }
    case "antidote": {
      const antidoteExists = await exists("/usr/local/share/antidote");
      console.log(`/usr/local/share/antidote: ${antidoteExists ? "✅ exists" : "❌ missing"}`);
      break;
    }
    case "zcomet": {
      const zcometExists = await exists(expandPath("~/.zcomet"));
      console.log(`~/.zcomet: ${zcometExists ? "✅ exists" : "❌ missing"}`);
      break;
    }
  }
}

// Main
if (import.meta.main) {
  const managers = ["zim", "antigen", "antidote", "zcomet"];
  
  for (const manager of managers) {
    await diagnoseManager(manager);
  }
}