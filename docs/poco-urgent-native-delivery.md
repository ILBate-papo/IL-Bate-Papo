# POCO urgent native delivery pilot

Status: awaiting physical-device delivery and cancellation verification. This is not an APK release or a proven latency fix.

The provider accepted the last ordinary system notification about two seconds after call creation, but the owner reported a long delay and no full-screen answering controls. Ordinary notification payloads can bypass the existing APK callback while backgrounded.

Only one existing installation and its exact owner are opted into this pilot. Calls use AndroidConfigV2 RemoteNotification with mutable_content and use_as_v1_data_message, which Firebase documents as delivering pure data to older clients. This lets the installed APK retain its native CallStyle/full-screen handling. Terminal signals remain high-priority data so they stop that native service. Other installations, message notifications, Web Push and authorization checks retain production v11 behavior. The rollout expires automatically at 2026-11-11 00:00 UTC.

The v2 API is a preview. Backend schema acceptance does not establish faster delivery, handset receipt, full-screen presentation or compatible cancellation. There is no need to reinstall the APK for this server pilot.

Validation on 2026-11-09:

- 23 regression cases cover unchanged non-pilot payloads, exact installation/account isolation, auto-expiry, voice/video channels, original expiration and data-only terminal signals.
- Existing test-fcm.cjs checks recipient binding, TTL, app isolation and credential failures.
- Firebase validate_only requests against a synthetic topic accepted the complete call and call-end payloads (HTTP 200), without delivering notifications.
- The temporary schema-validation function was disabled after validation.

Manual verification still required: one incoming call after leaving the app via Home and locking the screen, measure delay, confirm Atender/Recusar, then cancel from caller and confirm ringing stops. No chat message should be sent to wake the receiver during that test. Redmi and Mioko are not pilot targets.

Rollback: deploy the exact previous push-notify v11 source (SHA256 6f6a5c3c72207e882a21048cbfd0530017f605fc41f4151c9d475b30798de3ff), or remove the installation match in delivery-policy.ts and deploy. Do not revert databases or uninstall apps.

References:
https://firebase.google.com/docs/cloud-messaging/send/v2-api
https://firebase.google.com/docs/cloud-messaging/android-message-priority
