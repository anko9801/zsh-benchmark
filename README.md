# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-07-30-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-07-30
- **Test Environment:** Ubuntu 24.04 (Docker on macOS 15.5), MacBook Pro (2020), Intel Core i5 2GHz (4 cores), 16GB RAM
- **Key Findings:**
  - zim が総合パフォーマンスで最高評価🥇
  - 25プラグイン環境では zim が最速 (30ms)
  - パフォーマンス差は最大 8.8倍
  - zim は最小構成で驚異的な速度 (30ms)

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
| 🥇 | zim | 30.0 | - |
| 🥈 | znap | 42.6 | +42.0% |
| 🥉 | zgenom | 44.0 | +46.5% |
| #4 | antigen | 100.6 | +235.4% |
| #5 | alf | 107.5 | +258.1% |
| #6 | zr | 108.2 | +260.5% |
| #7 | antigen-hs | 108.6 | +262.1% |
| #8 | zcomet | 110.1 | +266.8% |
| #9 | sheldon | 111.7 | +272.2% |
| #10 | antidote | 117.0 | +290.0% |
| #11 | prezto | 135.4 | +351.3% |
| #12 | oh-my-zsh | 156.1 | +420.4% |
| #13 | antibody | 165.8 | +452.7% |
| #14 | zplug | 330.3 | +1000.9% |
| #15 | zpm | 332.1 | +1006.8% |
| #16 | zinit | 462.9 | +1442.9% |

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
| 🥇 | antigen-hs | 0.0 | - |
| 🥈 | antigen | 0.0 | +24.8% |
| 🥉 | znap | 0.0 | +27.9% |
| #4 | zinit | 0.0 | +66.4% |
| #5 | zplug | 0.0 | +76.1% |
| #6 | alf | 0.0 | +78.4% |
| #7 | zcomet | 0.0 | +144.6% |
| #8 | zpm | 0.0 | +146.2% |
| #9 | zr | 0.0 | +218.8% |
| #10 | zgenom | 0.0 | +236.5% |
| #11 | antidote | 0.0 | +332.5% |
| #12 | antibody | 0.0 | +531.0% |
| #13 | sheldon | 0.2 | +2212.2% |
| #14 | zim | 1.5 | +19919.5% |

### Overall Performance

**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
|---|---|---:|
| 🥇 | zim | 24 |
| 🥈 | znap | 29 |
| 🥉 | zgenom | 30 |
| #4 | antigen | 53 |
| #5 | alf | 55 |
| #6 | zr | 55 |
| #7 | antigen-hs | 55 |
| #8 | zcomet | 57 |
| #9 | sheldon | 57 |
| #10 | antidote | 60 |
| #11 | antibody | 79 |
| #12 | zpm | 154 |
| #13 | zplug | 182 |
| #14 | zinit | 214 |

## 📦 Plugin Managers

| Plugin Manager | Stars | Version | Last Updated |
|---|---|---|---|
| zim | ![stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social) | ![Version](https://img.shields.io/github/v/tag/zimfw/zimfw?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zimfw/zimfw?style=flat&label=updated) |
| znap | ![stars](https://img.shields.io/github/stars/marlonrichert/zsh-snap?style=social) | ![Version](https://img.shields.io/github/v/tag/marlonrichert/zsh-snap?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/marlonrichert/zsh-snap?style=flat&label=updated) |
| zgenom | ![stars](https://img.shields.io/github/stars/jandamm/zgenom?style=social) | ![Version](https://img.shields.io/github/v/tag/jandamm/zgenom?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jandamm/zgenom?style=flat&label=updated) |
| antigen | ![stars](https://img.shields.io/github/stars/zsh-users/antigen?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/antigen?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/antigen?style=flat&label=updated) |
| alf | ![stars](https://img.shields.io/github/stars/psyrendust/alf?style=social) | ![Version](https://img.shields.io/github/v/tag/psyrendust/alf?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/psyrendust/alf?style=flat&label=updated) |
| zr | ![stars](https://img.shields.io/github/stars/jedahan/zr?style=social) | ![Version](https://img.shields.io/github/v/tag/jedahan/zr?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jedahan/zr?style=flat&label=updated) |
| antigen-hs | ![stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social) | ![Version](https://img.shields.io/github/v/tag/Tarrasch/antigen-hs?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/Tarrasch/antigen-hs?style=flat&label=updated) |
| zcomet | ![stars](https://img.shields.io/github/stars/agkozak/zcomet?style=social) | ![Version](https://img.shields.io/github/v/tag/agkozak/zcomet?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/agkozak/zcomet?style=flat&label=updated) |
| sheldon | ![stars](https://img.shields.io/github/stars/rossmacarthur/sheldon?style=social) | ![Version](https://img.shields.io/github/v/tag/rossmacarthur/sheldon?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/rossmacarthur/sheldon?style=flat&label=updated) |
| antidote | ![stars](https://img.shields.io/github/stars/mattmc3/antidote?style=social) | ![Version](https://img.shields.io/github/v/tag/mattmc3/antidote?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/mattmc3/antidote?style=flat&label=updated) |
| antibody | ![stars](https://img.shields.io/github/stars/getantibody/antibody?style=social) | ![Version](https://img.shields.io/github/v/tag/getantibody/antibody?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/getantibody/antibody?style=flat&label=updated) |
| zpm | ![stars](https://img.shields.io/github/stars/zpm-zsh/zpm?style=social) | ![Version](https://img.shields.io/github/v/tag/zpm-zsh/zpm?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zpm-zsh/zpm?style=flat&label=updated) |
| zplug | ![stars](https://img.shields.io/github/stars/zplug/zplug?style=social) | ![Version](https://img.shields.io/github/v/tag/zplug/zplug?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zplug/zplug?style=flat&label=updated) |
| zinit | ![stars](https://img.shields.io/github/stars/zdharma-continuum/zinit?style=social) | ![Version](https://img.shields.io/github/v/tag/zdharma-continuum/zinit?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zdharma-continuum/zinit?style=flat&label=updated) |

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
