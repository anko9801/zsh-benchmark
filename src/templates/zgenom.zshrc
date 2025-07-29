source "$HOME/.zgenom/zgenom.zsh"
if ! zgenom saved; then
  echo "Creating a zgenom save"
{{PLUGIN_LOADS}}
  zgenom save
fi