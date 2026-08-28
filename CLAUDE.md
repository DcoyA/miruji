# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**미루지말자 (miruji)** — a Korean-language, mobile-first "mission diary" app where a group (family / friends) shares tasks, and completing tasks earns points that are spent on rewards. Built as a Next.js web app that is also shipped to the App Store / Play Store by wrapping the deployed site in Capacitor.

## Commands

```bash
npm run dev      # next dev (local development)
npm run build    # next build
npm start        # next start (serve production build)
```

- **No test, lint, or typecheck script is configured.** `tsconfig.json` has `strict: false` and `noEmit: true`; there is no ESLint config despite `eslint-disable` comments in the code.
- Native builds (Android AAB/APK, iOS IPA) run on **Codemagic** (`codemagic.yaml`), triggered by pushes. The `android/` and `ios/` folders are generated on the CI runner via `npx cap add …` and are not committed.
- Package manager: npm. `next` is pinned to `latest`; React is pinned to `19.1.1`.

## Capacitor packaging model

`capacitor.config.ts` sets `server.url` to the live Vercel deployment (`https://miruji-omega.vercel.app`) and `webDir: "public"`. The native app is a thin WebView that loads the **remote** site — it does not bundle a static export. Practical consequence: shipping a change to users = deploy to Vercel; a native rebuild is only needed for native config/icon/plugin changes.

## Architecture

### Backend = Supabase, entirely

There is no custom server. All data, auth, file storage, and realtime go through Supabase.

- `lib/supabase/client.ts` — browser client (anon key). Used by every hook/component.
- `lib/supabase/admin.ts` — service-role client. **Server-only**, used exclusively by `app/api/**/route.ts`. Never import it into a `"use client"` file.
- The DB schema, RLS policies, and Postgres functions live in the Supabase project, **not in this repo**. Code calls these RPCs — treat them as an external contract:
  `is_username_available`, `accept_workspace_invite`, `get_invite_preview`, `transfer_workspace_ownership`, `is_premium`, `get_member_balances`, `generate_recurring_tasks`, `rollover_overdue_tasks`.
- Storage buckets: `avatars`, `task-evidence` (both served via public URLs).
- Tables referenced: `profiles`, `workspaces`, `workspace_members`, `workspace_invites`, `tasks`, `task_templates`, `rewards`, `reward_transactions`, `device_tokens`.

Schema notes / gotchas:

- **`workspace_members` has no unique constraint on `(workspace_id, profile_id)`** — it should. Because of this, a member who leaves (`status` set to `removed`/`left`) and is then re-invited produces a **duplicate row** instead of reactivating the existing one. This is a known bug; code that resolves "my membership" (e.g. `currentMember` in `useWorkspace`) can pick the wrong row when duplicates exist.
- **`tasks` has a `trg_enforce_task_update` trigger** that enforces update permissions. Running a plain `UPDATE` on `tasks` from the Supabase SQL editor fails with a permission error — mutate via the app / an RPC, or disable the trigger for the session if you truly need a raw fix.
- **`accept_workspace_invite` (Postgres RPC)** is what actually processes an accepted invite (creates/links the membership). Its **virtual-member merge logic needs improvement** — when an invitee corresponds to an existing virtual (`is_virtual`) member, it does not cleanly merge the account into that member.

### Client state: one page, four hooks

`app/page.tsx` is the whole application (a large client component). It composes four hooks and threads their values/callbacks into presentational components:

| Hook | Owns |
|------|------|
| `features/auth/useAuth.ts` | Supabase session, `profile`, sign in/up/out, password change, avatar upload, account deletion |
| `features/workspace/useWorkspace.ts` | workspace list + selection, members, invites, **and the shared arrays** `tasks` / `templates` / `rewards` / `rewardTransactions`, member balances, realtime subscription |
| `features/tasks/useTasks.ts` | task/template CRUD, submit/approve/reject, reordering, reward granting — receives the setters from `useWorkspace` |
| `features/rewards/useRewards.ts` | reward CRUD, redeem request/confirm/reject |

`useWorkspace` is the source of truth for task/reward data; `useTasks` and `useRewards` mutate it through injected `setTasks`/`setRewards`/`setRewardTransactions`. `loadWorkspaceData(workspaceId)` re-fetches everything for the active workspace and month, and a realtime channel calls it on any `postgres_changes` across the six workspace tables.

> `app/page.tsx` contains several **duplicated JSX blocks** (e.g. `ProfileSettingsPanel` is rendered from three separate branches, two of them identical). When editing that file, check whether a change needs to be applied in more than one place.

### Auth model (username, not email)

Users sign in with a **username**, which is deterministically mapped to a fake email `"<username>@users.miruji.app"` for Supabase email/password auth. An optional real `recovery_email` is stored on `profiles`.

Password reset is **manual / human-in-the-loop**: `POST /api/account/request-password-reset` looks the user up with the admin client and emails the operator via **Gmail SMTP (nodemailer)** using `GMAIL_USER` / `GMAIL_APP_PASSWORD`. There is no automated reset link from the app itself. `app/auth/reset` and `app/auth/callback` handle Supabase's own recovery/confirmation links if configured.

