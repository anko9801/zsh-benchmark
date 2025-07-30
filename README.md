# Zsh Plugin Manager Benchmark Results

![License](https://img.shields.io/badge/license-MIT-blue)
![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-07-30-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-07-30
- **Test Environment:** Ubuntu 24.04 (Docker on macOS 15.5), MacBook Pro (2020), Intel Core i5 2GHz (4 cores), 16GB RAM
- **Key Findings:**
  - vanilla が総合パフォーマンスで最高評価🥇
<<<<<<< Updated upstream
  - 25プラグイン環境では zim が最速 (92ms)
  - パフォーマンス差は最大 20.7倍
=======
  - 25プラグイン環境では zim が最速 (93ms)
  - パフォーマンス差は最大 20.1倍
>>>>>>> Stashed changes

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
<<<<<<< Updated upstream
| 🥇 | zim | 92.3 | - |
| 🥈 | zgenom | 93.5 | +1.2% |
| 🥉 | antigen | 102.1 | +10.6% |
| #4 | zcomet | 102.6 | +11.1% |
| #5 | zr | 110.0 | +19.2% |
| #6 | antigen-hs | 110.6 | +19.8% |
| #7 | alf | 111.0 | +20.3% |
| #8 | sheldon | 113.6 | +23.0% |
| #9 | antidote | 118.5 | +28.3% |
| #10 | znap | 137.4 | +48.8% |
| #11 | prezto | 138.8 | +50.3% |
| #12 | oh-my-zsh | 155.9 | +68.8% |
| #13 | antibody | 163.1 | +76.6% |
| #14 | zpm | 341.0 | +269.3% |
| #15 | zinit | 357.0 | +286.6% |
| #16 | zplug | 885.6 | +859.0% |
=======
| 🥇 | zim | 93.2 | - |
| 🥈 | zgenom | 93.9 | +0.7% |
| 🥉 | antigen | 103.2 | +10.7% |
| #4 | zcomet | 103.8 | +11.3% |
| #5 | zr | 110.0 | +18.0% |
| #6 | antigen-hs | 110.1 | +18.1% |
| #7 | alf | 110.6 | +18.7% |
| #8 | sheldon | 113.8 | +22.0% |
| #9 | antidote | 120.2 | +29.0% |
| #10 | prezto | 138.1 | +48.2% |
| #11 | znap | 140.5 | +50.7% |
| #12 | oh-my-zsh | 158.4 | +70.0% |
| #13 | antibody | 164.7 | +76.7% |
| #14 | zpm | 338.7 | +263.4% |
| #15 | zinit | 356.6 | +282.6% |
| #16 | zplug | 865.5 | +828.5% |
>>>>>>> Stashed changes

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
<<<<<<< Updated upstream
| 🥇 | zplug | 872.3 | - |
| 🥈 | zgenom | 1793.1 | +105.6% |
| 🥉 | znap | 1912.6 | +119.3% |
| #4 | antigen | 3813.1 | +337.1% |
| #5 | antigen-hs | 5415.0 | +520.8% |
| #6 | zr | 5437.3 | +523.3% |
| #7 | alf | 5572.7 | +538.9% |
| #8 | antibody | 6252.1 | +616.7% |
| #9 | zpm | 6869.5 | +687.5% |
| #10 | zim | 7840.3 | +798.8% |
| #11 | antidote | 8081.7 | +826.5% |
| #12 | zcomet | 10901.4 | +1149.7% |
| #13 | sheldon | 11418.3 | +1209.0% |
| #14 | zinit | 30879.4 | +3440.0% |
=======
| 🥇 | zplug | 873.0 | - |
| 🥈 | znap | 1896.9 | +117.3% |
| 🥉 | antigen | 4044.9 | +363.3% |
| #4 | alf | 6114.2 | +600.3% |
| #5 | antigen-hs | 6117.5 | +600.7% |
| #6 | zr | 6617.6 | +658.0% |
| #7 | antibody | 6643.9 | +661.0% |
| #8 | zpm | 7501.3 | +759.2% |
| #9 | zim | 7924.2 | +807.7% |
| #10 | antidote | 8108.7 | +828.8% |
| #11 | zgenom | 8507.0 | +874.4% |
| #12 | sheldon | 11703.0 | +1240.5% |
| #13 | zcomet | 11935.9 | +1267.2% |
| #14 | zinit | 31325.3 | +3488.1% |
>>>>>>> Stashed changes

### Overall Performance

**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
|---|---|---:|
<<<<<<< Updated upstream
| 🥇 | vanilla | 0.26 |
| 🥈 | zgenom | 0.75 |
| 🥉 | znap | 0.97 |
| #4 | antigen | 1.09 |
| #5 | zr | 1.23 |
| #6 | antigen-hs | 1.23 |
| #7 | alf | 1.25 |
| #8 | zim | 1.45 |
| #9 | antibody | 1.57 |
| #10 | antidote | 1.60 |
| #11 | zcomet | 1.83 |
| #12 | sheldon | 1.95 |
| #13 | zpm | 2.53 |
| #14 | zplug | 4.45 |
| #15 | zinit | 5.44 |
=======
| 🥇 | vanilla | 0.27 |
| 🥈 | znap | 0.97 |
| 🥉 | antigen | 1.11 |
| #4 | alf | 1.31 |
| #5 | antigen-hs | 1.32 |
| #6 | zr | 1.37 |
| #7 | zim | 1.46 |
| #8 | zgenom | 1.51 |
| #9 | antidote | 1.60 |
| #10 | antibody | 1.61 |
| #11 | zcomet | 1.95 |
| #12 | sheldon | 1.97 |
| #13 | zpm | 2.57 |
| #14 | zplug | 4.32 |
| #15 | zinit | 5.46 |
>>>>>>> Stashed changes

## 📦 Plugin Managers

| Plugin Manager | Stars | Version | Last Updated |
|---|---|---|---|
| vanilla | ![stars](https://img.shields.io/github/stars/zsh-users/zsh?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/zsh?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/zsh?style=flat&label=updated) |
| znap | ![stars](https://img.shields.io/github/stars/marlonrichert/zsh-snap?style=social) | ![Version](https://img.shields.io/github/v/tag/marlonrichert/zsh-snap?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/marlonrichert/zsh-snap?style=flat&label=updated) |
| antigen | ![stars](https://img.shields.io/github/stars/zsh-users/antigen?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/antigen?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/antigen?style=flat&label=updated) |
<<<<<<< Updated upstream
| zr | ![stars](https://img.shields.io/github/stars/jedahan/zr?style=social) | ![Version](https://img.shields.io/github/v/tag/jedahan/zr?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jedahan/zr?style=flat&label=updated) |
| antigen-hs | ![stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social) | ![Version](https://img.shields.io/github/v/tag/Tarrasch/antigen-hs?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/Tarrasch/antigen-hs?style=flat&label=updated) |
| alf | ![stars](https://img.shields.io/github/stars/psyrendust/alf?style=social) | ![Version](https://img.shields.io/github/v/tag/psyrendust/alf?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/psyrendust/alf?style=flat&label=updated) |
| zim | ![stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social) | ![Version](https://img.shields.io/github/v/tag/zimfw/zimfw?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zimfw/zimfw?style=flat&label=updated) |
| antibody | ![stars](https://img.shields.io/github/stars/getantibody/antibody?style=social) | ![Version](https://img.shields.io/github/v/tag/getantibody/antibody?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/getantibody/antibody?style=flat&label=updated) |
=======
| alf | ![stars](https://img.shields.io/github/stars/psyrendust/alf?style=social) | ![Version](https://img.shields.io/github/v/tag/psyrendust/alf?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/psyrendust/alf?style=flat&label=updated) |
| antigen-hs | ![stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social) | ![Version](https://img.shields.io/github/v/tag/Tarrasch/antigen-hs?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/Tarrasch/antigen-hs?style=flat&label=updated) |
| zr | ![stars](https://img.shields.io/github/stars/jedahan/zr?style=social) | ![Version](https://img.shields.io/github/v/tag/jedahan/zr?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jedahan/zr?style=flat&label=updated) |
| zim | ![stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social) | ![Version](https://img.shields.io/github/v/tag/zimfw/zimfw?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zimfw/zimfw?style=flat&label=updated) |
| zgenom | ![stars](https://img.shields.io/github/stars/jandamm/zgenom?style=social) | ![Version](https://img.shields.io/github/v/tag/jandamm/zgenom?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jandamm/zgenom?style=flat&label=updated) |
>>>>>>> Stashed changes
| antidote | ![stars](https://img.shields.io/github/stars/mattmc3/antidote?style=social) | ![Version](https://img.shields.io/github/v/tag/mattmc3/antidote?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/mattmc3/antidote?style=flat&label=updated) |
| antibody | ![stars](https://img.shields.io/github/stars/getantibody/antibody?style=social) | ![Version](https://img.shields.io/github/v/tag/getantibody/antibody?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/getantibody/antibody?style=flat&label=updated) |
| zcomet | ![stars](https://img.shields.io/github/stars/agkozak/zcomet?style=social) | ![Version](https://img.shields.io/github/v/tag/agkozak/zcomet?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/agkozak/zcomet?style=flat&label=updated) |
| sheldon | ![stars](https://img.shields.io/github/stars/rossmacarthur/sheldon?style=social) | ![Version](https://img.shields.io/github/v/tag/rossmacarthur/sheldon?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/rossmacarthur/sheldon?style=flat&label=updated) |
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
