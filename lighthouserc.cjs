const BASE_URL = 'http://localhost:4173';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'localhost:4173',
      url: [`${BASE_URL}/`],
      numberOfRuns: 3,
      settings: {
        preset: process.env.LH_PRESET === 'desktop' ? 'desktop' : undefined,
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: `./lighthouse-reports/${process.env.LH_PRESET ?? 'mobile'}`,
    },
  },
};
