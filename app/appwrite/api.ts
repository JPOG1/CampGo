import { createApp } from '../server/index.js';

interface AppwriteRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  scheme: string;
  host: string;
  port: number;
  protocol: string;
}

interface AppwriteResponse {
  json: (body: any, status?: number, headers?: Record<string, string>) => any;
  send: (body: any, status?: number, headers?: Record<string, string>) => any;
  text: (body: string, status?: number, headers?: Record<string, string>) => any;
  empty: () => any;
  redirect: (url: string, status?: number) => any;
}

export default async ({ req, res, log, error }: { req: AppwriteRequest; res: AppwriteResponse; log: any; error: any }) => {
  try {
    const app = createApp();

    const expressReq: any = {
      method: req.method,
      url: req.path,
      path: req.path,
      headers: req.headers || {},
      body: req.body || {},
      query: req.query || {},
      params: {},
      ip: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '',
      protocol: req.protocol || 'https',
      secure: req.protocol === 'https',
      hostname: req.host,
      get: (key: string) => (req.headers || {})[key.toLowerCase()],
    };

    let statusCode = 200;
    let responseHeaders: Record<string, string> = { 'content-type': 'application/json' };
    let responseBody: any = null;
    let responseSent = false;

    const expressRes: any = {
      statusCode: 200,
      _headers: {} as Record<string, string>,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      set(key: string, val: string) {
        this._headers[key] = val;
        return this;
      },
      header(key: string, val: string) {
        this._headers[key] = val;
        return this;
      },
      json(body: any) {
        if (responseSent) return this;
        responseSent = true;
        statusCode = this.statusCode;
        responseHeaders = { ...responseHeaders, ...this._headers, 'content-type': 'application/json' };
        responseBody = body;
        return this;
      },
      send(body: any) {
        if (responseSent) return this;
        responseSent = true;
        statusCode = this.statusCode;
        responseHeaders = { ...responseHeaders, ...this._headers };
        if (typeof body === 'object') {
          responseHeaders['content-type'] = 'application/json';
          responseBody = body;
        } else {
          responseHeaders['content-type'] = 'text/html';
          responseBody = body;
        }
        return this;
      },
      sendStatus(code: number) {
        if (responseSent) return this;
        responseSent = true;
        statusCode = code;
        responseBody = null;
        return this;
      },
      redirect(url: string) {
        if (responseSent) return this;
        responseSent = true;
        statusCode = 302;
        responseHeaders.location = url;
        responseBody = null;
        return this;
      },
      type() { return this; },
      links() { return this; },
      attachment() { return this; },
      cookie() { return this; },
      clearCookie() { return this; },
      format() { return this; },
      vary() { return this; },
      locals: {},
      getHeader: (key: string) => this._headers[key],
      setHeader: (key: string, val: string) => { this._headers[key] = val; return this; },
      removeHeader: (key: string) => { delete this._headers[key]; return this; },
      write: (chunk: any) => { responseBody = (responseBody || '') + chunk; return true; },
      writeHead: (status: number, headers?: any) => { statusCode = status; if (headers) Object.assign(this._headers, headers); return this; },
      end: () => { responseSent = true; },
    };

    expressReq.res = expressRes;
    expressReq.app = app;

    const originalEnd = expressRes.end.bind(expressRes);

    await new Promise<void>((resolve) => {
      expressRes.end = (...args: any[]) => {
        originalEnd(...args);
        resolve();
      };

      app(expressReq, expressRes, () => {
        if (!responseSent) {
          statusCode = 404;
          responseBody = { detail: 'Not found' };
          responseSent = true;
        }
        resolve();
      });

      setTimeout(() => {
        if (!responseSent) {
          responseSent = true;
          resolve();
        }
      }, 25000);
    });

    if (responseBody && typeof responseBody === 'object' && !Buffer.isBuffer(responseBody)) {
      return res.json(responseBody, statusCode, responseHeaders);
    }

    return res.text(
      typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody || ''),
      statusCode,
      responseHeaders,
    );
  } catch (err: any) {
    error('Appwrite function error:', err);
    return res.json({ detail: 'Internal server error' }, 500);
  }
};
