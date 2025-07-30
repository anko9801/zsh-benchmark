# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-07-30-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-07-30
- **Test Environment:** Ubuntu 24.04 (Docker on GitHub Actions), 4 vCPUs, 16GB RAM
- **Key Findings:**
  - vanilla が総合パフォーマンスで最高評価🥇
  - 25プラグイン環境では zgenom が最速 (92ms)
  - パフォーマンス差は最大 41.5倍

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| - | vanilla (no plugins) | 31.2ms | - |
| 🥇 | zgenom | 92.1ms | - |
| 🥈 | zim | 95.2ms | +3.3% |
| 🥉 | zcomet | 104.3ms | +13.2% |
| #4 | antigen | 106.0ms | +15.1% |
| #5 | alf | 111.5ms | +21.0% |
| #6 | antigen-hs | 111.7ms | +21.2% |
| #7 | zr | 113.7ms | +23.5% |
| #8 | sheldon | 115.6ms | +25.5% |
| #9 | antidote | 122.7ms | +33.2% |
| #10 | prezto | 137.4ms | +49.2% |
| #11 | znap | 142.5ms | +54.7% |
| #12 | oh-my-zsh | 162.4ms | +76.3% |
| #13 | antibody | 169.9ms | +84.5% |
| #14 | zpm | 349.2ms | +279.1% |
| #15 | zinit | 364.4ms | +295.5% |
| #16 | zplug | 3821.7ms | +4048.6% |

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| 🥇 | zcomet | 104.0ms | - |
| 🥈 | znap | 3341.4ms | +3114.3% |
| 🥉 | antigen | 5904.1ms | +5579.6% |
| #4 | zim | 8041.8ms | +7636.0% |
| #5 | antidote | 8816.9ms | +8381.7% |
| #6 | zplug | 12141.1ms | +11579.5% |
| #7 | zr | 14563.5ms | +13909.7% |
| #8 | alf | 14572.4ms | +13918.3% |
| #9 | antigen-hs | 14599.8ms | +13944.7% |
| #10 | antibody | 15144.8ms | +14468.9% |
| #11 | zpm | 16414.8ms | +15690.7% |
| #12 | sheldon | 18406.9ms | +17607.1% |
| #13 | zinit | 41436.7ms | +39761.2% |
| - | oh-my-zsh | N/A | - |
| - | prezto | N/A | - |

### Overall Performance

**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
| --- | --- | ---: |
| 🥇 | vanilla | 0.32 |
| 🥈 | zgenom | 0.99 |
| 🥉 | zcomet | 1.37 |
| #6 | znap | 8.26 |
| #7 | antigen | 14.19 |
| #8 | zim | 17.19 |
| #9 | antidote | 19.03 |
| #10 | zr | 30.35 |
| #11 | alf | 30.35 |
| #12 | antigen-hs | 30.41 |
| #13 | antibody | 31.99 |
| #14 | zpm | 37.20 |
| #15 | sheldon | 38.08 |
| #16 | zplug | 56.13 |
| #17 | zinit | 88.69 |
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

_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark) on 2025-07-30_