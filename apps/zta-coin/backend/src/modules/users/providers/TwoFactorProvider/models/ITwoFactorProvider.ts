export interface IResponseTwoFactorAuthentication {
  otpauthUrl: string;
  base32: string;
}

export default interface ITwoFactorProvider {
  generate(email: string): IResponseTwoFactorAuthentication;
  generateQRCode(
    otpauthUrl: string,
    key: string,
  ): Promise<{ qrcode: string; key: string }>;
  verify(
    twoFactorAuthenticationCode: string,
    user2FACode: string,
  ): Promise<boolean>;
}
