-- Applied to cipfycetzelxzwpfaqiu via enforce_contact_blocks_in_contact_rpcs.
-- Reject invitations and direct-conversation creation when either participant blocked the other.
DO $migration$
DECLARE
  body text;
  guard text := E'\n  if exists (select 1 from public.user_blocks where (blocker_id = current_user_id and blocked_id = other_user) or (blocker_id = other_user and blocked_id = current_user_id)) then raise exception ''Contato bloqueado'' using errcode = ''42501''; end if;\n';
BEGIN
  body := pg_get_functiondef('public.get_or_create_direct_conversation(uuid)'::regprocedure);
  if position('Contato bloqueado' in body) = 0 then
    if position('  select c.id into existing_id' in body) = 0 then raise exception 'Unexpected conversation function definition'; end if;
    body := replace(body, '  select c.id into existing_id', guard || '  select c.id into existing_id');
    execute body;
  end if;
  body := pg_get_functiondef('public.accept_contact_link(text)'::regprocedure);
  if position('Contato bloqueado' in body) = 0 then
    if position('  update public.friendships' in body) = 0 then raise exception 'Unexpected contact function definition'; end if;
    body := replace(body, '  update public.friendships', replace(guard, 'other_user', 'target_user_id') || '  update public.friendships');
    execute body;
  end if;
END $migration$;