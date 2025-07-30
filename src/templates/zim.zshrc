export ZIM_HOME=${HOME}/.zim
# Source zimfw.zsh to make zimfw available
if [[ -f ${ZIM_HOME}/zimfw.zsh ]]; then
    source ${ZIM_HOME}/zimfw.zsh
fi

# Auto-install missing modules on first run
if [[ ! -d ${ZIM_HOME}/modules ]] || [[ -z "$(ls -A ${ZIM_HOME}/modules 2>/dev/null)" ]]; then
    zimfw install
fi

# Source init.zsh if it exists
if [[ -f ${ZIM_HOME}/init.zsh ]]; then
    source ${ZIM_HOME}/init.zsh 2>/dev/null || true
fi