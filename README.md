# Zsh Plugin Manager Benchmark Results

![Deno](https://img.shields.io/badge/deno-1.46.0-black?logo=deno) ![License](https://img.shields.io/badge/license-MIT-blue) ![alf stars](https://img.shields.io/github/stars/psyrendust/alf?style=social&label=alf) ![antibody stars](https://img.shields.io/github/stars/getantibody/antibody?style=social&label=antibody) ![antidote stars](https://img.shields.io/github/stars/mattmc3/antidote?style=social&label=antidote) ![antigen stars](https://img.shields.io/github/stars/zsh-users/antigen?style=social&label=antigen)
![antigen-hs stars](https://img.shields.io/github/stars/Tarrasch/antigen-hs?style=social&label=antigen-hs) ![oh-my-zsh stars](https://img.shields.io/github/stars/ohmyzsh/ohmyzsh?style=social&label=oh-my-zsh) ![prezto stars](https://img.shields.io/github/stars/sorin-ionescu/prezto?style=social&label=prezto) ![sheldon stars](https://img.shields.io/github/stars/rossmacarthur/sheldon?style=social&label=sheldon) ![zcomet stars](https://img.shields.io/github/stars/agkozak/zcomet?style=social&label=zcomet) ![zgen stars](https://img.shields.io/github/stars/tarjoilija/zgen?style=social&label=zgen)
![zgenom stars](https://img.shields.io/github/stars/jandamm/zgenom?style=social&label=zgenom) ![zim stars](https://img.shields.io/github/stars/zimfw/zimfw?style=social&label=zim) ![zinit stars](https://img.shields.io/github/stars/zdharma-continuum/zinit?style=social&label=zinit) ![znap stars](https://img.shields.io/github/stars/marlonrichert/zsh-snap?style=social&label=znap) ![zplug stars](https://img.shields.io/github/stars/zplug/zplug?style=social&label=zplug) ![zpm stars](https://img.shields.io/github/stars/zpm-zsh/zpm?style=social&label=zpm)
![zr stars](https://img.shields.io/github/stars/jedahan/zr?style=social&label=zr)

![Benchmark Status](https://img.shields.io/badge/benchmark%20status-automated-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-2025-07-29-blue)

## 📊 Executive Summary

- **Benchmark Date:** 2025-07-29
- **Test Environment:** darwin , Deno 2.4.2
- **Key Findings:**
  - antidote が総合パフォーマンスで最高評価🥇
- 25プラグイン環境では antigen が最速 (35ms)
- パフォーマンス差は最大 11.5倍
- zim は最小構成で驚異的な速度 (34ms)

## 🏆 Performance Rankings (25 Plugins)

### Load Time Rankings

| Rank | Plugin Manager | Time (ms) | vs Best |
|------|----------------|-----------|---------|
| 🥇 | antigen | 35.16 | - |
| 🥈 | antidote | 37.48 | +6.6% |
| 🥉 | znap | 101.26 | +188.0% |
| #4 | zim | 121.79 | +246.3% |
| #5 | zgenom | 131.34 | +273.5% |
| #6 | zcomet | 142.41 | +305.0% |
| #7 | antigen-hs | 144.01 | +309.5% |
| #8 | sheldon | 154.25 | +338.6% |
| #9 | alf | 160.55 | +356.6% |
| #10 | zr | 171.31 | +387.2% |
| #11 | prezto | 198.09 | +463.3% |
| #12 | oh-my-zsh | 236.00 | +571.1% |
| #13 | antibody | 278.79 | +692.8% |
| #14 | zinit | 485.30 | +1280.1% |
| #15 | zpm | 526.62 | +1397.6% |
| #16 | zplug | 676.48 | +1823.7% |

### Installation Time Rankings

| Rank | Plugin Manager | Time (ms) | vs Best |
|------|----------------|-----------|---------|
| 🥇 | antidote | 32.52 | - |
| 🥈 | zim | 35.00 | +7.6% |
| 🥉 | zgenom | 124.47 | +282.7% |
| #4 | znap | 137.53 | +322.9% |
| #5 | antigen-hs | 146.19 | +349.5% |
| #6 | zr | 146.27 | +349.7% |
| #7 | zcomet | 148.67 | +357.1% |
| #8 | alf | 150.80 | +363.6% |
| #9 | prezto | 203.48 | +525.6% |
| #10 | antibody | 257.66 | +692.2% |
| #11 | oh-my-zsh | 351.95 | +982.1% |
| #12 | antigen | 395.00 | +1114.5% |
| #13 | zinit | 541.31 | +1564.3% |
| #14 | zpm | 564.46 | +1635.5% |
| #15 | sheldon | 569.00 | +1649.4% |
| #16 | zplug | 665.32 | +1945.6% |

### Overall Performance

| Rank | Plugin Manager | Score | Medal |
|------|----------------|-------|-------|
| #1 | antidote | 35.09 | 🥇 |
| #2 | zim | 65.54 | 🥈 |
| #3 | znap | 77.29 | 🥉 |
| #4 | zgenom | 81.10 | - |
| #5 | antigen-hs | 88.64 | - |
| #6 | zcomet | 90.84 | - |
| #7 | zr | 98.26 | - |
| #8 | alf | 98.48 | - |
| #9 | antigen | 142.86 | - |
| #10 | antibody | 155.26 | - |
| #11 | sheldon | 159.56 | - |
| #12 | prezto | 163.08 | - |
| #13 | oh-my-zsh | 226.04 | - |
| #14 | zinit | 280.97 | - |
| #15 | zpm | 302.62 | - |
| #16 | zplug | 404.93 | - |

## 📈 Detailed Comparison

| Plugin Manager | Stars | Install (25) | Load (25) | Install (0) | Load (0) |
|---|---|---|---|---|---|
| antigen | 0 | 395 | **35.16** | 394 | 34.88 |
| antidote | 0 | **33** | 37.48 | 34 | 34.36 |
| znap | 0 | 138 | 101.26 | 63 | 33.67 |
| zim | 0 | 35 | 121.79 | 38 | 34.18 |
| zgenom | 0 | 124 | 131.34 | **32** | 33.26 |
| zcomet | 0 | 149 | 142.41 | 37 | 37.65 |
| antigen-hs | 0 | 146 | 144.01 | 33 | **32.56** |
| sheldon | 0 | 569 | 154.25 | 54 | 34.65 |
| alf | 0 | 151 | 160.55 | 36 | 40.74 |
| zr | 0 | 146 | 171.31 | 33 | 32.71 |
| prezto | 0 | 203 | 198.09 | 150 | 116.57 |
| oh-my-zsh | 0 | 352 | 236.00 | 153 | 193.51 |
| antibody | 0 | 258 | 278.79 | 38 | 38.30 |
| zinit | 0 | 541 | 485.30 | 82 | 50.41 |
| zpm | 0 | 564 | 526.62 | 71 | 65.52 |
| zplug | 0 | 665 | 676.48 | 133 | 138.25 |

### Installation Time Comparison
![Installation Time Comparison](results/install-time-comparison-chart.svg)
_Plugin installation time comparison across different plugin managers_

### Load Time Comparison
![Load Time Comparison](results/load-time-comparison-chart.svg)
_Shell startup time comparison across different plugin managers_

## 📦 Version Information

![Deno](https://img.shields.io/badge/Deno-v2.4.2-black?logo=deno&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-v5.8.3-blue?logo=typescript&logoColor=white) ![V8](https://img.shields.io/badge/V8-v13.7.152.14--rusty-green?logo=v8&logoColor=white) ![OS](https://img.shields.io/badge/OS-macOS%20-lightgray?logo=apple&logoColor=white)

### Plugin Manager Versions


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
2025-07-29_
