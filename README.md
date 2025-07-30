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
  - 25プラグイン環境では zgenom が最速 (43ms)
  - パフォーマンス差は最大 24.7倍
=======
  - 25プラグイン環境では zgenom が最速 (45ms)
  - パフォーマンス差は最大 23.8倍
>>>>>>> Stashed changes

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
<<<<<<< Updated upstream
| 🥇 | zgenom | 43.4 | - |
| 🥈 | zim | 92.7 | +113.7% |
| 🥉 | antigen | 103.8 | +139.2% |
| #4 | zcomet | 104.3 | +140.5% |
| #5 | antigen-hs | 109.8 | +153.1% |
| #6 | alf | 110.9 | +155.6% |
| #7 | zr | 111.3 | +156.4% |
| #8 | sheldon | 111.6 | +157.2% |
| #9 | antidote | 119.3 | +174.9% |
| #10 | znap | 138.0 | +218.1% |
| #11 | prezto | 139.1 | +220.6% |
| #12 | oh-my-zsh | 157.6 | +263.3% |
| #13 | antibody | 165.3 | +281.1% |
| #14 | zpm | 339.8 | +683.3% |
| #15 | zinit | 358.1 | +725.5% |
| #16 | zplug | 874.7 | +1916.3% |
=======
| 🥇 | zgenom | 44.9 | - |
| 🥈 | zim | 93.7 | +108.7% |
| 🥉 | zcomet | 102.9 | +129.2% |
| #4 | antigen | 103.2 | +129.8% |
| #5 | zr | 110.2 | +145.5% |
| #6 | alf | 111.3 | +148.0% |
| #7 | sheldon | 114.9 | +155.8% |
| #8 | antigen-hs | 116.6 | +159.6% |
| #9 | antidote | 119.1 | +165.2% |
| #10 | prezto | 139.4 | +210.4% |
| #11 | znap | 140.4 | +212.7% |
| #12 | oh-my-zsh | 159.5 | +255.3% |
| #13 | antibody | 164.7 | +266.8% |
| #14 | zpm | 338.9 | +654.7% |
| #15 | zinit | 360.3 | +702.4% |
| #16 | zplug | 872.9 | +1843.9% |
>>>>>>> Stashed changes

### Installation Time Rankings

