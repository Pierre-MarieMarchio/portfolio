import { createReadStream, statSync, type Stats } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = normalize('dist/portfolio/browser');
const NOT_FOUND_PAGE = join(ROOT, 'index.csr.html');
const PORT = Number(process.argv[2]);

const TYPES: Readonly<Record<string, string>> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const statOf = (path: string): Stats | undefined =>
  statSync(path, { throwIfNoEntry: false });

type Answer =
  | { readonly status: number; readonly file: string }
  | { readonly redirect: string };

const NOT_FOUND: Answer = { status: 404, file: NOT_FOUND_PAGE };

const answerFor = (url: URL): Answer => {
  const path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) {
    return NOT_FOUND;
  }
  const found = statOf(path);
  if (found?.isFile()) {
    return { status: 200, file: path };
  }
  const index = join(path, 'index.html');
  if (!found?.isDirectory() || !statOf(index)?.isFile()) {
    return NOT_FOUND;
  }
  return url.pathname.endsWith('/')
    ? { status: 200, file: index }
    : { redirect: `${url.pathname}/${url.search}` };
};

const server = createServer((request, response) => {
  const answer = answerFor(new URL(request.url ?? '/', 'http://localhost'));
  if ('redirect' in answer) {
    response.writeHead(301, { location: answer.redirect });
    response.end();
    return;
  }
  response.writeHead(answer.status, {
    'content-type': TYPES[extname(answer.file)] ?? 'application/octet-stream',
  });
  createReadStream(answer.file).pipe(response);
});

server.listen(PORT, '127.0.0.1');
