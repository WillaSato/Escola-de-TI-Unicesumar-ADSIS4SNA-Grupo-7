import { Router, type CookieOptions, type RequestHandler } from "express";
import { getToken, sessionCookie, sessionUser } from "./middleware.js";
import { type AuthService, sessionDuration } from "./service.js";

export function authRoutes(auth: AuthService, requireSession: RequestHandler, secure: boolean) {
  const router = Router();
  const cookie: CookieOptions = { httpOnly: true, sameSite: "strict", secure, path: "/api" };

  router.post("/login", async (request, response) => {
    const { token, user } = await auth.login(request.body);
    const previous = getToken(request);
    await auth.logout(previous);
    response.cookie(sessionCookie, token, { ...cookie, maxAge: sessionDuration }).json(user);
  });
  router.get("/me", requireSession, (_request, response) => {
    response.json(sessionUser(response));
  });
  router.post("/logout", async (request, response) => {
    await auth.logout(getToken(request));
    response.clearCookie(sessionCookie, cookie).status(204).end();
  });
  return router;
}
