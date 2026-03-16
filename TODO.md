# Timer Fix Progress

## Completed (2/8)
- [x] 1. Update Skribbl/backend/src/models/Room.ts: Add `turnEndTime: number = 0;` field and include in `getSafeguardedRoomState()`
- [x] 2. Update Skribbl/backend/src/models/Game.ts: Replace tick interval with timestamp logic

## Pending
- [x] 3. Update Skribbl/frontend/src/store/gameStore.ts: Extend RoomState with `turnEndTime?: number`
- [ ] 4. Update Skribbl/frontend/src/hooks/useGameSocket.ts: Handle 'timer_sync' event
- [x] 5. Update Skribbl/frontend/src/pages/Room.tsx: Compute and display client-side timeLeft
- [ ] 6. Test locally: Backend dev server + Frontend dev server
- [ ] 7. Backend: Add periodic sync emit every 5s during turn
- [ ] 8. Verify deployment/production behavior

**Next step after completion:** attempt_completion with demo command (e.g., open deployed site or local Room page).
