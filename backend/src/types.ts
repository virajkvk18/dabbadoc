export type AuthenticatedUser = {
  id: string;
  email?: string;
};

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    user?: AuthenticatedUser;
  }
}
