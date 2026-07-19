import type { IncomingMessage, ServerResponse } from 'node:http';

export interface NodeRequestInit extends RequestInit {
  duplex?: 'half';
}

export function nodeRequestToWebRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/', `http://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'transfer-encoding' || key === 'connection') continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }
  const method = req.method ?? 'GET';
  const init: NodeRequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = req as unknown as BodyInit;
    init.duplex = 'half';
  }
  return new Request(url, init);
}

export async function sendWebResponse(res: ServerResponse, webRes: Response): Promise<void> {
  for (const [key, value] of webRes.headers) {
    res.setHeader(key, value);
  }
  res.statusCode = webRes.status;
  if (webRes.body) {
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  }
  res.end();
}
