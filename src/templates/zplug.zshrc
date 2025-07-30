export ZPLUG_HOME=$HOME/.zplug
source $ZPLUG_HOME/init.zsh
{{PLUGIN_LOADS}}
# Always run install (zplug check causes issues)
zplug install
zplug load