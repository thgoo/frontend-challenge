# Lighthouse summary

Medians of 3 runs per page and profile (`npm run lighthouse`), against the optimized build served by `vite preview` with the default mock scenario.

| Profile | Page | Runs | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mobile | / | 3 | 84 | 100 | 100 | 100 | 3.95 s | 0.000 | 119 ms | 2.27 s |
| mobile | /nfts/nft_001 | 3 | 83 | 100 | 100 | 100 | 3.89 s | 0.000 | 177 ms | 2.23 s |
| desktop | / | 3 | 98 | 100 | 100 | 100 | 1.10 s | 0.000 | 0 ms | 0.67 s |
| desktop | /nfts/nft_001 | 3 | 98 | 100 | 100 | 100 | 1.07 s | 0.000 | 0 ms | 0.70 s |

## Environment

- Lighthouse 12.6.1, run by @lhci/cli (see package.json)
- Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36
- Mobile: Lighthouse default (simulated slow 4G, 4x CPU slowdown); desktop: `desktop` preset
- Host: Linux 6.18.33.2-microsoft-standard-WSL2, AMD Ryzen 9 7950X 16-Core Processor, 32 cores
- Generated at 2026-10-31T14:59:37.566Z

HTML and JSON reports for every run are in `mobile/` and `desktop/`. Analysis: ARCHITECTURE.md.
