// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const ROOTS =
  process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['src'];
const TYPE_TEST = /^\/\/ @ts-expect-error \S/;

/**
 * @param {string} path
 * @returns {string[]}
 */
const filesUnder = (path) =>
  path.endsWith('.ts') || path.endsWith('.html') || path.endsWith('.scss')
    ? [path]
    : readdirSync(path, { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative('.', join(entry.parentPath, entry.name)))
        .filter((file) => /\.(ts|html|scss)$/.test(file));

/**
 * @param {string} text
 * @param {number} position
 * @returns {number}
 */
const lineOf = (text, position) => text.slice(0, position).split('\n').length;

/**
 * @param {string} path
 * @param {string} text
 * @returns {number[]}
 */
const typeScriptComments = (path, text) => {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  /** @type {Map<number, string>} */
  const found = new Map();
  /** @param {ts.CommentRange[] | undefined} ranges */
  const keep = (ranges) => {
    for (const range of ranges ?? []) {
      found.set(range.pos, text.slice(range.pos, range.end));
    }
  };
  /** @param {ts.Node} node */
  const visit = (node) => {
    keep(ts.getLeadingCommentRanges(text, node.getFullStart()));
    keep(ts.getTrailingCommentRanges(text, node.getEnd()));
    ts.forEachChild(node, visit);
  };
  visit(source);
  keep(ts.getLeadingCommentRanges(text, source.endOfFileToken.getFullStart()));
  const isSpec = path.endsWith('.spec.ts');
  return [...found]
    .filter(([, comment]) => !(isSpec && TYPE_TEST.test(comment)))
    .map(([position]) => lineOf(text, position));
};

/**
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {number[]}
 */
const matchedLines = (text, pattern) =>
  [...text.matchAll(pattern)].map((match) => lineOf(text, match.index));

/**
 * @param {string} text
 * @returns {string}
 */
const withoutStrings = (text) =>
  text.replaceAll(/url\([^)]*\)|'[^'\n]*'|"[^"\n]*"/g, (literal) =>
    literal.replaceAll(/[^\n]/g, ' '),
  );

/**
 * @param {string} path
 * @returns {number[]}
 */
const commentLines = (path) => {
  const text = readFileSync(path, 'utf8');
  if (path.endsWith('.ts')) {
    return typeScriptComments(path, text);
  }
  if (path.endsWith('.html')) {
    return matchedLines(text, /<!--/g);
  }
  return matchedLines(withoutStrings(text), /\/\/|\/\*/g);
};

const findings = ROOTS.flatMap(filesUnder).flatMap((path) =>
  commentLines(path).map((line) => `${path}:${String(line)}`),
);

if (findings.length === 0) {
  console.log('check-comments: no comment in the code (D10).');
} else {
  console.error(
    `check-comments: ${String(findings.length)} comment(s); a reason goes to docs/architecture/ (D10).`,
  );
  for (const finding of findings) {
    console.error(`  ${finding}`);
  }
  process.exitCode = 1;
}
