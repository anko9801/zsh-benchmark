export ZPLUG_HOME=$HOME/.zplug
source $ZPLUG_HOME/init.zsh
{{PLUGIN_LOADS}}
# zplug install should be conditional
if ! zplug check; then
    zplug install
fi
zplug load