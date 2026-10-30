// Builds lighthouse-reports/SUMMARY.md with the median of each category and metric per page and
// profile, plus the tool versions and environment of the run.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = 'lighthouse-reports';
const PROFILES = ['mobile', 'desktop'];
const METRICS = [
  ['largest-contentful-paint', 'LCP', (value) => `${(value / 1000).toFixed(2)} s`],
  ['cumulative-layout-shift', 'CLS', (value) => value.toFixed(3)],
  ['total-blocking-time', 'TBT', (value) => `${Math.round(value)} ms`],
  ['first-contentful-paint', 'FCP', (value) => `${(value / 1000).toFixed(2)} s`],
];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const rows = [];
let meta;
for (const profile of PROFILES) {
  const dir = path.join(ROOT, profile);
  const reports = readdirSync(dir)
    .filter((file) => file.endsWith('.report.json'))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')));
  meta ??= reports[0];
  const byPage = Map.groupBy(reports, (report) => new URL(report.finalDisplayedUrl).pathname);
  for (const [page, runs] of byPage) {
    const score = (id) => Math.round(median(runs.map((run) => run.categories[id].score * 100)));
    rows.push([
      profile,
      page,
      runs.length,
      score('performance'),
      score('accessibility'),
      score('best-practices'),
      score('seo'),
      ...METRICS.map(([id, , format]) =>
        format(median(runs.map((run) => run.audits[id].numericValue))),
      ),
    ]);
  }
}

const header = [
  'Profile',
  'Page',
  'Runs',
  'Performance',
  'Accessibility',
  'Best Practices',
  'SEO',
  ...METRICS.map(([, label]) => label),
];
const table = [header, header.map(() => '---'), ...rows]
  .map((row) => `| ${row.join(' | ')} |`)
  .join('\n');

writeFileSync(
  path.join(ROOT, 'SUMMARY.md'),
  `# Lighthouse summary

Medians of ${String(rows[0]?.[2] ?? 0)} runs per page and profile (\`npm run lighthouse\`), against the optimized build served by \`vite preview\` with the default mock scenario.

${table}

## Environment

- Lighthouse ${meta.lighthouseVersion}, run by @lhci/cli (see package.json)
- ${meta.environment.hostUserAgent}
- Mobile: Lighthouse default (simulated slow 4G, 4x CPU slowdown); desktop: \`desktop\` preset
- Host: ${os.type()} ${os.release()}, ${os.cpus()[0]?.model ?? 'unknown CPU'}, ${String(os.cpus().length)} cores
- Generated at ${new Date(meta.fetchTime).toISOString()}

HTML and JSON reports for every run are in \`mobile/\` and \`desktop/\`. Analysis: ARCHITECTURE.md.
`,
);
console.log(`Wrote ${path.join(ROOT, 'SUMMARY.md')}`);
