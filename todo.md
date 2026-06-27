# Nova Dashboard TODO

## Phase 1: Schema, Design System, Layout
- [x] Extend drizzle schema: tenants, call_logs, appointments, services, providers, knowledge_base, team_members
- [x] Apply DB migrations
- [x] Set up luxury spa design tokens in index.css (colors, fonts, shadows)
- [x] Add Google Fonts (Cormorant Garamond + Inter)
- [x] Build NovaSidebar component with branding and 6 nav links
- [x] Build NovaLayout wrapper used by all dashboard pages
- [x] Wire App.tsx routes for all 6 pages + login

## Phase 2: Overview + Call Logs
- [x] Build Overview page with 6 KPI cards + sparklines
- [x] Build tRPC procedures: metrics.getOverview
- [x] Build Call Logs page with full table
- [x] Build CallTranscriptDrawer component
- [x] Build tRPC procedures: callLogs.list
- [x] Real-time subscription animation for new call log entries

## Phase 3: Appointments, Knowledge Base, Settings, Team
- [x] Build Appointments page with status filter tabs
- [x] Build tRPC procedures: appointments.list
- [x] Build Knowledge Base page with FAQ editor + document upload
- [x] Build tRPC procedures: knowledge.list, knowledge.upsert, knowledge.delete
- [x] Build Settings page with all 6 sections
- [x] Build tRPC procedures: settings.getTenant, settings.updateTenant, settings.getServices, settings.getProviders
- [x] Build Team page with user list + invite flow + role management
- [x] Build tRPC procedures: team.list, team.invite, team.updateRole, team.revoke

## Phase 4: Auth + Seed Data
- [x] Login page with Nova branding
- [x] Protected route guard (redirect unauthenticated users)
- [x] Seed Serenity Aesthetics demo data
- [x] Tenant-scoped RLS on all tRPC procedures

## Phase 5: Polish + Delivery
- [x] Smooth fade/slide animations on all page transitions
- [x] Loading skeletons on all data tables
- [x] Empty states on all sections
- [x] Vitest coverage for core procedures (12 tests passing)
- [x] Final checkpoint + delivery
