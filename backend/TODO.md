# Task: Add configurable FRONTEND_URL to backend for dev/prod

## Steps:
1. [x] Create Skribbl/backend/.env with FRONTEND_URL=https://skribbl-2vbn.vercel.app and ALLOWED_ORIGINS
2. [x] Update Skribbl/backend/src/index.ts CORS config to use process.env.ALLOWED_ORIGINS.split(',')
3. [x] Test backend startup and CORS
4. [ ] Verify socket connection from external frontend

Progress: CORS config complete, TS errors fixed. Backend ready for dev/prod with FRONTEND_URL in .env.
