# Rift Rarity — Security Specification

## 1. Data Invariants
1. **Verified Identity Ownership**: Only authenticated users with verified emails (`request.auth.token.email_verified == true`) may create leaderboard entries or increment answer statistics. `leaderboard_entries.uid` must equal `request.auth.uid`.
2. **Immutable Score Submissions**: Leaderboard entries are append-only (`update` and `delete` are denied) so players cannot alter submitted points or ranks retroactively.
3. **Bounded Score & Progress Ranges**: `score` must be an integer `0 <= score <= 25000`; `progress` must be `0 <= progress <= 100`; `summonerName` must be `1..32` characters.
4. **Monotonic Answer Frequency Counters**: Creating an `answer_stats` document requires `pickCount == 1`. Updating an `answer_stats` document strictly enforces `incoming().pickCount == existing().pickCount + 1` and locks `questionId`, `answerId`, and `isPublic` as immutable.
5. **Server Timestamp Enforcement**: `createdAt` and `updatedAt` must equal `request.time`.
6. **Public Query Guard**: `allow list` rules explicitly verify `resource.data.isPublic == true` so private/non-public documents can never be listed.

## 2. Dirty Dozen Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Leaderboard Create**: Creating `/leaderboard_entries/test1` when `request.auth == null`.
2. **Unverified Email Write**: Creating `/leaderboard_entries/test2` with `email_verified == false`.
3. **UID Spoofing**: Creating `/leaderboard_entries/test3` where `uid != request.auth.uid`.
4. **Shadow Field Injection**: Creating `/leaderboard_entries/test4` with an extra field `isAdmin: true`.
5. **Score Overflow Poisoning**: Creating `/leaderboard_entries/test5` with `score: 9999999`.
6. **Fake Client Timestamp**: Creating `/leaderboard_entries/test6` with a hardcoded past `createdAt` instead of `request.time`.
7. **Oversized Document ID**: Creating `/leaderboard_entries/${'a'.repeat(200)}`.
8. **Scoreboard Tampering**: Updating an existing `/leaderboard_entries/{id}` to raise `score`.
9. **Private Flag Bypass**: Creating `/leaderboard_entries/test9` with `isPublic: false` or listing without `where('isPublic', '==', true)`.
10. **Answer Stat Counter Jump**: Creating `/answer_stats/q1__Yasuo` with `pickCount: 500` instead of `1`.
11. **Answer Stat Arbitrary Decrement/Set**: Updating `/answer_stats/q1__Yasuo` with `pickCount: 0` or `pickCount: existing.pickCount + 50`.
12. **Answer Stat Cross-Question Hijack**: Updating `/answer_stats/q1__Yasuo` while changing `questionId` or `answerId`.
