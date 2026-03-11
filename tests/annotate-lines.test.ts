import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import parseDiff from 'parse-diff';
import {annotate_lines} from '../index.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

async function load_chunks(name: string): Promise<parseDiff.Chunk[]> {
    const patch = await fs.readFile(path.join(fixturesDir, `${name}.patch`), 'utf-8');
    return parseDiff(patch)[0].chunks;
}

async function load_contents(name: string): Promise<string[]> {
    return (await fs.readFile(path.join(fixturesDir, `${name}.ante.js`), 'utf-8')).split('\n');
}

test('marks deleted lines as changed', async () => {
    const contents = await load_contents('code-and-comment-changed');
    const chunks = await load_chunks('code-and-comment-changed');
    const [comment_line, code_line] = annotate_lines(contents, chunks);
    assert.equal(comment_line.changed, true);
    assert.equal(code_line.changed, true);
});

test('does not mark unchanged lines', async () => {
    const contents = await load_contents('code-changed-comment-not');
    const chunks = await load_chunks('code-changed-comment-not');
    const [comment_line, code_line] = annotate_lines(contents, chunks);
    assert.equal(comment_line.changed, false);
    assert.equal(code_line.changed, true);
});

test('classifies line types', async () => {
    const contents = await load_contents('code-changed-comment-not');
    const chunks = await load_chunks('code-changed-comment-not');
    const [comment_line, code_line] = annotate_lines(contents, chunks);
    assert.equal(comment_line.type, 'comment');
    assert.equal(code_line.type, 'code');
});

test('marks added lines', {todo: true});

test('handles empty chunks', {todo: true});
