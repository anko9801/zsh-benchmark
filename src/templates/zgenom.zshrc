#!/usr/bin/env zsh
export ZGEN_DIR="$HOME/.zgenom"
source "$ZGEN_DIR/zgenom.zsh"

# Force non-interactive mode
export ZGENOM_AUTOLOAD_COMPINIT=0

if ! zgenom saved; then
{{PLUGIN_LOADS}}
  zgenom save
fi