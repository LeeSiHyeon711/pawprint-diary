import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        primary: 'var(--primary)',
        'primary-deep': 'var(--primary-deep)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        tagbg: 'var(--tag-bg)',
        borderc: 'var(--border)',
      },
      borderRadius: {
        card: '16px',
        input: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,.05)',
        soft: '0 2px 8px rgba(0,0,0,.04)',
      },
      fontFamily: {
        pretendard: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
