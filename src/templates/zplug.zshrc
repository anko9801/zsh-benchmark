export ZPLUG_HOME=$HOME/.zplug
source $ZPLUG_HOME/init.zsh

# Configure zplug to avoid hanging
export ZPLUG_CLONE_DEPTH=1
export ZPLUG_THREADS=2
export ZPLUG_USE_CACHE=false
export ZPLUG_PROTOCOL=HTTPS

{{PLUGIN_LOADS}}

# Install only if needed, with non-interactive mode
if ! zplug check >/dev/null 2>&1; then
    zplug install --verbose < /dev/null
fi
zplug load --verbose