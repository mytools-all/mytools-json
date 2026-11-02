import test from 'node:test';
import assert from 'node:assert/strict';
import { jsonPath, toXml, toTypescript } from './utils.mjs';
test('data paths and escaped conversions', () => {
  assert.deepEqual(jsonPath({users:[{name:'甲'},{name:'乙'}]},'$.users.*.name'), ['甲','乙']);
  assert.equal(jsonPath({users:[{name:'甲'}]},'$.users[0].name'),'甲');
  assert.throws(()=>jsonPath({},'constructor.constructor'));
  assert.ok(toXml({text:'<script>&'}).includes('&lt;script&gt;&amp;'));
  assert.ok(toTypescript({id:1,tags:['a',2]}).includes('(string | number)[]'));
});
