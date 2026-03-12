import simpleGit from 'simple-git';
import parseDiff from 'parse-diff';

// * Types

export interface OldLine {
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

// Returns 1-based line numbers of stale comment blocks: consecutive comment
// lines where none were changed, but the following code block was changed.
export function find_stale_comments(lines: OldLine[]): number[] {
    const stale: number[] = [];
    let i = 0;

	// Iterate over all lines
    while (i < lines.length) {
		// Find the beginning of a comment
        if (lines[i].type !== 'comment') {
            i++;
            continue;
        }

        // Collect the comment and check if any line in it changed.
        const block_start = i;
        let comment_changed = false;
        while (i < lines.length && lines[i].type === 'comment') {
            if (lines[i].changed) {
                comment_changed = true;
            }
            i++;
        }

        // If the comment was untouched, check if the following code was changed.
        if (!comment_changed) {
            while (i < lines.length && lines[i].type !== 'empty') {
                if (lines[i].changed) {
                    stale.push(block_start + 1);
                    break;
                }
                i++;
            }
        }
    }
    return stale;
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

        const lines = annotate_lines(oldContent.split('\n'), file.chunks);
        const stale = find_stale_comments(lines);
        for (const line_no of stale) {
            console.error(`${filename}:${line_no}: stale comment`);
        }
    }
}

if (import.meta.main) {
    main();
}
