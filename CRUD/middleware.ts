import type { Request, RequestHandler, Response } from "express";
import { HttpError } from "../http/errors.js";
import type { AuthService, SessionUser } from "./service.js";

export const sessionCookie = "lifehub_session";

export function getToken(request: Request) {
  const value = request.headers.cookie?.match(/(?:^|;\s*)lifehub_session=([a-f0-9]{64})(?:;|$)/);
  return value?.[1];
}

export function sessionUser(response: Response): SessionUser {
  const user = response.locals.user as SessionUser | undefined;
  if (!user) throw new HttpError(401, "Entre para acessar sua conta.");
  return user;
}

export function authenticate(auth: AuthService): RequestHandler {
  return async (request, response, next) => {
    const token = getToken(request);
    if (token) response.locals.user = await auth.getSession(token);
    sessionUser(response);
    next();
  };
}

export const rejectCrossSiteWrite: RequestHandler = (request, _response, next) => {
  const browserSite = request.get("Sec-Fetch-Site");
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && browserSite && browserSite !== "same-origin" && browserSite !== "none") {
    next(new HttpError(403, "Origem da requisição não permitida."));
    return;
  }
  next();
};
