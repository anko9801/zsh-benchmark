// Plugin manager configurations

import { PluginManager } from "./types.ts";
import { runCommand } from "./utils.ts";

export const PLUGIN_MANAGERS: Record<string, PluginManager> = {
  "oh-my-zsh": {
    name: "oh-my-zsh",
    cacheCleanCommand:
      "rm -rf ~/.oh-my-zsh/cache ~/.oh-my-zsh/custom/plugins/* 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "oh-my-zsh.zshrc" },
    ],
    generatePluginLoad: (plugin) =>
      `source ~/.oh-my-zsh/custom/plugins/${plugin.split("/")[1]}/${
        plugin.split("/")[1]
      }.plugin.zsh 2>/dev/null || true`,
    preInstallCommand: async (plugins: string[]) => {
      // Clone plugins for oh-my-zsh
      for (const plugin of plugins) {
        const pluginName = plugin.split("/")[1];
        await runCommand(
          `git clone https://github.com/${plugin}.git ~/.oh-my-zsh/custom/plugins/${pluginName} 2>/dev/null || true`,
        );
      }
    },
  },

  "prezto": {
    name: "prezto",
    cacheCleanCommand:
      "rm -rf ~/.zprezto-contrib/* ~/.zprezto/cache ~/.cache/prezto 2>/dev/null || true",
    configFiles: [
      { path: "~/.zpreztorc", template: "prezto.zpreztorc" },
      { path: "~/.zshrc", template: "prezto.zshrc" },
    ],
    generatePluginLoad: (plugin) => {
      const pluginName = plugin.split("/")[1];
      return `# External plugin: ${plugin}\n[[ -d ~/.zprezto-contrib/${pluginName} ]] && source ~/.zprezto-contrib/${pluginName}/${pluginName}.plugin.zsh 2>/dev/null || true`;
    },
    preInstallCommand: async (plugins: string[]) => {
      // Create contrib directory and clone plugins for prezto
      await runCommand("mkdir -p ~/.zprezto-contrib");
      for (const plugin of plugins) {
        const pluginName = plugin.split("/")[1];
        await runCommand(
          `git clone https://github.com/${plugin}.git ~/.zprezto-contrib/${pluginName} 2>/dev/null || true`,
        );
      }
    },
  },

  "zim": {
    name: "zim",
    cacheCleanCommand: "rm -rf ~/.zim/modules ~/.cache/zim ~/.zimrc.bak-default 2>/dev/null || true",
    configFiles: [
      { path: "~/.zimrc", template: "zim.zimrc", isPluginList: true },
      { path: "~/.zshrc", template: "zim.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zmodule ${plugin}`,
    specialInit: async () => {
      // Initialize zim if needed
      const { exists } = await import("./utils.ts");
      const { expandPath } = await import("./utils.ts");
      const initPath = expandPath("~/.zim/init.zsh");
      if (!await exists(initPath)) {
        console.log("     Creating init.zsh...");
        await runCommand(
          "zsh -c 'export ZIM_HOME=~/.zim; source \${ZIM_HOME}/zimfw.zsh init -q'",
        );
      }
    },
    postInstallCommand:
      "zsh -c 'export ZIM_HOME=~/.zim; source \\${ZIM_HOME}/zimfw.zsh install'",
    preInstallCommand: async (plugins: string[]) => {
      // For 0 plugins, run init to avoid repeated init during benchmark
      if (plugins.length === 0) {
        await runCommand(
          "zsh -c 'export ZIM_HOME=~/.zim; source \${ZIM_HOME}/zimfw.zsh init -q'",
        );
      }
    },
  },

  "znap": {
    name: "znap",
    cacheCleanCommand:
      'rm -rf ~/.cache/znap ~/Git/zsh-* 2>/dev/null || true',
    configFiles: [
      { path: "~/.zshrc", template: "znap.zshrc" },
    ],
    generatePluginLoad: (plugin) => `znap clone ${plugin}`,
  },

  "zinit": {
    name: "zinit",
    cacheCleanCommand:
      'find ~/.local/share/zinit -mindepth 1 -maxdepth 1 ! -name "zinit.git" -exec rm -rf {} + 2>/dev/null || true; rm -rf ~/.zinit ~/.cache/zinit ~/.zplugin 2>/dev/null || true',
    configFiles: [
      { path: "~/.zshrc", template: "zinit.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zinit light ${plugin}`,
  },

  "zplug": {
    name: "zplug",
    cacheCleanCommand:
      "if [[ -d ~/.zplug/.git ]]; then git -C ~/.zplug clean -dffx; else rm -rf ~/.zplug/repos ~/.zplug/cache; fi 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zplug.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zplug "${plugin}"`,
  },

  "antigen": {
    name: "antigen",
    cacheCleanCommand: "rm -rf ~/.antigen 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "antigen.zshrc" },
    ],
    generatePluginLoad: (plugin) => `antigen bundle ${plugin}`,
  },

  "antibody": {
    name: "antibody",
    cacheCleanCommand: "rm -rf ~/.cache/antibody 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "antibody.zshrc" },
      {
        path: "~/.antibody_plugins.txt",
        template: "antibody.plugins.txt",
        isPluginList: true,
      },
    ],
    generatePluginLoad: (plugin) => `antibody bundle ${plugin}`,
    preInstallCommand:
      "antibody bundle < ~/.antibody_plugins.txt > ~/.antibody_plugins.sh",
  },

  "antidote": {
    name: "antidote",
    cacheCleanCommand:
      "rm -rf ~/.cache/antidote ~/.zsh_plugins.zsh 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "antidote.zshrc" },
      {
        path: "~/.zsh_plugins.txt",
        template: "antidote.zsh_plugins.txt",
        isPluginList: true,
      },
    ],
    generatePluginLoad: (plugin) => plugin,
    postInstallCommand:
      "zsh -c 'source /usr/local/share/antidote/antidote.zsh && antidote load ~/.zsh_plugins.txt'",
  },

  "sheldon": {
    name: "sheldon",
    cacheCleanCommand:
      "rm -rf ~/.local/share/sheldon ~/.cache/sheldon 2>/dev/null || true",
    configFiles: [
      {
        path: "~/.config/sheldon/plugins.toml",
        template: "sheldon.plugins.toml",
      },
      { path: "~/.zshrc", template: "sheldon.zshrc" },
    ],
    generatePluginLoad: (plugin) => {
      const [_user, repo] = plugin.split("/");
      return `[plugins.${repo}]\ngithub = "${plugin}"`;
    },
    preInstallCommand: "sheldon lock",
  },

  "zgenom": {
    name: "zgenom",
    cacheCleanCommand:
      "if [[ -d ~/.zgenom/.git ]]; then git -C ~/.zgenom clean -dffx; else rm -rf ~/.zgenom/sources ~/.zgenom/*.zsh ~/.zgenom/*.zwc; fi 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zgenom.zshrc" },
    ],
    generatePluginLoad: (plugin) => `  zgenom load ${plugin}`,
  },

  "zpm": {
    name: "zpm",
    cacheCleanCommand: "rm -rf ~/.local/share/zsh/plugins 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zpm.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zpm load ${plugin}`,
  },

  "zr": {
    name: "zr",
    cacheCleanCommand: "rm -rf ~/.zr/plugins 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zr.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zr load ${plugin}`,
  },

  "antigen-hs": {
    name: "antigen-hs",
    cacheCleanCommand: "rm -rf ~/.antigen-hs/repos 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "antigen-hs.zshrc" },
    ],
    generatePluginLoad: (plugin) => `antigen-hs bundle ${plugin}`,
  },

  "zcomet": {
    name: "zcomet",
    cacheCleanCommand:
      "rm -rf ~/.zcomet/downloads ~/.zcomet/repos 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zcomet.zshrc" },
      { path: "~/.zshrc.zcomet", template: "zcomet.zshrc.zcomet" },
    ],
    generatePluginLoad: (plugin) => `zcomet load ${plugin}`,
  },

  "alf": {
    name: "alf",
    cacheCleanCommand: "rm -rf ~/.alf/plugins 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "alf.zshrc" },
    ],
    generatePluginLoad: (plugin) => `alf load ${plugin}`,
  },
};
