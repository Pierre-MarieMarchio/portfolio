import { basename, dirname, extname } from 'node:path';
import ts from 'typescript';

export type CommentScanner = (text: string, path: string) => number[];
type ShellContext = 'command' | 'double';
interface BlockScalar {
  parentIndent: number;
  shell: boolean;
}

const TYPE_TEST = /^\/\/ @ts-expect-error \S/;
const SHELL_COMMAND_TOKEN = /\\[\s\S]|'[^']*'|"|\$\(|\)|(?<=^|[\s;&|(])#/g;
const SHELL_DOUBLE_QUOTE_TOKEN = /\\[\s\S]|"|\$\(/g;
const YAML_OPAQUE =
  /\$\{\{.*?\}\}|(?<=(?:^|[:\-?,[{])\s*)(?:'(?:[^']|'')*'|"(?:[^"\\]|\\.)*")/g;
const YAML_COMMENT = /(?:^|\s)#/;
const YAML_BLOCK_HEADER =
  /^(\s*(?:-\s+)*)(?:([\w.-]+):\s+)?(?:[!&]\S+\s+)*[|>][+-]?\d?[+-]?\s*$/;

const lineOf = (text: string, position: number): number =>
  text.slice(0, position).split('\n').length;

const blanked = (literal: string): string => literal.replaceAll(/[^\n]/g, ' ');

const matchedLines = (text: string, pattern: RegExp): number[] =>
  [...text.matchAll(pattern)].map((match) => lineOf(text, match.index));

const typeScriptComments: CommentScanner = (text, path) => {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const found = new Map<number, string>();
  const keep = (ranges: ts.CommentRange[] | undefined): void => {
    for (const range of ranges ?? []) {
      found.set(range.pos, text.slice(range.pos, range.end));
    }
  };
  const visit = (node: ts.Node): void => {
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

const htmlComments: CommentScanner = (text) => matchedLines(text, /<!--/g);

const slashComments: CommentScanner = (text) =>
  matchedLines(
    text.replaceAll(/url\([^)]*\)|'[^'\n]*'|"[^"\n]*"/g, blanked),
    /\/\/|\/\*/g,
  );

const lineComments = (markers: string): CommentScanner => {
  const marker = new RegExp(`^\\s*[${markers}]`);
  return (text) =>
    text
      .split('\n')
      .flatMap((line, index) => (marker.test(line) ? [index + 1] : []));
};

const updateShellContexts = (contexts: ShellContext[], token: string): void => {
  if (token === '"') {
    if (contexts.at(-1) === 'double') {
      contexts.pop();
    } else {
      contexts.push('double');
    }
  } else if (token === '$(') {
    contexts.push('command');
  } else if (token === ')' && contexts.length > 1) {
    contexts.pop();
  }
};

const nextShellToken = (
  text: string,
  index: number,
  contexts: ShellContext[],
): RegExpExecArray | null => {
  const token =
    contexts.at(-1) === 'double'
      ? SHELL_DOUBLE_QUOTE_TOKEN
      : SHELL_COMMAND_TOKEN;
  token.lastIndex = index;
  return token.exec(text);
};

const endOfLine = (text: string, from: number): number => {
  const newline = text.indexOf('\n', from);
  return newline === -1 ? text.length : newline;
};

const shellComments = (text: string): number[] => {
  const contexts: ShellContext[] = ['command'];
  const found: number[] = [];
  let match = nextShellToken(text, 0, contexts);
  while (match) {
    let index = match.index + match[0].length;
    if (match[0] === '#') {
      found.push(match.index);
      index = endOfLine(text, index);
    }
    updateShellContexts(contexts, match[0]);
    match = nextShellToken(text, index, contexts);
  }
  return found.map((position) => lineOf(text, position));
};

const shellFileComments: CommentScanner = (text) =>
  shellComments(text).filter((line) => !(line === 1 && text.startsWith('#!')));

const blockScalarOf = (code: string): BlockScalar | null => {
  const match = YAML_BLOCK_HEADER.exec(code);
  if (!match) {
    return null;
  }
  const [, prefix = '', key] = match;
  return {
    parentIndent: key ? prefix.length : prefix.trimEnd().length - 1,
    shell: key === 'run',
  };
};

const blockEnd = (
  lines: string[],
  from: number,
  parentIndent: number,
): number => {
  const end = lines.findIndex(
    (line, index) =>
      index >= from &&
      line.trim() !== '' &&
      line.length - line.trimStart().length <= parentIndent,
  );
  return end === -1 ? lines.length : end;
};

const yamlBlockScalar = (
  lines: string[],
  from: number,
  block: BlockScalar,
): { end: number; found: number[] } => {
  const end = blockEnd(lines, from, block.parentIndent);
  const snippet = lines.slice(from, end).join('\n');
  const found = block.shell
    ? shellComments(snippet).map((line) => line + from)
    : [];
  return { end, found };
};

const yamlComments: CommentScanner = (text) => {
  const lines = text.split('\n');
  const found: number[] = [];
  let index = 0;
  while (index < lines.length) {
    const code = (lines[index] ?? '').replaceAll(YAML_OPAQUE, blanked);
    const column = code.search(YAML_COMMENT);
    if (column !== -1) {
      found.push(index + 1);
    }
    index += 1;
    const block = blockScalarOf(column === -1 ? code : code.slice(0, column));
    if (block) {
      const scalar = yamlBlockScalar(lines, index, block);
      found.push(...scalar.found);
      index = scalar.end;
    }
  }
  return found;
};

const SCANNER_OF_EXTENSION: Record<string, CommentScanner> = {
  '.ts': typeScriptComments,
  '.mts': typeScriptComments,
  '.cts': typeScriptComments,
  '.js': typeScriptComments,
  '.mjs': typeScriptComments,
  '.cjs': typeScriptComments,
  '.json': typeScriptComments,
  '.html': htmlComments,
  '.scss': slashComments,
  '.yml': yamlComments,
  '.yaml': yamlComments,
  '.sh': shellFileComments,
  '.properties': lineComments('#!'),
};

const SCANNER_OF_NAME: Record<string, CommentScanner> = {
  '.prettierrc': typeScriptComments,
  '.editorconfig': lineComments('#;'),
};

export const SCANNED_EXTENSIONS = new Set(Object.keys(SCANNER_OF_EXTENSION));

export const scannerOf = (path: string): CommentScanner =>
  SCANNER_OF_NAME[basename(path)] ??
  SCANNER_OF_EXTENSION[extname(path)] ??
  (dirname(path) === '.husky' ? shellFileComments : lineComments('#'));
