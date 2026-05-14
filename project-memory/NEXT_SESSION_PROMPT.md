# Next Session Prompt

## Current Progress
The entire project has been successfully migrated to a full TypeScript stack (Node/Express TS backend, Vite/React TSX frontend). The Authentication flow is fully complete from end to end: Backend APIs (Login/Refresh/Me), Database (Refresh Tokens table), and Frontend UI (Login Form, Zustand Store, Axios Interceptors, Protected Routes).

## Current Working Files
- `d:\VLTT\VLTT\frontend\src\pages\Login.tsx`
- `d:\VLTT\VLTT\frontend\src\App.tsx`

## Next Tasks
1. Build the main Dashboard Shell layout (Sidebar, Header, Content Area) for authenticated users.
2. Implement Role-Based Routing to show different Dashboard sidebars based on `user.vai_tro_id` (Khách hàng, Lễ tân, KTV, Admin).
3. Test the full Login flow by spinning up both frontend and backend servers.

## Unresolved Bugs
- None.

## Architecture Constraints
- Backend uses TypeScript, Express, and Raw SQL (`pg`).
- Frontend MUST use Zustand for state management (No Redux) and Axios for fetching.
- Always use high-quality modern design principles for the React UI.

## Agent Workflow Rules
- Every time a task or module is completed, check `git status`, auto run `git add .`, and `git commit` using Conventional Commits (e.g., `feat(auth): ...`, `chore(docker): ...`).
- Before ending any session, the Agent MUST explicitly ask the user: "Sếp có muốn tôi push toàn bộ code mới nhất lên GitHub không?".

## Recommended Next Action
Read this file, start both the frontend (`npm run dev`) and backend (`npm run dev`) servers, verify the Login UI works visually, and begin building the Dashboard Layout Shell.
