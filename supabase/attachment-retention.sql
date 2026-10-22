-- IL Bate Papo only. Actual bytes are removed through the Storage API, never SQL.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.secrets where name='ilbp_attachment_cleanup_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'ilbp_attachment_cleanup_token');
 end if;
end $$;
create or replace function public.ilbp_cleanup_authorized(token text) returns boolean
language sql security definer set search_path='' as $$
 select length(token)=64 and exists(select 1 from vault.decrypted_secrets where name='ilbp_attachment_cleanup_token' and decrypted_secret=token)
$$;
create or replace function public.ilbp_expired_attachments() returns table(bucket text,path text)
language sql security definer set search_path='' as $$
 with candidates as (
 select o.bucket_id bucket,o.name path from storage.objects o
 where o.bucket_id in ('chat-files','story-files') and o.created_at <= now()-interval '7 days'
 union
 select 'chat-files',m.attachment_path from public.messages m where m.attachment_path is not null and m.created_at<=now()-interval '7 days'
 union
 select 'story-files',s.media_path from public.stories s where s.created_at<=now()-interval '7 days'
 )
 select c.bucket,c.path from candidates c
 where not exists(select 1 from storage.objects o where o.bucket_id=c.bucket and o.name=c.path and o.created_at>now()-interval '7 days')
 and not exists(select 1 from public.messages m where c.bucket='chat-files' and m.attachment_path=c.path and m.created_at>now()-interval '7 days')
 and not exists(select 1 from public.stories s where c.bucket='story-files' and s.media_path=c.path and s.created_at>now()-interval '7 days')
 order by c.bucket,c.path limit 200
$$;
create or replace function public.ilbp_finish_expired_attachment(bucket text,path text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if bucket not in ('chat-files','story-files') then raise exception 'Invalid bucket'; end if;
 if exists(select 1 from storage.objects o where o.bucket_id=bucket and o.name=path) then raise exception 'Storage deletion not confirmed'; end if;
 if bucket='chat-files' then
  update public.messages m set body=left(case when m.body='' then '' else m.body||E'\n' end,9900)||'[Anexo expirado após 7 dias]',attachment_path=null,attachment_type=null
  where m.attachment_path=path and m.created_at<=now()-interval '7 days';
 else
  delete from public.stories s where s.media_path=path and s.created_at<=now()-interval '7 days';
 end if;
end $$;
revoke all on function public.ilbp_cleanup_authorized(text) from public,anon,authenticated;
revoke all on function public.ilbp_expired_attachments() from public,anon,authenticated;
revoke all on function public.ilbp_finish_expired_attachment(text,text) from public,anon,authenticated;
grant execute on function public.ilbp_cleanup_authorized(text),public.ilbp_expired_attachments(),public.ilbp_finish_expired_attachment(text,text) to service_role;
