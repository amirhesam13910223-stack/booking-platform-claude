export interface JwtPayload {
  sub: string; // userId
  role: 'USER' | 'ADMIN';
}

export interface AuthenticatedRequestUser {
  id: string;
  role: 'USER' | 'ADMIN';
}
