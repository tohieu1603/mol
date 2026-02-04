# Next.js 15 Dashboard Research

## App Router Architecture (Server-First)

Next.js 15 App Router prioritizes server rendering with minimal client JS. Key pattern: Server Components fetch data → pass to Client Components for interactivity. Nested layouts provide persistent shells across child routes; state persists during navigation within same layout.

**Layout structure**: Root Layout (HTML scaffold, global styles, providers) → Nested Layouts per section (e.g., `/app/dashboard/layout.tsx`) → Page routes. This keeps navigation performant and enables fine-grained caching.

## shadcn/ui Integration

**Setup**: `npx shadcn@latest init` configures Tailwind CSS v3/v4, TypeScript, App Router. Full React 19 support enabled. Add components via `npx shadcn@latest add button` (copies component into `components/ui/`—not node_modules, so fully customizable).

**npm React 19 caveat**: Use `--legacy-peer-deps` flag. pnpm/yarn/bun handle deps without friction. Components compose naturally with Server Components (shadcn Button, Card, etc. are default unstyled and work in any context).

## Express API Connection Pattern

**Flow**: Next.js API Route (middleware/handler) acts as proxy. Client sends request → Next.js API → Express backend. Store JWT in HttpOnly Cookie on client (XSS-safe). Request includes cookie; middleware extracts and forwards to Express.

**Why proxy**: Keeps Express URL hidden from client; centralizes auth logic. Example: POST `/api/auth/login` forwards to Express `/auth/login`, receives JWT, sets HttpOnly cookie, returns user data.

**Token lifecycle**: Login returns access_token + refresh_token. Store access in memory or short-lived cookie; refresh token in HttpOnly cookie (long-lived). Middleware refreshes on demand before upstream call.

## JWT State Management (No Redux Needed)

**Recommended approach**: Use Context + Server Actions (not Redux).

- **Server-side**: `getToken()` from middleware validates JWT; no client-side storage of sensitive data.
- **Client-side**: React Context with `useContext()` for user/auth state (fetched server-side via Server Action). On page load, Server Component calls Action to fetch user → passes to Client Component.
- **Middleware**: Place in `middleware.ts` (root level). Validates JWT on every request; redirects unauthorized users before page loads.

**Implementation**: No external state lib needed. Leverage Next.js Server Actions + middleware for auth; Context for UI-local state (sidebar open/close, theme).

## Security Checklist

- JWT in HttpOnly cookie (not localStorage).
- Short-lived access tokens (15–60 min); refresh tokens longer-lived.
- Middleware validates on every route; blocks unauthorized early.
- CORS configured on Express (allow Next.js origin only).
- Verify JWT signatures; never trust client-supplied tokens.

## Template Baseline

Official Next.js 15 ACME Dashboard (GitHub) + Horizon UI Next.js Admin Template offer production patterns. Both use App Router, shadcn/ui (or Chakra UI), and server-first data fetching.

---

**Unresolved**: Does project require NextAuth.js vs. custom middleware? Official guidance supports both; choice depends on provider complexity (OAuth/SSO vs. basic JWT).

Sources:
- [Next.js Dashboard Learning Guide](https://nextjs.org/learn/dashboard-app)
- [Next.js 15 App Router Advanced Patterns 2026](https://medium.com/@beenakumawat002/next-js-app-router-advanced-patterns-for-2026-server-actions-ppr-streaming-edge-first-b76b1b3dcac7)
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next)
- [Next.js 15 + React 19 shadcn/ui](https://ui.shadcn.com/docs/react-19)
- [JWT Auth with Next.js 15 & Express](https://medium.com/@fakhri.chusaini01/implementing-jwt-authentication-in-next-js-15-and-express-js-caea1730c5ce)
- [NextJS SSR JWT with External Backend](https://thewidlarzgroup.com/nextjs-auth/)
- [Best Practices: JWT in Next.js 15](https://www.wisp.blog/blog/best-practices-in-implementing-jwt-in-nextjs-15)
- [Next.js Guides: Authentication](https://nextjs.org/docs/pages/guides/authentication)
