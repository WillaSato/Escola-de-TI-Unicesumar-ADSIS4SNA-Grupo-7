import type { ErrorRequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message, fields: error.fields });
    return;
  }
  const parser = error as { type?: string } | null;
  if (parser?.type === "entity.parse.failed") {
    response.status(400).json({ error: "O corpo da requisição contém JSON inválido." });
    return;
  }
  if (parser?.type === "entity.too.large") {
    response.status(413).json({ error: "O corpo da requisição excedeu o limite." });
    return;
  }
  console.error(error);
  response.status(500).json({ error: "Não foi possível concluir a operação." });
};
