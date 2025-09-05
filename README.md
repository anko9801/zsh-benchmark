# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-09-05-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-09-05
- **Test Environment:** Ubuntu 24.04 (Docker on GitHub Actions), 4 vCPUs, 16GB RAM
- **Key Findings:**
  - prezto が総合パフォーマンスで最高評価🥇
  - 25プラグイン環境では zgenom が最速 (96ms)
  - パフォーマンス差は最大 38.1倍

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| - | vanilla (no plugins) | 29.8ms | - |
| 🥇 | zgenom | 95.6ms | - |
| 🥈 | zim | 97.9ms | +2.4% |
| 🥉 | antigen | 106.0ms | +10.8% |
| #4 | alf | 107.1ms | +12.0% |
| #5 | zr | 110.8ms | +15.8% |
| #6 | antigen-hs | 111.8ms | +16.9% |
| #7 | sheldon | 116.7ms | +22.0% |
| #8 | antidote | 122.3ms | +27.8% |
| #9 | prezto | 146.3ms | +53.0% |
| #10 | znap | 147.2ms | +53.9% |
| #11 | oh-my-zsh | 163.4ms | +70.8% |
| #12 | antibody | 167.4ms | +75.0% |
| #13 | zpm | 358.7ms | +275.0% |
| #14 | zinit | 377.6ms | +294.8% |
| #15 | zcomet | 936.9ms | +879.6% |
| #16 | zplug | 3642.4ms | +3708.5% |

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| 🥇 | znap | 3721.4ms | - |
| 🥈 | antigen | 5949.5ms | +59.9% |
| 🥉 | zim | 8439.4ms | +126.8% |
| #4 | antidote | 10370.9ms | +178.7% |
| #5 | zplug | 13164.5ms | +253.8% |
| #6 | zr | 14846.3ms | +298.9% |
| #7 | antigen-hs | 14855.1ms | +299.2% |
| #8 | alf | 15041.1ms | +304.2% |
| #9 | antibody | 15685.2ms | +321.5% |
| #10 | sheldon | 16204.2ms | +335.4% |
| #11 | zpm | 16818.0ms | +351.9% |
| #12 | zgenom | 18699.7ms | +402.5% |
| #13 | zinit | 41657.9ms | +1019.4% |
| - | oh-my-zsh | N/A | - |
| - | prezto | N/A | - |
| - | zcomet | N/A | - |

### Overall Performance

**Score Calculation**: `(Load Time / Load Time Average × 0.8) + (Install Time / Install Time Average × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
| --- | --- | ---: |
| 🥇 | antigen | 0.28 |
| 🥈 | zim | 0.30 |
| 🥉 | znap | 0.33 |
| #4 | antidote | 0.37 |
| #5 | alf | 0.40 |
| #6 | zr | 0.41 |
| #7 | antigen-hs | 0.41 |
| #8 | zgenom | 0.43 |
| #9 | sheldon | 0.43 |
| #10 | antibody | 0.52 |
| #11 | zpm | 0.90 |
| #12 | zinit | 1.26 |
| #13 | zplug | 7.02 |
| - | oh-my-zsh | N/A |
| - | prezto | N/A |
| - | zcomet | N/A |

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

_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark) on 2025-09-05_