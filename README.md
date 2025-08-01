# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-08-01-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-08-01
- **Test Environment:** Ubuntu 24.04 (Docker on GitHub Actions), 4 vCPUs, 16GB RAM
- **Key Findings:**
  - prezto が総合パフォーマンスで最高評価🥇
  - 25プラグイン環境では zim が最速 (95ms)
  - パフォーマンス差は最大 36.1倍

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| - | vanilla (no plugins) | 29.8ms | - |
| 🥇 | zim | 95.1ms | - |
| 🥈 | zgenom | 95.8ms | +0.7% |
| 🥉 | antigen | 100.8ms | +6.0% |
| #4 | alf | 110.0ms | +15.7% |
| #5 | antigen-hs | 114.2ms | +20.1% |
| #6 | zr | 117.1ms | +23.1% |
| #7 | sheldon | 120.7ms | +26.9% |
| #8 | antidote | 124.8ms | +31.2% |
| #9 | prezto | 141.6ms | +48.9% |
| #10 | znap | 142.4ms | +49.7% |
| #11 | antibody | 161.8ms | +70.2% |
| #12 | oh-my-zsh | 162.1ms | +70.5% |
| #13 | zcomet | 210.4ms | +121.3% |
| #14 | zpm | 348.4ms | +266.4% |
| #15 | zinit | 354.2ms | +272.5% |
| #16 | zplug | 3430.7ms | +3508.1% |

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
| --- | --- | ---: | ---: |
| 🥇 | znap | 1932.3ms | - |
| 🥈 | antigen | 5106.6ms | +164.3% |
| 🥉 | alf | 7653.7ms | +296.1% |
| #4 | zr | 7666.4ms | +296.7% |
| #5 | antigen-hs | 7880.9ms | +307.8% |
| #6 | zim | 7952.8ms | +311.6% |
| #7 | antidote | 8206.7ms | +324.7% |
| #8 | antibody | 8225.3ms | +325.7% |
| #9 | zpm | 9252.3ms | +378.8% |
| #10 | zgenom | 10436.6ms | +440.1% |
| #11 | zplug | 11679.4ms | +504.4% |
| #12 | sheldon | 12681.6ms | +556.3% |
| #13 | zinit | 32463.3ms | +1580.0% |
| - | oh-my-zsh | N/A | - |
| - | prezto | N/A | - |
| - | zcomet | N/A | - |

### Overall Performance

**Score Calculation**: `(Load Time / Load Time Average × 0.8) + (Install Time / Install Time Average × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
| --- | --- | ---: |
| 🥇 | antigen | 0.32 |
| 🥈 | znap | 0.35 |
| 🥉 | zim | 0.37 |
| #4 | alf | 0.39 |
| #5 | antigen-hs | 0.41 |
| #6 | zr | 0.41 |
| #7 | zgenom | 0.42 |
| #8 | antidote | 0.44 |
| #9 | sheldon | 0.52 |
| #10 | antibody | 0.52 |
| #11 | zpm | 0.95 |
| #12 | zinit | 1.42 |
| #13 | zplug | 7.76 |
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

_Generated by [zsh-benchmark](https://github.com/your-repo/zsh-benchmark) on 2025-08-01_