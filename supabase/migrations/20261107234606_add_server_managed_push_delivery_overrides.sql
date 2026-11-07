create table public.push_delivery_overrides (
 subscription_id uuid primary key references public.push_subscriptions(id) on delete cascade,
 android_mode text not null check (android_mode in ('native','system')),
 created_at timestamptz not null default now()
);
alter table public.push_delivery_overrides enable row level security;
revoke all on table public.push_delivery_overrides from public, anon, authenticated;
grant select, insert, update, delete on table public.push_delivery_overrides to service_role;
comment on table public.push_delivery_overrides is 'Server-managed per-installation notification mode. App token refresh must not overwrite this setting.';