const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const guard = fs.readFileSync(path.join(root, 'rpys-runtime-v400.js'), 'utf8');

test('stale cloud pull patch is removed before RPYS opens', () => {
  assert.match(
    index,
    /replaceOnce\(app,'\["372\.4","rpys-patch372","3724"\],',''\)/,
    'the loader must remove rpys-patch372, which overwrote the first local edit'
  );
  assert.match(
    index,
    /if\(app\.includes\('\["372\.4","rpys-patch372","3724"\]'\)\)throw new Error/,
    'startup validation must fail closed if the stale pull patch survives'
  );
});

test('remote revision reload waits while a local edit is pending', () => {
  assert.match(index, /_saveTimerV245\|\|_savePending/);
  assert.match(index, /__RPYS_EDIT_GUARD_UNTIL_V400__/);
  assert.match(index, /Date\.now\(\)-editAt<60000/);
});

test('first cell save is flushed immediately and waits for acknowledgement', () => {
  assert.match(guard, /function flushFirstSave\(\)/);
  assert.match(guard, /saveNowV245\(\{label:'İlk işlem güvenli kaydı'\}\)/);
  assert.match(guard, /Promise\.resolve\(chain\)\.then/);
});
