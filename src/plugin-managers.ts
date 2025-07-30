import { PluginManager } from "./types.ts";
import { runCommand } from "./utils.ts";

// ============================================================================
// Helper Functions
// ============================================================================

const getPluginName = (plugin: string): string => plugin.split("/")[1];

const getGitVersion = (path: string): string =>
  `cd ${path} && (git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo 'unknown')`;

const cleanCacheDirs = (...paths: string[]): string =>
  paths.map((path) => `rm -rf ${path} 2>/dev/null`).join(" || ") + " || true";

const createCommand =
  (prefix: string, suffix = ""): (plugin: string) => string =>
  (plugin: string) => `${prefix} ${plugin}${suffix}`;

const gitClonePlugins = (dir: string) => async (plugins: string[]) => {
  await runCommand(`mkdir -p ${dir}`);
  for (const plugin of plugins) {
    await runCommand(
      `git clone https://github.com/${plugin}.git ${dir}/${
        getPluginName(plugin)
      } 2>/dev/null || true`,
    );
  }
};

const createConfigFiles = (
  template: string,
  listPath?: string,
  listTemplate?: string,
) =>
  listPath
    ? [{ path: "~/.zshrc", template }, {
      path: listPath,
      template: listTemplate!,
      isPluginList: true,
    }]
    : [{ path: "~/.zshrc", template }];

// ============================================================================
// Exported Helper Functions (for backward compatibility)
// ============================================================================

export const hasNoInstallSupport = (manager: string): boolean => {
  const mgr = PLUGIN_MANAGERS[manager as keyof typeof PLUGIN_MANAGERS];
  return mgr?.noInstallSupport || false;
};

export const requiresSpecialTableHandling = (manager: string): boolean => {
  const mgr = PLUGIN_MANAGERS[manager as keyof typeof PLUGIN_MANAGERS];
  return mgr?.requiresSpecialTableHandling || false;
};

export const isSlowInstallManager = (manager: string): boolean => {
  const mgr = PLUGIN_MANAGERS[manager as keyof typeof PLUGIN_MANAGERS];
  return !!mgr?.slowInstallSettings;
};

export const hasSpecialInstallMeasure = (manager: string): boolean => {
  const mgr = PLUGIN_MANAGERS[manager as keyof typeof PLUGIN_MANAGERS];
  return mgr?.specialInstallMeasure || false;
};

export const getSlowManagerSettings = (
  manager: string,
  pluginCount: number,
): { runs: number; timeout: number } | null => {
  const mgr = PLUGIN_MANAGERS[manager as keyof typeof PLUGIN_MANAGERS];
  if (
    mgr?.slowInstallSettings &&
    pluginCount >= mgr.slowInstallSettings.minPluginCount
  ) {
    return {
      runs: mgr.slowInstallSettings.runs,
      timeout: mgr.slowInstallSettings.timeout,
    };
  }
  return null;
};

export const getSpecialInstallCommand = (manager: string): string | null => {
  const mgr = PLUGIN_MANAGERS[manager as keyof typeof PLUGIN_MANAGERS];
  if (manager === "zgenom") {
    return `zsh -c 'source ~/.zshrc && zgenom update'`;
  }
  return mgr?.customInstallCommand || null;
};

export const getPluginLoadSeparator = (templateName: string): string => {
  // Special case for sheldon TOML format
  return templateName === "sheldon.plugins.toml" ? "\n\n" : "\n";
};

export const usesPluginConfigs = (templateName: string): boolean => {
  // Special case for sheldon TOML format
  return templateName === "sheldon.plugins.toml";
};

// ============================================================================
// Type Definitions
// ============================================================================

export const MANAGER_NAMES = [
  "vanilla",
  "oh-my-zsh",
  "prezto",
  "zim",
  "znap",
  "zinit",
  "zplug",
  "antigen",
  "antibody",
  "antidote",
  "sheldon",
  "zgenom",
  "zpm",
  "zr",
  "antigen-hs",
  "zcomet",
  "alf",
] as const;

export type ManagerName = typeof MANAGER_NAMES[number];

// ============================================================================
// Plugin Manager Definitions
// ============================================================================

