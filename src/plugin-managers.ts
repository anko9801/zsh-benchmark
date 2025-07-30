// Plugin manager configurations

import { PluginManager } from "./types.ts";
import { runCommand } from "./utils.ts";

export const PLUGIN_MANAGERS: Record<string, PluginManager> = {
  "vanilla": {
    name: "vanilla",
    repo: "zsh-users/zsh",
    cacheCleanCommand: "true", // No cache to clean
    configFiles: [
      { path: "~/.zshrc", template: "vanilla.zshrc" },
    ],
    generatePluginLoad: (_plugin) => "", // No plugins
    versionCommand: "zsh --version | awk '{print $2}'",
  },

  "oh-my-zsh": {
    name: "oh-my-zsh",
    repo: "ohmyzsh/ohmyzsh",
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
    versionCommand:
      "cd ~/.oh-my-zsh && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "prezto": {
    name: "prezto",
    repo: "sorin-ionescu/prezto",
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
    versionCommand:
      "cd ~/.zprezto && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "zim": {
    name: "zim",
    repo: "zimfw/zimfw",
    cacheCleanCommand: "rm -rf ~/.zim/modules ~/.cache/zim ~/.zimrc.bak-default 2>/dev/null || true",
    configFiles: [
      { path: "~/.zimrc", template: "zim.zimrc", isPluginList: true },
      { path: "~/.zshrc", template: "zim.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zmodule ${plugin}`,
    specialInit: async () => {
      // Initialize zim if needed - always run init to ensure it's up to date with zimrc
      await runCommand(
        "zsh -c 'export ZIM_HOME=~/.zim; source \\${ZIM_HOME}/zimfw.zsh init -q' >/dev/null 2>&1 || true",
      );
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
    versionCommand:
      "zsh -c 'source ~/.zim/zimfw.zsh && zimfw version' 2>/dev/null || echo 'unknown'",
  },

  "znap": {
    name: "znap",
    repo: "marlonrichert/zsh-snap",
    cacheCleanCommand:
      'find ~/Git -maxdepth 1 -name "zsh-*" ! -name "zsh-snap" -type d -exec rm -rf {} \\; 2>/dev/null || true; rm -rf ~/.cache/znap 2>/dev/null || true',
    configFiles: [
      { path: "~/.zshrc", template: "znap.zshrc" },
    ],
    generatePluginLoad: (plugin) => `znap source ${plugin}`,
    preInstallCommand: async (plugins: string[]) => {
      if (plugins.length > 0) {
        // Force znap to clone all plugins before benchmarking
        const pluginList = plugins.map(p => `'${p}'`).join(' ');
        await runCommand(
          `zsh -c "source ~/Git/zsh-snap/znap.zsh && znap clone ${pluginList}"`,
          { silent: true }
        );
      }
    },
    versionCommand:
      "cd ~/Git/zsh-snap && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "zinit": {
    name: "zinit",
    repo: "zdharma-continuum/zinit",
    cacheCleanCommand:
      'find ~/.local/share/zinit -mindepth 1 -maxdepth 1 ! -name "zinit.git" -exec rm -rf {} + 2>/dev/null || true; rm -rf ~/.zinit ~/.cache/zinit ~/.zplugin 2>/dev/null || true',
    configFiles: [
      { path: "~/.zshrc", template: "zinit.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zinit light ${plugin}`,
    versionCommand:
      "cd ~/.local/share/zinit/zinit.git && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "zplug": {
    name: "zplug",
    repo: "zplug/zplug",
    cacheCleanCommand:
      "if [[ -d ~/.zplug/.git ]]; then git -C ~/.zplug clean -dffx; else rm -rf ~/.zplug/repos ~/.zplug/cache; fi 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zplug.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zplug "${plugin}"`,
    versionCommand:
      "zsh -c 'source ~/.zplug/init.zsh && echo $ZPLUG_VERSION' 2>/dev/null || cd ~/.zplug && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
  },

  "antigen": {
    name: "antigen",
    repo: "zsh-users/antigen",
    cacheCleanCommand: "rm -rf ~/.antigen 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "antigen.zshrc" },
    ],
    generatePluginLoad: (plugin) => `antigen bundle ${plugin}`,
    versionCommand:
      "grep 'ANTIGEN_VERSION=' ~/.antigen/antigen.zsh 2>/dev/null | cut -d'=' -f2 | tr -d '\"' || cd ~/.antigen && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
  },

  "antibody": {
    name: "antibody",
    repo: "getantibody/antibody",
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
    versionCommand: "antibody -v 2>/dev/null | awk '{print $3}' || echo 'unknown'",
  },

  "antidote": {
    name: "antidote",
    repo: "mattmc3/antidote",
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
    versionCommand: "zsh -c 'source /usr/local/share/antidote/antidote.zsh && antidote -v' 2>/dev/null | awk 'NR==1 {print $3}' || cd /usr/local/share/antidote && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
  },

  "sheldon": {
    name: "sheldon",
    repo: "rossmacarthur/sheldon",
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
    versionCommand:
      "sheldon --version 2>/dev/null | awk 'NR==1 {print $2}' || echo 'unknown'",
  },

  "zgenom": {
    name: "zgenom",
    repo: "jandamm/zgenom",
    cacheCleanCommand:
      "if [[ -d ~/.zgenom/.git ]]; then git -C ~/.zgenom clean -dffx; else rm -rf ~/.zgenom/sources ~/.zgenom/*.zsh ~/.zgenom/*.zwc; fi 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zgenom.zshrc" },
    ],
    generatePluginLoad: (plugin) => `  zgenom load ${plugin}`,
    preInstallCommand: "zsh -c 'source ~/.zshrc' 2>/dev/null || true",
    versionCommand:
      "cd ~/.zgenom && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "zpm": {
    name: "zpm",
    repo: "zpm-zsh/zpm",
    cacheCleanCommand: "rm -rf ~/.local/share/zsh/plugins 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zpm.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zpm load ${plugin}`,
    versionCommand:
      "cd ~/.zpm && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "zr": {
    name: "zr",
    repo: "jedahan/zr",
    cacheCleanCommand: "rm -rf ~/.zr/plugins 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zr.zshrc" },
    ],
    generatePluginLoad: (plugin) => `zr load ${plugin}`,
    versionCommand: "echo 'custom implementation'",
  },

  "antigen-hs": {
    name: "antigen-hs",
    repo: "Tarrasch/antigen-hs",
    cacheCleanCommand: "rm -rf ~/.antigen-hs/repos 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "antigen-hs.zshrc" },
    ],
    generatePluginLoad: (plugin) => `antigen-hs bundle ${plugin}`,
    versionCommand: "echo 'custom implementation'",
  },

  "zcomet": {
    name: "zcomet",
    repo: "agkozak/zcomet",
    cacheCleanCommand:
      "rm -rf ~/.zcomet/downloads ~/.zcomet/repos 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "zcomet.zshrc" },
      { path: "~/.zshrc.zcomet", template: "zcomet.zshrc.zcomet" },
    ],
    generatePluginLoad: (plugin) => `zcomet load ${plugin}`,
    versionCommand:
      "cd ~/.zcomet && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  },

  "alf": {
    name: "alf",
    repo: "psyrendust/alf",
    cacheCleanCommand: "rm -rf ~/.alf/plugins 2>/dev/null || true",
    configFiles: [
      { path: "~/.zshrc", template: "alf.zshrc" },
    ],
    generatePluginLoad: (plugin) => `alf load ${plugin}`,
    versionCommand: "echo 'custom implementation'",
  },
};
