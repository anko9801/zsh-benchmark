export ZIM_HOME=${HOME}/.zim
# Source zimfw.zsh to make zimfw available
if [[ -f ${ZIM_HOME}/zimfw.zsh ]]; then
    source ${ZIM_HOME}/zimfw.zsh
fi
# Source init.zsh if it exists
if [[ -f ${ZIM_HOME}/init.zsh ]]; then
    source ${ZIM_HOME}/init.zsh 2>/dev/null || true
fi