`app/auth/page.tsx` is a **separate, standalone** auth screen with its own logic, distinct from `features/auth/useAuth.ts` (which is what `app/page.tsx` actually uses). Don't assume changing one affects the other.

### Domain rules baked into the client

- **Roles**: `owner` > `manager` > `member`. `isManager = role === "owner" || "manager"`. Managers can add "virtual" members (`is_virtual`, no account).
- **Task status**: `todo` → `submitted` → `approved` / `rejected`; plus `rolled_over` and `missed` (see `lib/labels.ts`). Approving/completing a task inserts an `earn` row into `reward_transactions`; redeeming a reward inserts a `spend` row. Balances are computed server-side (`get_member_balances`), never summed on the client for correctness.
- **Verification types**: `none` / `text` / `photo` / `video` / `audio`. Non-`none` tasks require evidence (text string or a file uploaded to `task-evidence`).
- **Free vs premium plan** (`is_premium` RPC on the workspace creator): free = max 3 members + only the last 30 days of tasks/transactions are loaded; premium = max 100 members, full history.
- **Recurring tasks**: creating a task with `repeat_type` `daily`/`weekly` creates a `task_templates` row, then calls `generate_recurring_tasks()`. `rollover_overdue_tasks()` carries unfinished tasks forward.

### Invite flow

`/join?code=XXXX` (`app/join/`) stores the code in `localStorage["miruji_pending_invite_code"]` and redirects to `/`. On load, `useWorkspace` detects the pending code, previews it via `get_invite_preview`, and shows `IncomingInviteCard`; accepting calls `accept_workspace_invite`.

### Web push

`lib/push.ts` registers `public/sw.js`, subscribes with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, and upserts the subscription into `device_tokens`. Sending pushes is done outside this repo.

## Conventions

- **Path alias**: `@/*` → repo root (no `src/` directory). Feature code lives in `features/<domain>/`, shared UI in `components/`, non-React helpers in `lib/`, shared types in `types/app.ts` (+ `lib/types.ts`).
- **Styling**: almost entirely inline `CSSProperties` objects (often `const fooStyle: CSSProperties = …` or `function fooStyle(x): CSSProperties` at the bottom of the file). Global CSS is only `app/globals.css`; `features/home/styles.ts` holds shared style objects for the home screen. Pretendard font is loaded from a CDN in `globals.css`.
- **UI language is Korean.** User-facing strings, `setMessage(...)` text, and `window.confirm(...)` prompts are all Korean; match that.
- Mutation functions in hooks generally return `{ ok: boolean, text: string }` and also call `setMessage`. Follow that pattern for new actions.
- **Layout**: fixed centered mobile frame (`.app-shell-frame` in `globals.css`), rendered via `components/Shell.tsx`. Design for a phone-width viewport.

## Environment variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server), `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` (server). No `.env.example` is committed.

## Known issues / open work

- **Safe-area handling** — insets (notch / home indicator / status bar) are not fully handled across screens; layout uses `env(safe-area-inset-*)` in `globals.css` only in a few places.
- **KakaoTalk in-app browser deep links** — opening an invite link (`/join?code=…`) inside the KakaoTalk in-app browser doesn't reliably hand off to the app.
- **Nickname change permission** — changing a member's `display_name` (nickname) is not properly permission-restricted.
- **Native push notifications** — only web push (`lib/push.ts` + `public/sw.js`) exists; native (APNs / FCM via Capacitor) is not implemented.
- **Apple Sign-In** — not implemented (required for App Store review when other social login exists).
- Plus the `workspace_members` duplicate-row bug and the `accept_workspace_invite` virtual-member merge weakness described under **Backend = Supabase**.

## Git workflow

Work happens on `dev`; PRs go to `main`. Many commits are single-file edits made through the GitHub web UI ("Update X.tsx", "Add files via upload").

## Deployment workflow (dev vs production)

Two environments, kept strictly separate:

| | Git branch | Supabase project | project-ref |
|---|---|---|---|
| **dev** (default working target) | `dev` | `miruji-dev` | `icbaykoidbmazvsbjmmq` |
| **production** | `main` | `miruji` | `qutnpjhfsdqrqckdovgx` |

**On dev, the following may proceed without asking the user:**

- `git pull` to update the `dev` branch.
- Editing code and `git push` to `dev`. **Always** run `git branch --show-current` first and confirm it is `dev` before pushing.
- Confirm the linked Supabase project with `supabase projects list`; if it is not `miruji-dev`, re-link with `supabase link --project-ref icbaykoidbmazvsbjmmq`.
- Writing new migration files into `supabase/migrations/` and applying them to dev with `supabase db push`.

**Production (`main` / `miruji` / `qutnpjhfsdqrqckdovgx`) is never touched automatically:**

- Never run `git push` to `main` or `supabase db push` against production automatically.
- After changes are verified on dev (local `npm run build` succeeds, the affected screens work), hand the user the exact commands needed for the production deploy (git commands, `supabase link` / `supabase db push`, etc.) verbatim — the user runs them.
- While linked to the production ref (`qutnpjhfsdqrqckdovgx`), never run any `supabase db push` / `db pull`. Always check the current link with `supabase projects list` before running any db command.

**Before every `git push`:** verify the staged/committed files contain no secrets — `.env.local`, the service-role key, access tokens, etc.
