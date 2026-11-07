type DisplayOverride = { android_mode?: string };
type Registration = {
 subscription: { app_id?: string; transport?: string };
 android_notification_mode?: string | null;
 delivery_override?: DisplayOverride | DisplayOverride[] | null;
};
export function systemDisplayFor(item: Registration): boolean {
 if (item.subscription.app_id !== "ilbp" || item.subscription.transport !== "fcm") return false;
 const override = Array.isArray(item.delivery_override) ? item.delivery_override[0] : item.delivery_override;
 const mode = override?.android_mode;
 return (mode === "system" || mode === "native" ? mode : item.android_notification_mode) === "system";
}
