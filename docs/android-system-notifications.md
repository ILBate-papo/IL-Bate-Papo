# Optional Android system display

Default FCM delivery remains data-only. Only a verified Android subscription with `android_notification_mode = 'system'` opts into system-rendered background notifications. Web subscriptions and other app IDs retain their existing path.

Database setup:

```sql
alter table public.push_subscriptions
add column if not exists android_notification_mode text
check (android_notification_mode in ('native','system'));
```

Activate by verified subscription ID and account. Set the mode to NULL to roll back. Token rotation or reinstall can create a new subscription with the default transport; inspect its identity before activating. Upserts that omit the mode preserve it for an existing endpoint.

The compatibility notification uses existing voice/video/message/audio channels. In the foreground, the Firebase callback continues native handling. In the background, Firebase/Google Play services may display the system notification, and tapping opens the app to answer a still-active call. This path does not create the custom fullscreen screen or answer/decline notification buttons while asleep and does not promise continuous ringing or universal OEM delivery.

The OS-visible content is generic because the OS can render before the APK checks the signed-in account. Caller names and previews remain in app data. Call-end notices reuse the system tag and collapse key to replace incoming notices. Calls retain their original deadline.

Validation: test-fcm-system-notification.cjs checks default behavior, opt-in rendering, channels, generic content, expiry and terminal replacement. test-system-push-routing.cjs checks per-row routing, authentication and provider failures. Existing FCM, server-isolation, missed-call and call-lifecycle tests also pass. Physical-device standby delivery is still unverified.
