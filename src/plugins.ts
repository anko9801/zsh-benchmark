// Plugin definitions and constants

export const ALL_PLUGINS = [
  "zsh-users/zsh-autosuggestions",
  "zsh-users/zsh-syntax-highlighting",
  "zsh-users/zsh-completions",
  "zsh-users/zsh-history-substring-search",
  "supercrabtree/k",
  "chriskempson/base16-shell",
  "zdharma-continuum/fast-syntax-highlighting",
  "MichaelAquilina/zsh-you-should-use",
  "iam4x/zsh-iterm-touchbar",
  "unixorn/git-extra-commands",
  "romkatv/powerlevel10k",
  "mfaerevaag/wd",
  "agkozak/zsh-z",
  "Tarrasch/zsh-autoenv",
  "zsh-users/zaw",
  "djui/alias-tips",
  "changyuheng/fz",
  "rupa/z",
  "olivierverdier/zsh-git-prompt",
  "willghatch/zsh-saneopt",
  "zdharma-continuum/history-search-multi-word",
  "StackExchange/blackbox",
  "b4b4r07/enhancd",
  "fcambus/ansiweather",
  "wting/autojump",
] as const;

export type Plugin = typeof ALL_PLUGINS[number];
