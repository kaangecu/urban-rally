# Spec: Data model after Stage 2

Issue #65 (ticket A2). Later Stage 2 and 3 tickets link here. Login decisions 1 to 7 and plan answers 1 to 15 were accepted on 2026-10-24.

## Goal

One Firestore model that the app, `functions/` and the seed script share (`shared/schema.ts`, ticket A3). Players join through `joinTeam`, every write that matters is made by a function, and rules read membership and roles from the login token instead of extra document reads.

## Files

- `shared/schema.ts`: the types below, imported by `src/` and `functions/` (A3)
- `shared/converters.ts`: Firestore converters, `Timestamp` to `Date` in one place (A3)
- `firestore.rules`, `storage.rules`: switch from `team.uid` to token claims (B2, E1)

## Interfaces

All documents carry `tenantId`, `createdAt` and `updatedAt`. "Server" means written only by a function or the Admin SDK.

| Path | Fields | Written by | Read by |
| --- | --- | --- | --- |
| `tenants/{tenantId}` | `name`, `slug`, `logoUrl?`, `primaryColor`, `secondaryColor?`, `accentColor?`, `contactEmail?`, `website?`, `isActive` | staff (rules) | anyone |
| `events/{eventId}` | `name`, `description?`, `startDate`, `endDate`, `isActive`, `maxTeams?`, `maxTeamSize?` (default 6), `mapCenter`, `mapZoom`, `mapBounds?`, `leaderboardFrozen?` | staff (rules) | anyone |
| `tasks/{taskId}` | `eventId`, `title`, `description`, `type`, `imageUrl?`, `difficulty?`, `points`, `coordinates?`, `radius?`, `requiresPhoto`, `requiresVideo`, `requiresText`, `quizType?`, `quizOptions?`, `quizHint?`, `unlockAt?`, `expiresAt?`, `order?`, `isActive` | staff (rules) | signed-in players of the tenant |
| `tasks/{taskId}/private/answer` | `quizCorrectAnswer: string \| number`, `acceptedAnswers?: string[]` | staff | no client (C1) |
| `teams/{teamId}` | `eventId`, `accessCode`, `teamName?`, `memberCount`, `score`, `completedTaskIds`, `isActive` | server (codes, score); staff (name, rules) | members, staff |
| `teams/{teamId}/members/{uid}` | `teamId`, `displayName`, `email?`, `consentVersion`, `consentAt`, `joinedAt` | server on join; the member edits `displayName` and `email` | members of that team, staff |
| `submissions/{teamId}_{taskId}` | `eventId`, `taskId`, `teamId`, `submittedBy` (uid), `photoUrls?`, `videoUrl?`, `textResponse?`, `submittedLocation?` (`lat`, `lng`, `accuracy`), `status`, `pointsAwarded`, `reviewedBy?`, `reviewedAt?`, `reviewNotes?`, `submittedAt` | server (`submitTask`, review) | members, staff |
| `leaderboard/{eventId}/entries/{teamId}` | `teamName`, `score`, `tasksCompleted`, `lastUpdated` | server | anyone |
| `joinAttempts/{uid}` | `failures`, `windowStart` | server (`joinTeam` rate limit) | no client |

- `TaskType` is `'GPS' | 'PHOTO' | 'VIDEO' | 'QUIZ'`, one value per kind.
- Submission `status` is `'approved' | 'rejected'`. Photo and video score at once and an organiser can reject later, which takes the points back (answer 3). A wrong quiz answer writes nothing.
- The submission id `teamId_taskId` makes a second submit for the same task a no-op inside the `submitTask` transaction.
- `accessCode` is 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `0/O/1/I`). The join link is `/join/:code`.
- Rank is not stored. The client sorts entries by `score`, then `lastUpdated`.

### Token claims

| Claim | Set by | Meaning |
| --- | --- | --- |
| `teamId`, `tenantId` | `joinTeam` (B1) | player is a member of this team; never taken from the caller |
| `staffTenantId`, `staffRole: 'owner' \| 'organiser'` | grant script (E1) | staff of one tenant; a player token never carries these |

A player belongs to one team. A second `joinTeam` for another team is refused; only an organiser moves a player (decision 6).

### Dropped from `src/types/schema.ts`

| Removed | Reason |
| --- | --- |
| Task types `GPS_LOCATION`, `QR_CODE`, `SPONSORED`, `CHECKPOINT`, `WILDCARD` | v1 is GPS, photo, video and quiz only (answer 4); `GPS_LOCATION` was an alias |
| `InventoryItem`, `Team.inventory` | no shop or power-ups in v1 |
| `TaskHint`, `Task.hints` | paid hints dropped; the free `quizHint` stays |
| `Task.sponsorId`, `sponsorName`, `sponsorLogoUrl`, `requiresVideoAd`, `videoAdUrl` | sponsored tasks dropped |
| `Task.bonusPoints`, `Task.dependsOn` | nothing awards or enforces them |
| `CheckoutSession` | Stripe types, no payments in v1 |
| `Tenant.subscriptionTier`, `subscriptionExpiresAt` | billing is not in v1 |
| `Team.uid`, `displayName`, `email`, `profilePhotoUrl`, `consentGiven`, `teamDisplayName`, `lastKnownPosition` | one uid per team is replaced by members; personal data and consent move to the member document (B1, B2) |
| `Task.quizCorrectAnswer` on the task | moves to `private/answer` (C1) |
| `UserProfile`, `users/{uid}` | replaced by staff claims (E1) |
| `LeaderboardEntry.rank` | computed on the client |

A3 removes the dead rows (types, inventory, hints, sponsor, bonus, Stripe, billing). The moved fields go with the ticket that moves them.

## Out of scope

Migration: the dev project is reseeded (decision 7). Retention jobs (media 30 days, member data 90 days) are ticket I3. Invites (E3) are not in v1.

## End-to-end check

On the emulators after A5 and B3: `npm run seed:emulator`, open a printed `/join/:code` link at 390x844, join, and check in the Emulator UI that `teams/{id}/members/{uid}` exists and the team document holds no name, email or consent.
