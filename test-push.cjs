const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const handlers = {}, notices = [];
const self = {
  registration: { scope: 'https://ilbate-papo.github.io/IL-Bate-Papo/', async showNotification(title, options) { notices.push({title, options}); } },
  clients: { async matchAll() { throw new Error('Push must not depend on open windows'); } },
  addEventListener(type, handler) { handlers[type] = handler; }
};
vm.runInNewContext(fs.readFileSync(__dirname + '/sw.js', 'utf8'), { self, URL, Date, Number });
async function deliver(data) {
  let pending;
  handlers.push({ data: { json() { return data; } }, waitUntil(promise) { pending = promise; } });
  await pending;
  return notices.at(-1);
}
(async function () {
  const hourAgo = Date.now() - 3600000;
  let n = await deliver({ type: 'message', attachment_type: 'audio', created_at: new Date(hourAgo).toISOString(), message_id: 'm1' });
  assert.match(n.title, /Mensagem de áudio/);
  assert.equal(n.options.timestamp, hourAgo);
  assert.equal(n.options.silent, false);
  assert.equal(n.options.tag, 'ilbp-message-m1');
  n = await deliver({ type: 'call', mode: 'video', call_id: 'c1' });
  assert.match(n.title, /Videochamada/);
  assert.equal(n.options.requireInteraction, true);
  assert.equal(n.options.data.url, 'https://ilbate-papo.github.io/IL-Bate-Papo/');
  assert.equal(n.options.tag, 'ilbp-call-c1');
  n = await deliver({ type: 'message', body: 'Olá', created_at: 'invalid' });
  assert.equal(n.options.body, 'Olá');
  assert.ok(Number.isFinite(n.options.timestamp));
  assert.equal(notices.length, 3);
  console.log('Passed: push independent of windows, audio/video labels, original event time and separate notification tags');
})();
