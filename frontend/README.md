## Tech Stack

- **Framework**: React 18.3 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Chakra UI v2 + Emotion
- **State Management**: Zustand v5 (client state) + TanStack Query v5 (server state)
- **Routing**: React Router DOM v7
- **Charts & Maps**: ECharts v6 (echarts-for-react)
- **HTTP Client**: Axios
- **Internationalisation**: i18next + react-i18next (English & Hindi)
- **CSV Parsing**: PapaParse
- **Animations**: Framer Motion
- **Icons**: React Icons v5
- **Code Quality**: ESLint 9 + Prettier 3 + Husky + lint-staged
- **Testing**: Jest 30 + React Testing Library 16

## Prerequisites

- Node.js 18+ and npm

## Setup Instructions

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

3. **Build for production**:

   ```bash
   npm run build
   ```

4. **Preview production build**:

   ```bash
   npm run preview
   ```

5. **Lint code**:

   ```bash
   npm run lint
   ```

6. **Run tests**:

   ```bash
   npm run test
   ```

7. **Format code**:
   ```bash
   npm run format
   ```

## Project Structure

```
frontend/
├── src/
│   ├── app/                # App-level config (router, store, theme, i18n, providers)
│   ├── assets/             # Images, SVGs, downloadable templates
│   ├── config/             # Runtime & server config
│   ├── features/           # Feature-based modules
│   │   ├── auth/           # Login, signup, activate, profile
│   │   ├── dashboard/      # Dashboard charts, KPI cards, tables
│   │   ├── section-officer/# Section Officer panel
│   │   ├── state-admin/    # State Admin panel
│   │   └── super-admin/    # Super Admin panel
│   ├── locales/            # i18n translations (en, hi)
│   ├── shared/             # Reusable components, hooks, utils, constants, lib
│   ├── test/               # Test utilities & shared providers
│   └── types/              # Global TypeScript type declarations
└── public/                 # Static assets
```

## Path Aliases

The project uses path aliases for cleaner imports:

- `@/*` → `./src/*`
- `@/app/*` → `./src/app/*`
- `@/features/*` → `./src/features/*`
- `@/shared/*` → `./src/shared/*`
- `@/assets/*` → `./src/assets/*`

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules (automatically checked on commit via Husky)
- Format code with Prettier (automatically formatted on commit)
- Use functional components with hooks
- Follow feature-based folder structure
- No `any` without explicit isolation and a TODO comment

### Git Hooks

Husky is configured to run lint-staged on commits. Only files in the `frontend/` folder will be checked.

### API Configuration

Update the base URL in:

- `src/shared/lib/axios.ts`
- Or set `API_BASE_URL`

### State Management

- **Zustand**: Use for client-side state only (auth session, cross-route UI state)
- **TanStack Query**: Use for all server state (API data, caching, invalidation)
- Do not store server state in Zustand

### Internationalisation

Translations live in `src/locales/{en,hi}/`. Each panel has its own namespace:

- `common.json` — shared strings (sidebar, etc.)
- `dashboard.json`
- `section-officer.json`
- `state-admin.json`
- `super-admin.json`

### Routing

Routes are defined in `src/app/router/routes.tsx`. Role-based access is enforced via guards in `src/shared/components/routing/`. Role constants live in `src/shared/constants/auth.ts`.

### Testing

- Co-locate test files next to the module under test (`*.test.tsx` / `*.test.ts`)
- Use `renderWithProviders` from `@/test/render-with-providers` for components needing React Query or Router context
- Target ≥ 80% coverage on new feature code; aim for 100% on services and utils
