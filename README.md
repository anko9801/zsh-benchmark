# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-07-30-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-07-30
- **Test Environment:** Ubuntu 24.04 (Docker on macOS 15.5), MacBook Pro (2020), Intel Core i5 2GHz (4 cores), 16GB RAM
- **Key Findings:**
  - vanilla が総合パフォーマンスで最高評価🥇
  - 25プラグイン環境では zim が最速 (95ms)
  - パフォーマンス差は最大 63.2倍

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
| 🥇 | zim | 94.7 | - |
| 🥈 | zgenom | 102.5 | +8.2% |
| 🥉 | zcomet | 104.0 | +9.8% |
| #4 | antigen | 106.0 | +12.0% |
| #5 | alf | 109.6 | +15.7% |
| #6 | zr | 111.2 | +17.5% |
| #7 | sheldon | 112.8 | +19.1% |
| #8 | antigen-hs | 116.7 | +23.2% |
| #9 | antidote | 118.1 | +24.8% |
| #10 | prezto | 138.1 | +45.9% |
| #11 | znap | 138.1 | +45.9% |
| #12 | oh-my-zsh | 157.7 | +66.6% |
| #13 | antibody | 162.9 | +72.1% |
| #14 | zpm | 335.4 | +254.3% |
| #15 | zinit | 359.3 | +279.5% |
| #16 | zplug | 3524.0 | +3622.4% |

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
| 🥇 | znap | 1674.7 | - |
| 🥈 | antigen | 5009.4 | +199.1% |
| 🥉 | alf | 6089.5 | +263.6% |
| #4 | antigen-hs | 6093.9 | +263.9% |
| #5 | zr | 6324.8 | +277.7% |
| #6 | antibody | 6711.2 | +300.7% |
| #7 | zpm | 7504.5 | +348.1% |
| #8 | zim | 7851.5 | +368.8% |
| #9 | antidote | 8185.0 | +388.8% |
| #10 | zgenom | 8737.7 | +421.8% |
| #11 | sheldon | 11698.3 | +598.5% |
| #12 | zcomet | 11729.5 | +600.4% |
| #13 | zplug | 11733.6 | +600.6% |
| #14 | zinit | 31274.1 | +1767.5% |

### Overall Performance

**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
|---|---|---:|
| 🥇 | vanilla | 0.26 |
| 🥈 | znap | 0.87 |
| 🥉 | antigen | 1.03 |
| #4 | zr | 1.10 |
| #5 | antigen-hs | 1.11 |
| #6 | alf | 1.11 |
| #7 | zim | 1.17 |
| #8 | zgenom | 1.28 |
| #9 | antidote | 1.32 |
| #10 | antibody | 1.38 |
| #11 | zcomet | 1.51 |
| #12 | sheldon | 1.54 |
| #13 | zpm | 2.30 |
| #14 | zinit | 4.30 |
| #15 | zplug | 16.36 |

## 📦 Plugin Managers

| Plugin Manager | Stars | Version | Last Updated |
|---|---|---|---|
| vanilla | ![stars](https://img.shields.io/github/stars/zsh-users/zsh?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/zsh?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/zsh?style=flat&label=updated) |
| znap | ![stars](https://img.shields.io/github/stars/marlonrichert/zsh-snap?style=social) | ![Version](https://img.shields.io/github/v/tag/marlonrichert/zsh-snap?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/marlonrichert/zsh-snap?style=flat&label=updated) |
| antigen | ![stars](https://img.shields.io/github/stars/zsh-users/antigen?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/antigen?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/antigen?style=flat&label=updated) |
| zr | ![stars](https://img.shields.io/github/stars/jedahan/zr?style=social) | ![Version](https://img.shields.io/github/v/tag/jedahan/zr?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jedahan/zr?style=flat&label=updated) |
| antigen-hs | ![stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social) | ![Version](https://img.shields.io/github/v/tag/Tarrasch/antigen-hs?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/Tarrasch/antigen-hs?style=flat&label=updated) |
| alf | ![stars](https://img.shields.io/github/stars/psyrendust/alf?style=social) | ![Version](https://img.shields.io/github/v/tag/psyrendust/alf?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/psyrendust/alf?style=flat&label=updated) |
| zim | ![stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social) | ![Version](https://img.shields.io/github/v/tag/zimfw/zimfw?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zimfw/zimfw?style=flat&label=updated) |
| zgenom | ![stars](https://img.shields.io/github/stars/jandamm/zgenom?style=social) | ![Version](https://img.shields.io/github/v/tag/jandamm/zgenom?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jandamm/zgenom?style=flat&label=updated) |
| antidote | ![stars](https://img.shields.io/github/stars/mattmc3/antidote?style=social) | ![Version](https://img.shields.io/github/v/tag/mattmc3/antidote?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/mattmc3/antidote?style=flat&label=updated) |
| antibody | ![stars](https://img.shields.io/github/stars/getantibody/antibody?style=social) | ![Version](https://img.shields.io/github/v/tag/getantibody/antibody?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/getantibody/antibody?style=flat&label=updated) |
| zcomet | ![stars](https://img.shields.io/github/stars/agkozak/zcomet?style=social) | ![Version](https://img.shields.io/github/v/tag/agkozak/zcomet?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/agkozak/zcomet?style=flat&label=updated) |
| sheldon | ![stars](https://img.shields.io/github/stars/rossmacarthur/sheldon?style=social) | ![Version](https://img.shields.io/github/v/tag/rossmacarthur/sheldon?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/rossmacarthur/sheldon?style=flat&label=updated) |
| zpm | ![stars](https://img.shields.io/github/stars/zpm-zsh/zpm?style=social) | ![Version](https://img.shields.io/github/v/tag/zpm-zsh/zpm?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zpm-zsh/zpm?style=flat&label=updated) |
| zinit | ![stars](https://img.shields.io/github/stars/zdharma-continuum/zinit?style=social) | ![Version](https://img.shields.io/github/v/tag/zdharma-continuum/zinit?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zdharma-continuum/zinit?style=flat&label=updated) |
| zplug | ![stars](https://img.shields.io/github/stars/zplug/zplug?style=social) | ![Version](https://img.shields.io/github/v/tag/zplug/zplug?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zplug/zplug?style=flat&label=updated) |

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

_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark) on
2025-07-30_
