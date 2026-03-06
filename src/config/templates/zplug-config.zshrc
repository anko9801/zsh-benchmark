export ZPLUG_HOME=$HOME/.zplug
source $ZPLUG_HOME/init.zsh

# Configure zplug to avoid hanging
export ZPLUG_CLONE_DEPTH=1
export ZPLUG_USE_CACHE=false
export ZPLUG_PROTOCOL=HTTPS

{{PLUGIN_LOADS}}

# Force installation for benchmarking
zplug install < /dev/null
zplug load