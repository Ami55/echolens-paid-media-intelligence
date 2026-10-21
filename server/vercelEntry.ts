import app from '../server';
import type { Request, Response } from 'express';
export default function handler(req: Request, res: Response) {
  const route = typeof req.query.__route === 'string' ? req.query.__route : '';
  const url = new URL(req.url || '/', 'http://localhost');
  url.searchParams.delete('__route');
  req.url = '/api/' + route + (url.search ? url.search : '');
  return app(req, res);
}
