-- Applied only to cipfycetzelxzwpfaqiu.
-- Upload layout: <sender UUID>/<conversation UUID>/<filename>.
alter policy "authenticated read chat files" on storage.objects to authenticated
using (bucket_id='chat-files' and ((storage.foldername(name))[1]=auth.uid()::text or exists (select 1 from public.conversation_members cm where cm.conversation_id::text=(storage.foldername(objects.name))[2] and cm.user_id=auth.uid())));
alter policy "authenticated upload own chat files" on storage.objects to authenticated
with check (bucket_id='chat-files' and (storage.foldername(name))[1]=auth.uid()::text and exists (select 1 from public.conversation_members cm where cm.conversation_id::text=(storage.foldername(objects.name))[2] and cm.user_id=auth.uid()));
create policy "users delete own chat files" on storage.objects for delete to authenticated
using (bucket_id='chat-files' and (storage.foldername(name))[1]=auth.uid()::text);