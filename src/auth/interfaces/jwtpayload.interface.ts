export interface JwtPayload {
  isTwoFactorEnabled: boolean;
  username: string;
  email: string;
  id: string;
  isTwoFactorAuthenticated: boolean;
  isEmailVerified?: boolean;
  jumioDecision?: string;
}
