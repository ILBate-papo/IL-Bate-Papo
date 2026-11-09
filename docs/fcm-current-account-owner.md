# FCM registration ownership routing

One current installation token exists under both IL (updated 2026-11-09 21:13 UTC) and a stale Leandro row (updated 2026-11-07). The 21:06:43 diagnostic rejection matches a call from IL to Leandro at 21:06:42, not evidence that an incoming call to IL lost its local account. The client guard correctly prevents ringing for another account, but stale registrations incorrectly fan out to that installation and overwrite the latest diagnostic record.

Before sending to an FCM subscription, the server now verifies that it is the most recently registered account row for that installation token. Multiple distinct phones on one account remain supported. Other apps and Web Push are unchanged. The FCM payload, native account checks, existing sender/recipient authorization, full-screen behavior and media code remain unchanged. No database rows are removed. No tokens or token-derived identifiers are logged. Conflicting account rows with identical latest timestamps are suppressed rather than choosing an arbitrary account.

All registrations are paginated, avoiding silent truncation at the Data API row cap. Errors retrieving ownership fail the request rather than risking delivery using stale ownership. Current ownership is routing evidence, not an authorization grant: the app's own account verification remains in place.

Validation: 13 ownership scenarios (including the observed POCO/Redmi/Mioko shape, distinct devices, account switching, ordering, invalid dates, conflicting ties, app isolation), existing FCM checks and TypeScript module syntax validation. The provider call payload is unchanged. No calls were sent during testing.

Limits: This removes a demonstrated duplicate routing problem. It does not prove the cause of delayed calls with the screen off and does not establish that Mioko has the same issue. A fresh diagnostic from the relevant receiving device is still required before claiming background delivery fixed.

Rollback: restore the exact push-notify v13 index.ts/fcm.ts. Existing device registrations and APK versions remain intact.
