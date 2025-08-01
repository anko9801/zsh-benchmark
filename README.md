# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-08-01-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-08-01
- **Test Environment:** Ubuntu 24.04 (Docker on GitHub Actions), 4 vCPUs, 16GB RAM
- **Key Findings:**
  - vanilla が総合パフォーマンスで最高評価🥇
  - 25プラグイン環境では zgenom が最速 (95ms)
  - パフォーマンス差は最大 37.4倍

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| - | vanilla (no plugins) | 30.8ms | - |
| 🥇 | zgenom | 94.6ms | - |
| 🥈 | zim | 94.6ms | +0.0% |
| 🥉 | antigen | 105.8ms | +11.9% |
| #4 | zr | 111.1ms | +17.5% |
| #5 | alf | 111.6ms | +18.0% |
| #6 | antigen-hs | 119.4ms | +26.3% |
| #7 | sheldon | 122.6ms | +29.7% |
| #8 | antidote | 127.5ms | +34.9% |
| #9 | prezto | 140.3ms | +48.3% |
| #10 | znap | 141.6ms | +49.7% |
| #11 | oh-my-zsh | 161.1ms | +70.4% |
| #12 | antibody | 166.6ms | +76.2% |
| #13 | zcomet | 215.8ms | +128.2% |
| #14 | zpm | 344.2ms | +264.1% |
| #15 | zinit | 361.7ms | +282.5% |
| #16 | zplug | 3540.8ms | +3644.8% |

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| 🥇 | znap | 2322.7ms | - |
| 🥈 | antigen | 5191.8ms | +123.5% |
| 🥉 | antigen-hs | 7724.3ms | +232.6% |
| #4 | zr | 7802.0ms | +235.9% |
| #5 | alf | 7866.3ms | +238.7% |
| #6 | zim | 7884.4ms | +239.4% |
| #7 | antidote | 8289.6ms | +256.9% |
| #8 | antibody | 8414.9ms | +262.3% |
| #9 | zpm | 9302.6ms | +300.5% |
| #10 | zgenom | 10367.0ms | +346.3% |
| #11 | zplug | 12295.4ms | +429.3% |
| #12 | sheldon | 12753.4ms | +449.1% |
| #13 | zinit | 32965.0ms | +1319.2% |
| - | oh-my-zsh | N/A | - |
| - | prezto | N/A | - |
| - | zcomet | N/A | - |

### Overall Performance

**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
| --- | --- | ---: |
| 🥇 | vanilla | 0.32 |
| #4 | znap | 6.21 |
| #5 | antigen | 12.77 |
| #6 | antigen-hs | 16.71 |
| #7 | zr | 16.81 |
| #8 | zim | 16.87 |
| #9 | alf | 16.94 |
| #10 | antidote | 17.99 |
| #11 | antibody | 18.54 |
| #12 | zgenom | 21.82 |
| #13 | zpm | 22.53 |
| #14 | sheldon | 26.82 |
| #15 | zplug | 54.17 |
| #16 | zinit | 71.79 |
| - | oh-my-zsh | N/A |
| - | prezto | N/A |

## 📦 Plugin Managers

| Plugin Manager | Stars | Version | Last Updated |
| --- | --- | --- | --- |
| vanilla | ![stars](https://img.shields.io/github/stars/zsh-users/zsh?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/zsh?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/zsh?style=flat&label=updated) |
| oh-my-zsh | ![stars](https://img.shields.io/github/stars/ohmyzsh/ohmyzsh?style=social) | ![Version](https://img.shields.io/github/v/tag/ohmyzsh/ohmyzsh?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/ohmyzsh/ohmyzsh?style=flat&label=updated) |
| prezto | ![stars](https://img.shields.io/github/stars/sorin-ionescu/prezto?style=social) | ![Version](https://img.shields.io/github/v/tag/sorin-ionescu/prezto?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/sorin-ionescu/prezto?style=flat&label=updated) |
| zim | ![stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social) | ![Version](https://img.shields.io/github/v/tag/zimfw/zimfw?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zimfw/zimfw?style=flat&label=updated) |
| znap | ![stars](https://img.shields.io/github/stars/marlonrichert/zsh-snap?style=social) | ![Version](https://img.shields.io/github/v/tag/marlonrichert/zsh-snap?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/marlonrichert/zsh-snap?style=flat&label=updated) |
| zinit | ![stars](https://img.shields.io/github/stars/zdharma-continuum/zinit?style=social) | ![Version](https://img.shields.io/github/v/tag/zdharma-continuum/zinit?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zdharma-continuum/zinit?style=flat&label=updated) |
| zplug | ![stars](https://img.shields.io/github/stars/zplug/zplug?style=social) | ![Version](https://img.shields.io/github/v/tag/zplug/zplug?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zplug/zplug?style=flat&label=updated) |
| antigen | ![stars](https://img.shields.io/github/stars/zsh-users/antigen?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/antigen?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/antigen?style=flat&label=updated) |
| antibody | ![stars](https://img.shields.io/github/stars/getantibody/antibody?style=social) | ![Version](https://img.shields.io/github/v/tag/getantibody/antibody?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/getantibody/antibody?style=flat&label=updated) |
| antidote | ![stars](https://img.shields.io/github/stars/mattmc3/antidote?style=social) | ![Version](https://img.shields.io/github/v/tag/mattmc3/antidote?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/mattmc3/antidote?style=flat&label=updated) |
| sheldon | ![stars](https://img.shields.io/github/stars/rossmacarthur/sheldon?style=social) | ![Version](https://img.shields.io/github/v/tag/rossmacarthur/sheldon?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/rossmacarthur/sheldon?style=flat&label=updated) |
| zgenom | ![stars](https://img.shields.io/github/stars/jandamm/zgenom?style=social) | ![Version](https://img.shields.io/github/v/tag/jandamm/zgenom?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jandamm/zgenom?style=flat&label=updated) |
| zpm | ![stars](https://img.shields.io/github/stars/zpm-zsh/zpm?style=social) | ![Version](https://img.shields.io/github/v/tag/zpm-zsh/zpm?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zpm-zsh/zpm?style=flat&label=updated) |
| zr | ![stars](https://img.shields.io/github/stars/jedahan/zr?style=social) | ![Version](https://img.shields.io/github/v/tag/jedahan/zr?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jedahan/zr?style=flat&label=updated) |
| antigen-hs | ![stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social) | ![Version](https://img.shields.io/github/v/tag/Tarrasch/antigen-hs?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/Tarrasch/antigen-hs?style=flat&label=updated) |
| zcomet | ![stars](https://img.shields.io/github/stars/agkozak/zcomet?style=social) | ![Version](https://img.shields.io/github/v/tag/agkozak/zcomet?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/agkozak/zcomet?style=flat&label=updated) |
| alf | ![stars](https://img.shields.io/github/stars/psyrendust/alf?style=social) | ![Version](https://img.shields.io/github/v/tag/psyrendust/alf?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/psyrendust/alf?style=flat&label=updated) |

## 📝 Methodology

Benchmarks were performed using:

- **Tool:** hyperfine (statistical benchmarking tool)
- **Iterations:** 10 runs per test
- **Plugin Sets:** 0 plugins (baseline) and 25 plugins (typical setup)
- **Metrics:** Installation time and shell startup time
- **Environment:** Clean installation for each test

## 🤝 Contributing

Found an issue or want to add your plugin manager? Please open an issue or PR!

---

_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark) on 2025-08-01_