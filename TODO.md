# Skribbl Project TODO

## Current Task: Fix CORS Error
✅ **1. Edit backend/src/index.ts** - Set `allowedOrigins: true` ✓
✅ **2. Backend CORS fixed locally**

## Next Steps:
3. **Build & Deploy Backend**:
   ```
   cd Skribbl/backend
   npm run build
   # Deploy to Render (git push or dashboard)
   ```

4. **Test Connection**:
   - Load https://skribbl-2vbn.vercel.app → Create/Join Room
   - Check browser console: No CORS errors, socket connects
   - Verify real-time updates (chat, players, drawing)
   - Load https://skribbl-2vbn.vercel.app → Create/Join Room
   - Check browser console: No CORS errors, socket connects
   - Verify real-time updates (chat, players, drawing)

4. **Optional Improvements**:
   - Add env var support for specific origins in production
   - Rate limiting on socket events
   - Persistent rooms (Redis)

## Progress
- [x] Understand CORS issue
- [x] Edit backend CORS config
- [ ] Redeploy backend on Render
- [ ] Test production connection
