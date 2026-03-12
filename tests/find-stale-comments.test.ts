import assert from 'node:assert/strict';
import test from 'node:test';
import {find_stale_comments, OldLine} from '../index.ts';

test('detects stale comment when code changed but comment not', () => {
    const lines: OldLine[] = [
        {content: '// a comment', type: 'comment', changed: false},
        {content: 'some_code()', type: 'code', changed: true},
    ];
    assert.deepEqual(find_stale_comments(lines), [1]);
});
