# Incoming call alert candidate 1.1.7

Mioko diagnostic: FCM sent 2026-11-09 23:48:52; received 23:49:05, high original/delivered priority, screen off. The APK recorded its native call service active at receipt. Hangup was stored at 23:49:15. This demonstrates that a call arrived before termination; it does not prove the notification audibly rang or that Android opened the full-screen activity.

The native call builder previously set FLAG_ONLY_ALERT_ONCE, even though the foreground service reuses notification ID 1002 across calls. The candidate clears that flag for new calls, allowing sound/vibration when Android updates an existing service notification. Existing per-call visibility checks still suppress duplicate offers; service lifetime and cancellation are unchanged. Notification channels, silence/DND preferences, account authorization, FCM sending, web assets and media are unchanged.

This is a device-test candidate, not a proven fix. It does not remove the observed 13-second FCM delivery delay. It must first be tested only on Mioko's POCO; preserve the working Redmi installation.

The local diagnostic now includes actual channel importance, sound/vibration settings, ringer mode, ring volume and current interruption filter. It also fixes the stale 1.1.4 popup title. These values are read only and remain local; no token, caller name or message content is logged.

Checks: existing native lifecycle and receipt regression suite, plus tests that a new call can alert despite foreground ID reuse while a duplicate visible offer does not restart the service. Signed APK and bundled-asset equality checked before delivery. Physical validation pending.

References:
https://developer.android.com/reference/android/app/Notification.Builder#setOnlyAlertOnce(boolean)
https://developer.android.com/reference/android/app/Notification#FLAG_ONLY_ALERT_ONCE
