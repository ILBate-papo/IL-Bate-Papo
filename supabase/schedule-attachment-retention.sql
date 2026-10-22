-- Run after deploying cleanup-attachments (which validates the private Vault token).
select cron.schedule('ilbp-attachments-seven-days','17 * * * *',$job$
 select net.http_post(
 url:='https://cipfycetzelxzwpfaqiu.supabase.co/functions/v1/cleanup-attachments',
 headers:=jsonb_build_object('Content-Type','application/json','x-cleanup-token',(select decrypted_secret from vault.decrypted_secrets where name='ilbp_attachment_cleanup_token')),
 body:='{}'::jsonb,timeout_milliseconds:=120000);
$job$);
