import simpleGit from 'simple-git';
import parseDiff from 'parse-diff';

// * Types

interface OldLine {
    content: string;
    type: 'comment' | 'code' | 'empty';
    changed: boolean;
}

// * Core logic

// Matches lines whose first non-whitespace characters are a comment marker:
// //, #, --, /*, ; or %
function is_comment(line: string): boolean {
    return /^\s*(\/\/|#|--|\/\*|;|%)/.test(line);
}

// Classify each line by type and mark deleted lines (from the diff) as changed.
export function annotate_lines(contents: string[], chunks: parseDiff.Chunk[]): OldLine[] {
    const lines: OldLine[] = contents.map(content => ({
        content,
        type: content.trim() === '' ? 'empty' : is_comment(content) ? 'comment' : 'code',
        changed: false,
    }));
    for (const chunk of chunks) {
        for (const change of chunk.changes) {
            if (change.type === 'del') {
                lines[change.ln - 1].changed = true;
            }
        }
    }
    return lines;
}

// * Main

async function main(): Promise<void> {
    const git = simpleGit();
    const diff = await git.diff(['--staged', '--no-ext-diff', '--no-color']);
    const files = parseDiff(diff);

    for (const file of files) {
        // Skip new files: no prior content means no comment to check.
        if (file.new || !file.from) {
            continue;
        }

        const filename = file.from;
        let oldContent: string;
        try {
            oldContent = await git.show([`HEAD:${filename}`]);
        } catch {
            continue;
        }

        const oldLines = annotate_lines(oldContent.split('\n'), file.chunks);

        console.dir(oldLines, {depth: null});
    }
}

if (import.meta.main) {
    main();
}
