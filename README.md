# Milestone calculator

A Next.js application for calculating production milestones. Canonical repo: `xzibit-apps/milestone-calculator` (renamed from `jnebauer/production-milestone-calculator` in Sprint D Wave 1, 2026-04-18).

## Tech Stack

- **Next.js 15.5.4** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React 19** - UI library

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
milestone-calculator/
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.js
├── eslint.config.mjs
└── .gitignore
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
