const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/notifications.js', 'utf8');
const functions = source.slice(source.indexOf('  function applicationServerKey('), source.indexOf('  function removePrompt('));
async function scenario(existing, concurrent = false) {
  let current = existing, created = 0, removed = 0, saved = [];
  if (current) current.unsubscribe = async () => { removed++; current = null; return true; };
  const context = { Promise, Uint8Array, atob, Date, Object, Error, console: { info() {} },
    user: { id: 'new-user' }, generation: 1, VAPID_PUBLIC_KEY: 'AQID', Notification: { permission: 'granted' },
    registration: { pushManager: {
      async getSubscription() { return current; },
      async subscribe(options) {
        created++; assert.deepEqual(Array.from(options.applicationServerKey), [1,2,3]);
        current = {endpoint: 'new-endpoint', options, toJSON() { return {endpoint: this.endpoint}; }};
        return current;
      }
    }}, client: () => ({ from: () => ({ upsert(row) { saved.push(row); return {select: () => ({single: async () => ({data: {id: 'saved'}})})}; } }) })
  };
  vm.createContext(context); vm.runInContext(functions, context);
  await Promise.all(concurrent ? [context.subscribeForPush(), context.subscribeForPush()] : [context.subscribeForPush()]);
  return {created, removed, saved};
}
(async () => {
  const old = () => ({endpoint:'old-endpoint', options:{applicationServerKey:new Uint8Array([4,5,6]).buffer}, toJSON(){return {endpoint:this.endpoint};}});
  let result = await scenario(old(), true);
  assert.equal(result.removed,1); assert.equal(result.created,1);
  assert(result.saved.every(row => row.endpoint === 'new-endpoint' && row.user_id === 'new-user'));
  result = await scenario({endpoint:'current',options:{applicationServerKey:new Uint8Array([1,2,3]).buffer},toJSON(){return {endpoint:this.endpoint};}});
  assert.equal(result.created,0); assert.equal(result.removed,0); assert.equal(result.saved[0].endpoint,'current');
  result = await scenario(null); assert.equal(result.created,1);
  console.log('PASS: obsolete push key replaced once under concurrent registration; current key reused; fresh registration saved to current account. Mocked push API, no physical delivery test.');
})().catch(error => {console.error(error);process.exit(1);});
