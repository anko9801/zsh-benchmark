export ZIM_HOME=~/.zim
# Source init.zsh if it exists (might be empty for benchmarking)
if [[ -f ${ZIM_HOME}/init.zsh ]]; then
    source ${ZIM_HOME}/init.zsh 2>/dev/null || true
fi