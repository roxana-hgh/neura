declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` — the authenticated user's id. */
      userId?: string;
    }
  }
}

export {};
