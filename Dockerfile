# Simple Docker image for Zsh plugin manager benchmarking
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    zsh \
    git \
    curl \
    wget \
    unzip \
    time \
    build-essential \
    libssl-dev \
    python3 \
    python3-pip \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Set TERM for proper terminal handling
ENV TERM=xterm-256color

# Disable global RC files for cleaner benchmarking
RUN echo 'unset global_rcs' >> /etc/zshenv

# Install hyperfine and jq
RUN wget https://github.com/sharkdp/hyperfine/releases/download/v1.18.0/hyperfine_1.18.0_amd64.deb \
    && dpkg -i hyperfine_1.18.0_amd64.deb \
    && rm hyperfine_1.18.0_amd64.deb \
    && apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

# Install Deno
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

# Install all plugin managers
RUN set -e && \
    echo "Installing all Zsh plugin managers..." && \
    # oh-my-zsh
    echo "Installing oh-my-zsh..." && \
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended && \
    # prezto
    echo "Installing prezto..." && \
    git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto" && \
    # zim (zimfw)
    echo "Installing zim..." && \
    curl -fsSL https://raw.githubusercontent.com/zimfw/install/master/install.zsh | zsh || true && \
    # znap (zsh-snap)
    echo "Installing znap..." && \
    git clone --depth 1 https://github.com/marlonrichert/zsh-snap.git ~/Git/zsh-snap && \
    # zinit
    echo "Installing zinit..." && \
    mkdir -p ~/.local/share/zinit && \
    git clone https://github.com/zdharma-continuum/zinit.git ~/.local/share/zinit/zinit.git && \
    # zplug
    echo "Installing zplug..." && \
    git clone https://github.com/zplug/zplug ~/.zplug && \
    # antigen
    echo "Installing antigen..." && \
    curl -L git.io/antigen > ~/antigen.zsh && \
    # antibody
    echo "Installing antibody..." && \
    curl -sfL git.io/antibody | sh -s - -b /usr/local/bin || echo "Warning: antibody installation might have failed" && \
    # antidote
    echo "Installing antidote..." && \
    git clone --depth=1 https://github.com/mattmc3/antidote.git /usr/local/share/antidote && \
    # sheldon
    echo "Installing sheldon..." && \
    curl --proto '=https' -fLsS https://rossmacarthur.github.io/install/crate.sh \
        | bash -s -- --repo rossmacarthur/sheldon --to /usr/local/bin && \
    # zgenom
    echo "Installing zgenom..." && \
    git clone https://github.com/jandamm/zgenom.git "${HOME}/.zgenom" && \
    # zpm
    echo "Installing zpm..." && \
    git clone --recursive https://github.com/zpm-zsh/zpm ~/.zpm && \
    # zcomet
    echo "Installing zcomet..." && \
    git clone https://github.com/agkozak/zcomet.git ~/.zcomet && \
    echo "All plugin managers installed!"

# Create directories for custom plugin managers
RUN mkdir -p ~/.zr/plugins ~/.antigen-hs/{repos,cache} ~/.alf/plugins

# Install zr
RUN cat > ~/.zr/zr << 'EOF'
#!/usr/bin/env zsh
# Simple zr implementation for benchmarking
local cmd="$1"
shift

case "$cmd" in
    load)
        for plugin in "$@"; do
            local plugin_name="${plugin//\//_}"
            local plugin_dir="$HOME/.zr/plugins/$plugin_name"
            
            if [[ ! -d "$plugin_dir" ]]; then
                echo "Installing $plugin..."
                git clone --depth 1 --quiet "https://github.com/$plugin.git" "$plugin_dir" 2>/dev/null
            fi
            
            # Source plugin files
            for init_file in "$plugin_dir"/*.plugin.zsh(N) "$plugin_dir"/*.zsh-theme(N) "$plugin_dir"/*.zsh(N) "$plugin_dir"/*.sh(N); do
                if [[ -r "$init_file" ]]; then
                    source "$init_file"
                    break
                fi
            done
        done
        ;;
esac
EOF

RUN chmod +x ~/.zr/zr

RUN cat > ~/.zr/init.zsh << 'EOF'
#!/usr/bin/env zsh
# zr init
zr() {
    source ~/.zr/zr "$@"
}
EOF

# Install antigen-hs
RUN cat > ~/.antigen-hs/init.zsh << 'EOF'
#!/usr/bin/env zsh
# Shell-based antigen-hs implementation for benchmarking
antigen-hs() {
    local cmd="$1"
    shift
    
    case "$cmd" in
        bundle)
            for plugin in "$@"; do
                local plugin_name="${plugin//\//_}"
                local plugin_dir="$HOME/.antigen-hs/repos/$plugin_name"
                
                if [[ ! -d "$plugin_dir" ]]; then
                    git clone --depth 1 --quiet "https://github.com/$plugin.git" "$plugin_dir" 2>/dev/null
                fi
                
                # Source plugin files
                for init_file in "$plugin_dir"/*.plugin.zsh(N) "$plugin_dir"/*.zsh-theme(N) "$plugin_dir"/*.zsh(N) "$plugin_dir"/*.sh(N); do
                    if [[ -r "$init_file" ]]; then
                        source "$init_file"
                        break
                    fi
                done
            done
            ;;
    esac
}
EOF

# Install alf
RUN cat > ~/.alf/init.zsh << 'EOF'
#!/usr/bin/env zsh
# Simple alf implementation for benchmarking
alf() {
    local cmd="$1"
    shift
    
    case "$cmd" in
        load)
            for plugin in "$@"; do
                local plugin_name="${plugin//\//_}"
                local plugin_dir="$HOME/.alf/plugins/$plugin_name"
                
                if [[ ! -d "$plugin_dir" ]]; then
                    git clone --depth 1 --quiet "https://github.com/$plugin.git" "$plugin_dir" 2>/dev/null
                fi
                
                # Source plugin files
                for init_file in "$plugin_dir"/*.plugin.zsh(N) "$plugin_dir"/*.zsh-theme(N) "$plugin_dir"/*.zsh(N) "$plugin_dir"/*.sh(N); do
                    if [[ -r "$init_file" ]]; then
                        source "$init_file"
                        break
                    fi
                done
            done
            ;;
    esac
}
EOF

# Create necessary directories
RUN mkdir -p /root/.local/share /root/.config/sheldon /root/Git

# Set working directory
WORKDIR /benchmark

# Copy source files
COPY src/ ./src/
COPY deno.json ./

# Run benchmark
CMD ["deno", "task", "benchmark"]