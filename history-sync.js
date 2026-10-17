/* IL Bate Papo: server history reconciliation, independent of attachment loading. */
(function (root) {
  'use strict';
  var fields = 'id,conversation_id,sender_id,body,attachment_path,attachment_type,created_at';
  function compare(a, b) {
    var time = String(a.created_at).localeCompare(String(b.created_at));
    return time || String(a.id).localeCompare(String(b.id));
  }
  function create(options) {
    var db = options.client, conversation = options.conversationId, account = options.userId;
    var rows = new Map(), urls = new Map(), pending = new Set(), journal = new Map();
    var closed = false, loading = false, repeat = false, channel, timer, started = false;
    var urlQueue = [], signing = 0, currentTask = Promise.resolve();
    var events = options.events || root, doc = options.document || root.document;
    function valid(row) { return row && row.id && row.conversation_id === conversation; }
    function report(error) { if (!closed && options.onError) options.onError(error); }
    function publish() {
      if (closed) return;
      options.onMessages(Array.from(rows.values()).sort(compare).map(function (row) {
        var media = urls.get(row.id);
        return {id:row.id,from:row.sender_id === account ? 'me':'them',text:row.body || '',
          time:new Date(row.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
          attachmentPath:row.attachment_path,attachmentType:row.attachment_type,
          attachmentUrl:media && media.path === row.attachment_path ? media.url : ''};
      }));
    }
    function signAttachments() {
      rows.forEach(function (row) {
        var cached = urls.get(row.id);
        var key = row.id + '|' + row.attachment_path;
        if (!row.attachment_path || pending.has(key) ||
            (cached && cached.path === row.attachment_path && cached.expires > Date.now())) return;
        pending.add(key); urlQueue.push({id:row.id,path:row.attachment_path,key:key});
      });
      pump();
    }
    function pump() {
      while (!closed && signing < 4 && urlQueue.length) {
        (function (item) {
          signing += 1;
          Promise.resolve().then(function () {
            if (closed) return null;
            return db.storage.from('chat-files').createSignedUrl(item.path, 3600);
          }).then(function (result) {
            if (closed || !result) return;
            var row = rows.get(item.id);
            if (!row || row.attachment_path !== item.path) return;
            if (result.error || !result.data || !result.data.signedUrl) {
              // Retry on the next reconciliation; never remove the message itself.
              report(result.error || new Error('Não foi possível abrir um anexo.')); return;
            }
            urls.set(item.id,{path:item.path,url:result.data.signedUrl,expires:Date.now()+3300000});
            publish();
          }).catch(report).finally(function () { signing -= 1; pending.delete(item.key); pump(); });
        })(urlQueue.shift());
      }
    }
    function receive(row, event) {
      if (closed) return;
      var id = row && row.id;
      if (!id || (event !== 'DELETE' && !valid(row))) return;
      var exists = rows.has(id);
      if (loading) journal.set(id,event === 'DELETE' ? null : row);
      if (event === 'DELETE') { rows.delete(id); urls.delete(id); }
      else rows.set(id,row);
      publish(); signAttachments();
      if (event === 'INSERT' && !exists && row.sender_id !== account && options.onIncoming) options.onIncoming(row);
    }
    async function reconcile() {
      if (closed) return;
      if (loading) { repeat = true; return currentTask; }
      loading = true; journal = new Map();
      currentTask = (async function () {
        try {
          var snapshot = new Map(), cursor = null;
          while (!closed) {
            var query = db.from('messages').select(fields).eq('conversation_id',conversation)
              .order('created_at',{ascending:false}).order('id',{ascending:false}).limit(200);
            if (cursor) query = query.or('created_at.lt.'+cursor.created_at+',and(created_at.eq.'+cursor.created_at+',id.lt.'+cursor.id+')');
            var result = await query;
            if (closed) return;
            if (result.error) throw result.error;
            if (!Array.isArray(result.data)) throw new Error('Resposta de histórico inválida.');
            if (!result.data.length) break;
            result.data.forEach(function (row) { if (valid(row)) snapshot.set(row.id,row); });
            var next = result.data[result.data.length-1];
            if (!valid(next) || !next.created_at || (cursor && compare(next,cursor) >= 0)) throw new Error('Paginação do histórico não avançou.');
            cursor = next;
            // Keep requesting until empty, including when the API caps below our page size.
          }
          if (closed) return;
          journal.forEach(function (row,id) { if (row) snapshot.set(id,row); else snapshot.delete(id); });
          rows = snapshot;
          urls.forEach(function (_,id) { if (!rows.has(id)) urls.delete(id); });
          publish(); signAttachments();
        } catch (error) { report(error); }
        finally {
          loading = false; journal.clear();
          if (repeat && !closed) { repeat = false; reconcile(); }
        }
      })();
      return currentTask;
    }
    function resume() { if (!doc || doc.visibilityState === 'visible') reconcile(); }
    function start() {
      if (started || closed) return; started = true;
      channel = db.channel('ilbp-history-'+account+'-'+conversation)
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+conversation},function(e){receive(e.new,'INSERT');})
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:'conversation_id=eq.'+conversation},function(e){receive(e.new,'UPDATE');})
        .on('postgres_changes',{event:'DELETE',schema:'public',table:'messages',filter:'conversation_id=eq.'+conversation},function(e){receive(e.old,'DELETE');})
        .subscribe(function(status){if(status === 'SUBSCRIBED')reconcile();else if(status === 'CHANNEL_ERROR'||status === 'TIMED_OUT')report(new Error('Reconectando o histórico.'));});
      if(events && events.addEventListener){events.addEventListener('online',resume);events.addEventListener('pageshow',resume);}
      if(doc && doc.addEventListener)doc.addEventListener('visibilitychange',resume);
      timer = setInterval(resume,30000);
      reconcile();
    }
    function destroy() {
      if (closed) return; closed = true; clearInterval(timer); urlQueue = [];
      if(channel)db.removeChannel(channel);
      if(events && events.removeEventListener){events.removeEventListener('online',resume);events.removeEventListener('pageshow',resume);}
      if(doc && doc.removeEventListener)doc.removeEventListener('visibilitychange',resume);
      rows.clear();urls.clear();journal.clear();
    }
    return {start:start,sync:reconcile,receive:receive,destroy:destroy};
  }
  var api = {create:create,fields:fields};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ILBPHistory = api;
})(typeof window !== 'undefined' ? window : globalThis);