![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

| Rank | Plugin Manager | Time (ms) | vs Best |
|---|---|---:|---:|
<<<<<<< Updated upstream
| 🥇 | zgenom | 43.0 | - |
| 🥈 | zplug | 859.6 | +1898.4% |
| 🥉 | znap | 1841.8 | +4181.9% |
| #4 | antigen | 4013.7 | +9231.1% |
| #5 | zr | 5883.0 | +13576.9% |
| #6 | alf | 5898.6 | +13613.2% |
| #7 | antigen-hs | 5926.7 | +13678.5% |
| #8 | antibody | 6470.4 | +14942.4% |
| #9 | zpm | 7342.2 | +16969.1% |
| #10 | zim | 7844.8 | +18137.5% |
| #11 | antidote | 8123.2 | +18785.0% |
| #12 | zcomet | 11451.0 | +26521.4% |
| #13 | sheldon | 11548.6 | +26748.3% |
| #14 | zinit | 30939.0 | +71827.1% |
=======
| 🥇 | zgenom | 44.5 | - |
| 🥈 | zplug | 870.4 | +1854.0% |
| 🥉 | znap | 1782.3 | +3901.1% |
| #4 | antigen | 3768.2 | +8359.4% |
| #5 | zr | 5378.3 | +11973.9% |
| #6 | antigen-hs | 5389.1 | +11998.2% |
| #7 | alf | 5401.0 | +12024.9% |
| #8 | antibody | 5917.7 | +13184.9% |
| #9 | zpm | 6756.7 | +15068.3% |
| #10 | zim | 7836.0 | +17491.3% |
| #11 | antidote | 8092.5 | +18067.1% |
| #12 | zcomet | 10809.0 | +24165.5% |
| #13 | sheldon | 11432.6 | +25565.3% |
| #14 | zinit | 30714.7 | +68852.4% |
>>>>>>> Stashed changes

### Overall Performance

**Score Calculation**: `(Load Time × 0.8) + (Install Time × 0.2)` - Lower is better

| Rank | Plugin Manager | Score |
|---|---|---:|
<<<<<<< Updated upstream
| 🥇 | vanilla | 0.28 |
| 🥈 | zgenom | 0.34 |
| 🥉 | znap | 1.07 |
| #4 | antigen | 1.36 |
| #5 | alf | 1.59 |
| #6 | zr | 1.59 |
| #7 | antigen-hs | 1.59 |
| #8 | zim | 1.84 |
| #9 | antibody | 1.93 |
| #10 | antidote | 2.01 |
| #11 | zcomet | 2.47 |
| #12 | sheldon | 2.52 |
| #13 | zpm | 2.99 |
| #14 | zplug | 4.57 |
| #15 | zinit | 7.02 |
=======
| 🥇 | vanilla | 0.29 |
| 🥈 | zgenom | 0.35 |
| 🥉 | znap | 1.06 |
| #4 | antigen | 1.31 |
| #5 | zr | 1.49 |
| #6 | alf | 1.50 |
| #7 | antigen-hs | 1.52 |
| #8 | antibody | 1.83 |
| #9 | zim | 1.84 |
| #10 | antidote | 1.99 |
| #11 | zcomet | 2.34 |
| #12 | sheldon | 2.50 |
| #13 | zpm | 2.87 |
| #14 | zplug | 4.52 |
| #15 | zinit | 6.95 |
>>>>>>> Stashed changes

## 📦 Plugin Managers

| Plugin Manager | Stars | Version | Last Updated |
|---|---|---|---|
| vanilla | ![stars](https://img.shields.io/github/stars/zsh-users/zsh?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/zsh?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/zsh?style=flat&label=updated) |
| zgenom | ![stars](https://img.shields.io/github/stars/jandamm/zgenom?style=social) | ![Version](https://img.shields.io/github/v/tag/jandamm/zgenom?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jandamm/zgenom?style=flat&label=updated) |
| znap | ![stars](https://img.shields.io/github/stars/marlonrichert/zsh-snap?style=social) | ![Version](https://img.shields.io/github/v/tag/marlonrichert/zsh-snap?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/marlonrichert/zsh-snap?style=flat&label=updated) |
| antigen | ![stars](https://img.shields.io/github/stars/zsh-users/antigen?style=social) | ![Version](https://img.shields.io/github/v/tag/zsh-users/antigen?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zsh-users/antigen?style=flat&label=updated) |
| zr | ![stars](https://img.shields.io/github/stars/jedahan/zr?style=social) | ![Version](https://img.shields.io/github/v/tag/jedahan/zr?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/jedahan/zr?style=flat&label=updated) |
| alf | ![stars](https://img.shields.io/github/stars/psyrendust/alf?style=social) | ![Version](https://img.shields.io/github/v/tag/psyrendust/alf?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/psyrendust/alf?style=flat&label=updated) |
| antigen-hs | ![stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social) | ![Version](https://img.shields.io/github/v/tag/Tarrasch/antigen-hs?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/Tarrasch/antigen-hs?style=flat&label=updated) |
| antibody | ![stars](https://img.shields.io/github/stars/getantibody/antibody?style=social) | ![Version](https://img.shields.io/github/v/tag/getantibody/antibody?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/getantibody/antibody?style=flat&label=updated) |
| zim | ![stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social) | ![Version](https://img.shields.io/github/v/tag/zimfw/zimfw?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/zimfw/zimfw?style=flat&label=updated) |
| antidote | ![stars](https://img.shields.io/github/stars/mattmc3/antidote?style=social) | ![Version](https://img.shields.io/github/v/tag/mattmc3/antidote?include_prereleases&sort=semver&label=version&fallback=commit) | ![Last Update](https://img.shields.io/github/last-commit/mattmc3/antidote?style=flat&label=updated) |
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
