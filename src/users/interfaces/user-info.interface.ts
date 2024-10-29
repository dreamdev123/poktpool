export interface userInfoData {
  username: string;
  email: string;
  primaryWalletId: string;
  isEmailVerified?: boolean;
  jumioDecision?: string;
  isTwoFactorEnabled?: boolean;
}
