import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { SCANNED_EXTENSIONS, scannerOf } from './comment-syntaxes.ts';

const ARGUMENTS = process.argv.slice(2);
const LIST_ONLY = ARGUMENTS.includes('--list');
const GIVEN_ROOTS = ARGUMENTS.filter((argument) => !argument.startsWith('--'));
const SOURCE_ROOTS = ['src', 'scripts', '.github'];
const SHELL_HOOKS = '.husky';
const ROOT_DOTFILES = new Set([
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc',
]);
const ROOT_CONFIG = /\.(?:json|properties|config\.[cm]?[jt]s)$/;
const GENERATED = new Set(['package-lock.json']);

const isScanned = (file: string): boolean =>
  SCANNED_EXTENSIONS.has(extname(file));

const filesIn = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(directory, entry.name));

const filesUnder = (path: string): string[] =>
  statSync(path).isFile()
    ? [path]
    : readdirSync(path, { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative('.', join(entry.parentPath, entry.name)))
        .filter(isScanned);

const isRootConfig = (file: string): boolean =>
  (ROOT_DOTFILES.has(file) || ROOT_CONFIG.test(file)) && !GENERATED.has(file);

const defaultFiles = (): string[] => [
  ...SOURCE_ROOTS.flatMap(filesUnder),
  ...filesIn(SHELL_HOOKS),
  ...filesIn('.').filter(isRootConfig),
];

const commentLines = (path: string): number[] =>
  scannerOf(path)(readFileSync(path, 'utf8'), path);

const files = (
  GIVEN_ROOTS.length > 0 ? GIVEN_ROOTS.flatMap(filesUnder) : defaultFiles()
).map((file) => relative('.', file));

if (LIST_ONLY) {
  console.log(files.join('\n'));
  process.exit(0);
}

const findings = files.flatMap((path) =>
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
