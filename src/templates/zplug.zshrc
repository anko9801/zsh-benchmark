export ZPLUG_HOME=$HOME/.zplug
# Disable parallel processing and logging to prevent freezes
export ZPLUG_THREADS=1
export ZPLUG_PROTOCOL=https
export ZPLUG_USE_CACHE=false
export ZPLUG_FILTER=fzf:peco:percol:fzy
source $ZPLUG_HOME/init.zsh
{{PLUGIN_LOADS}}
# zplug install should be conditional with timeout
if ! zplug check --verbose >/dev/null 2>&1; then
    timeout 120 zplug install || true
fi
zplug load