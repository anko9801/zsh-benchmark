source "$HOME/.zgenom/zgenom.zsh"

# Force non-interactive mode
export ZGENOM_AUTOLOAD_COMPINIT=0

if ! zgenom saved; then
{{PLUGIN_LOADS}}
  zgenom save
fi