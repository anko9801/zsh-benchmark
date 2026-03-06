source "$HOME/.zgenom/zgenom.zsh"

if ! zgenom saved; then
{{PLUGIN_LOADS}}
  zgenom save
fi