import child_process from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.join(import.meta.dirname, 'source');
const fixturesDir = path.join(import.meta.dirname, 'fixtures');
await fs.mkdir(fixturesDir, {recursive: true});

// * Discover source pairs

const entries = await fs.readdir(sourceDir);
const ante_files = entries.filter(f => f.includes('.ante.'));

for (const ante_file of ante_files) {
    const post_file = ante_file.replace('.ante.', '.post.');
    if (!entries.includes(post_file)) {
        console.warn(`No matching post file for ${ante_file}, skipping.`);
        continue;
    }

    const ext = path.extname(ante_file);
    const base = ante_file.replace(`.ante${ext}`, '');

    const ante_path = path.join(sourceDir, ante_file);
    const post_path = path.join(sourceDir, post_file);

    // Copy ante file to fixtures/ as the "old content" for tests.
    await fs.copyFile(ante_path, path.join(fixturesDir, ante_file));
    console.log(`Copied fixtures/${ante_file}`);

    // Generate patch. git diff --no-index exits 1 when files differ — that's expected.
    const result = child_process.spawnSync(
        'git', ['diff', '--no-index', '--no-ext-diff', '--no-color', ante_path, post_path],
        {encoding: 'utf-8'},
    );
    if (result.status !== 0 && result.status !== 1) {
        throw new Error(`git diff failed (exit ${result.status}): ${result.stderr}`);
    }
    const patch_filename = `${base}.patch`;
    await fs.writeFile(path.join(fixturesDir, patch_filename), result.stdout);
    console.log(`Generated fixtures/${patch_filename}`);
}
