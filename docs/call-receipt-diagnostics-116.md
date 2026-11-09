# Call receipt diagnostics 1.1.6-DIAG

This build records incoming FCM call callbacks separately from native rendering initiated by the WebView. It does not claim to fix background delivery latency. Only the owner POCO should receive this diagnostic APK; keep Redmi and Mioko unchanged.

Production urgent-delivery pilot v12 failed the owner test (offer 20:26:44, provider acceptance 20:26:47, no timely ring). Restored v11 logic as function v13. At 20:29:51 a separate offer was created, so the screenshot at that timestamp does not prove the earlier offer arrived. No FCM receipt timestamp is available in 1.1.5.

The local popup adds the first callback timestamp, original and delivered priorities, FCM sent time, account/token registration booleans and current Android background/Doze state. Receipt recording precedes account/expiry/notification checks. No tokens, caller names, call content or messages are recorded or uploaded.

Underlying call, media and notification handling are unchanged from the prior diagnostic version; all bundled web assets remain the 1.1.3 baseline. Version code 18 allows an in-place update over 1.1.5 (17), preserving data.

Validation: native regression tests and release build in GitHub Actions; signing certificate and bundled asset equality checked before delivery. Handset test pending: after one failed background call, open this popup and share it before making another call, to avoid replacing the last receipt.