export const PLUGIN_MANAGERS: Record<ManagerName, PluginManager> = {
  vanilla: {
    name: "vanilla",
    repo: "zsh-users/zsh",
    cacheCleanCommand: "true",
    configFiles: createConfigFiles("vanilla.zshrc"),
    generatePluginLoad: () => "",
    versionCommand: "zsh --version | awk '{print $2}'",
  },

  "oh-my-zsh": {
    name: "oh-my-zsh",
    repo: "ohmyzsh/ohmyzsh",
    cacheCleanCommand: cleanCacheDirs(
      "~/.oh-my-zsh/cache",
      "~/.oh-my-zsh/custom/plugins/*",
    ),
    configFiles: createConfigFiles("oh-my-zsh.zshrc"),
    generatePluginLoad: (plugin) =>
      `source ~/.oh-my-zsh/custom/plugins/${getPluginName(plugin)}/${
        getPluginName(plugin)
      }.plugin.zsh 2>/dev/null || true`,
    preInstallCommand: gitClonePlugins("~/.oh-my-zsh/custom/plugins"),
    versionCommand: getGitVersion("~/.oh-my-zsh"),
    noInstallSupport: true,
    requiresSpecialTableHandling: true,
  },

  prezto: {
    name: "prezto",
    repo: "sorin-ionescu/prezto",
    cacheCleanCommand: cleanCacheDirs(
      "~/.zprezto-contrib/*",
      "~/.zprezto/cache",
      "~/.cache/prezto",
    ),
    configFiles: [
      { path: "~/.zpreztorc", template: "prezto.zpreztorc" },
      { path: "~/.zshrc", template: "prezto.zshrc" },
    ],
    generatePluginLoad: (plugin) =>
      `# External plugin: ${plugin}\n[[ -d ~/.zprezto-contrib/${
        getPluginName(plugin)
      } ]] && source ~/.zprezto-contrib/${getPluginName(plugin)}/${
        getPluginName(plugin)
      }.plugin.zsh 2>/dev/null || true`,
    preInstallCommand: gitClonePlugins("~/.zprezto-contrib"),
    versionCommand: getGitVersion("~/.zprezto"),
    noInstallSupport: true,
    requiresSpecialTableHandling: true,
  },

  zim: {
    name: "zim",
    repo: "zimfw/zimfw",
    cacheCleanCommand: cleanCacheDirs(
      "~/.zim/modules",
      "~/.cache/zim",
      "~/.zimrc.bak-default",
    ),
    configFiles: [
      { path: "~/.zimrc", template: "zim.zimrc", isPluginList: true },
      { path: "~/.zshrc", template: "zim.zshrc" },
    ],
    generatePluginLoad: createCommand("zmodule"),
    specialInit: async () => {
      await runCommand(
        "zsh -c 'export ZIM_HOME=~/.zim; source \\${ZIM_HOME}/zimfw.zsh init -q' >/dev/null 2>&1 || true",
      );
    },
    postInstallCommand:
      "zsh -c 'export ZIM_HOME=~/.zim; source \\${ZIM_HOME}/zimfw.zsh install'",
    preInstallCommand: async (plugins) => {
      if (plugins.length === 0) {
        await runCommand(
          "zsh -c 'export ZIM_HOME=~/.zim; source ${ZIM_HOME}/zimfw.zsh init -q'",
        );
      }
    },
    versionCommand:
      "zsh -c 'source ~/.zim/zimfw.zsh && zimfw version' 2>/dev/null || echo 'unknown'",
  },

  znap: {
    name: "znap",
    repo: "marlonrichert/zsh-snap",
    cacheCleanCommand:
      'find ~/Git -maxdepth 1 -name "zsh-*" ! -name "zsh-snap" -type d -exec rm -rf {} \\; 2>/dev/null || true; rm -rf ~/.cache/znap 2>/dev/null || true',
    configFiles: createConfigFiles("znap.zshrc"),
    generatePluginLoad: createCommand("znap source"),
    preInstallCommand: async (plugins) => {
      if (plugins.length > 0) {
        await runCommand(
          `zsh -c "source ~/Git/zsh-snap/znap.zsh && znap clone ${
            plugins.map((plugin) => `'${plugin}'`).join(" ")
          }"`,
          { silent: true },
        );
      }
    },
    versionCommand: getGitVersion("~/Git/zsh-snap"),
  },

  zinit: {
    name: "zinit",
    repo: "zdharma-continuum/zinit",
    cacheCleanCommand:
      'find ~/.local/share/zinit -mindepth 1 -maxdepth 1 ! -name "zinit.git" -exec rm -rf {} + 2>/dev/null || true; rm -rf ~/.zinit ~/.cache/zinit ~/.zplugin 2>/dev/null || true',
    configFiles: createConfigFiles("zinit.zshrc"),
    generatePluginLoad: createCommand("zinit light"),
    versionCommand: getGitVersion("~/.local/share/zinit/zinit.git"),
  },

  zplug: {
    name: "zplug",
    repo: "zplug/zplug",
    cacheCleanCommand: cleanCacheDirs(
      "~/.zplug/repos",
      "~/.zplug/cache",
      "~/.zplug/log",
      "~/.zplug/.zcompdump*",
    ),
    configFiles: createConfigFiles("zplug.zshrc"),
    generatePluginLoad: (plugin) => `zplug "${plugin}"`,
    versionCommand:
      "zsh -c 'source ~/.zplug/init.zsh && echo $ZPLUG_VERSION' 2>/dev/null || cd ~/.zplug && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
    slowInstallSettings: {
      minPluginCount: 25,
      runs: 3,
      timeout: 300,
    },
  },

  antigen: {
    name: "antigen",
    repo: "zsh-users/antigen",
    cacheCleanCommand: cleanCacheDirs("~/.antigen"),
    configFiles: createConfigFiles("antigen.zshrc"),
    generatePluginLoad: createCommand("antigen bundle"),
    versionCommand:
      "grep 'ANTIGEN_VERSION=' ~/.antigen/antigen.zsh 2>/dev/null | cut -d'=' -f2 | tr -d '\"' || cd ~/.antigen && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
  },

  antibody: {
    name: "antibody",
    repo: "getantibody/antibody",
    cacheCleanCommand: cleanCacheDirs("~/.cache/antibody"),
    configFiles: createConfigFiles(
      "antibody.zshrc",
      "~/.antibody_plugins.txt",
      "antibody.plugins.txt",
    ),
    generatePluginLoad: createCommand("antibody bundle"),
    preInstallCommand:
      "antibody bundle < ~/.antibody_plugins.txt > ~/.antibody_plugins.sh",
    versionCommand:
      "antibody -v 2>/dev/null | awk '{print $3}' || echo 'unknown'",
  },

  antidote: {
    name: "antidote",
    repo: "mattmc3/antidote",
    cacheCleanCommand: cleanCacheDirs(
      "~/.cache/antidote",
      "~/.zsh_plugins.zsh",
    ),
    configFiles: createConfigFiles(
      "antidote.zshrc",
      "~/.zsh_plugins.txt",
      "antidote.zsh_plugins.txt",
    ),
    generatePluginLoad: (plugin) => plugin,
    postInstallCommand:
      "zsh -c 'source /usr/local/share/antidote/antidote.zsh && antidote load ~/.zsh_plugins.txt'",
    versionCommand:
      "zsh -c 'source /usr/local/share/antidote/antidote.zsh && antidote -v' 2>/dev/null | awk 'NR==1 {print $3}' || cd /usr/local/share/antidote && git rev-parse --short HEAD 2>/dev/null || echo 'unknown'",
  },

  sheldon: {
    name: "sheldon",
    repo: "rossmacarthur/sheldon",
    cacheCleanCommand: cleanCacheDirs(
      "~/.local/share/sheldon",
      "~/.cache/sheldon",
    ),
    configFiles: [
      {
        path: "~/.config/sheldon/plugins.toml",
        template: "sheldon.plugins.toml",
      },
      { path: "~/.zshrc", template: "sheldon.zshrc" },
    ],
    generatePluginLoad: (plugin) =>
      `[plugins.${getPluginName(plugin)}]\ngithub = "${plugin}"`,
    preInstallCommand: "sheldon lock",
    versionCommand:
      "sheldon --version 2>/dev/null | awk 'NR==1 {print $2}' || echo 'unknown'",
    templateConfig: {
      separator: "\n\n",
      usesPluginConfigs: true,
    },
  },

  zgenom: {
    name: "zgenom",
    repo: "jandamm/zgenom",
    cacheCleanCommand: cleanCacheDirs(
      "~/.zgenom/sources",
      "~/.zgenom/init.zsh",
      "~/.zgenom/*.zwc",
      "~/.zgenom/.zcompdump*",
    ),
    configFiles: createConfigFiles("zgenom.zshrc"),
    generatePluginLoad: createCommand("  zgenom load"),
    preInstallCommand: async () => {
      await runCommand(
        "rm -rf ~/.zgenom/sources ~/.zgenom/init.zsh ~/.zgenom/.zcompdump* 2>/dev/null || true",
        { silent: true },
      );
    },
    skipInstall: false,
    specialInstallMeasure: true,
    versionCommand: getGitVersion("~/.zgenom"),
  },

  zpm: {
    name: "zpm",
    repo: "zpm-zsh/zpm",
    cacheCleanCommand: cleanCacheDirs("~/.local/share/zsh/plugins"),
    configFiles: createConfigFiles("zpm.zshrc"),
    generatePluginLoad: createCommand("zpm load"),
    versionCommand: getGitVersion("~/.zpm"),
  },

  zr: {
    name: "zr",
    repo: "jedahan/zr",
    cacheCleanCommand: cleanCacheDirs("~/.zr/plugins"),
    configFiles: createConfigFiles("zr.zshrc"),
    generatePluginLoad: createCommand("zr load"),
    versionCommand: "echo 'custom implementation'",
  },

  "antigen-hs": {
    name: "antigen-hs",
    repo: "Tarrasch/antigen-hs",
    cacheCleanCommand: cleanCacheDirs("~/.antigen-hs/repos"),
    configFiles: createConfigFiles("antigen-hs.zshrc"),
    generatePluginLoad: createCommand("antigen-hs bundle"),
    versionCommand: "echo 'custom implementation'",
  },

  zcomet: {
    name: "zcomet",
    repo: "agkozak/zcomet",
    cacheCleanCommand: cleanCacheDirs("~/.zcomet/downloads", "~/.zcomet/repos"),
    configFiles: [
      { path: "~/.zshrc", template: "zcomet.zshrc" },
      { path: "~/.zshrc.zcomet", template: "zcomet.zshrc.zcomet" },
    ],
    generatePluginLoad: createCommand("zcomet load"),
    versionCommand: getGitVersion("~/.zcomet"),
  },

  alf: {
    name: "alf",
    repo: "psyrendust/alf",
    cacheCleanCommand: cleanCacheDirs("~/.alf/plugins"),
    configFiles: createConfigFiles("alf.zshrc"),
    generatePluginLoad: createCommand("alf load"),
    versionCommand: "echo 'custom implementation'",
  },
};
