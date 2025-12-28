# completedTaskIds Array Safety Fix

## Problem
When a user joins a team, the team document from Firestore may not have the `completedTaskIds` field properly initialized as an array, causing runtime errors:
```
TypeError: completedTaskIds.includes is not a function
```

This occurred in multiple components when trying to access `team.completedTaskIds` without checking if it's an array.

## Root Cause
1. Team documents in Firestore might not have `completedTaskIds` initialized
2. The field could be `undefined` or have an unexpected type
3. Code was directly calling `.includes()` or `.length` without safety checks

## Solution
Added defensive checks throughout the codebase to safely handle `completedTaskIds`:

### Pattern Used
```typescript
// Instead of:
team.completedTaskIds.includes(taskId)

// Use:
const completedTaskIds = Array.isArray(team?.completedTaskIds) ? team.completedTaskIds : [];
completedTaskIds.includes(taskId)

// Or for length:
Array.isArray(team.completedTaskIds) ? team.completedTaskIds.length : 0
```

## Files Modified

### 1. Services
- **`src/services/task.service.ts`**
  - `getIncompleteTasks()` - Added safe array handling
  - `getCompletedTasks()` - Added safe array handling
  - `getTaskStats()` - Updated parameter type to accept `undefined`

### 2. Components
- **`src/features/tasks/TaskDetail.tsx`**
  - Added safe array extraction at component initialization
  - Uses local `completedTaskIds` variable throughout

- **`src/features/tasks/TaskList.tsx`**
  - Added safe array check in task card mapping
  - Passes safe array to service functions

- **`src/features/map/GameMap.tsx`**
  - Added safe array check in task marker rendering

- **`src/components/events/EventHeader.tsx`**
  - Added safe array check for task count display

- **`src/components/events/BrowseTeams.tsx`**
  - Added safe array check for completed tasks display

## Testing
After these fixes:
1. ✅ Users can join teams without crashes
2. ✅ Dashboard loads correctly with team data
3. ✅ Task lists render without errors
4. ✅ Map view displays tasks correctly
5. ✅ Team stats display safely (showing 0 if no tasks completed)

## Prevention
To prevent similar issues in the future:

1. **Always use Array.isArray()** before calling array methods
2. **Use optional chaining** for nested properties: `team?.completedTaskIds?.length`
3. **Provide defaults** when accessing potentially undefined arrays: `|| []`
4. **Update TypeScript types** to reflect optional fields where appropriate

## Related Files
- `src/types/schema.ts` - Team interface definition
- `scripts/seed-emulator.ts` - Team seeding ensures `completedTaskIds: []` is set
- `functions/src/index.ts` - Consider adding `completedTaskIds: []` when creating teams

## Next Steps
Consider adding a Firestore migration script to ensure all existing teams have `completedTaskIds` initialized as an empty array.

## Date Fixed
26 December 2025
