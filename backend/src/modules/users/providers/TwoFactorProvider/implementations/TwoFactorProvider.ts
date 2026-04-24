import AppError from '@shared/errors/AppError';
import * as speakeasy from 'speakeasy';
import * as QRcode from 'qrcode';
import ITwoFactorProvider, {
  IResponseTwoFactorAuthentication,
} from '../models/ITwoFactorProvider';

export default class TwoFactorProvider implements ITwoFactorProvider {
  private twoFactorAuthenticationName =
    process.env.APP_TWO_FACTOR_AUTHENTICATION_APP_NAME;

  public generate(email: string): IResponseTwoFactorAuthentication {
    if (!this.twoFactorAuthenticationName) {
      throw new AppError('Failed to generate 2FA code', 400);
    }

    const secret = speakeasy.generateSecret({
      name: `${this.twoFactorAuthenticationName} (${email})`,
      length: 12,
    });

    if (!secret.otpauth_url) {
      throw new AppError('Failed to generate 2FA code', 400);
    }

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  public async generateQRCode(
    otpauthUrl: string,
    key: string,
  ): Promise<{ qrcode: string; key: string }> {
    return { qrcode: await QRcode.toDataURL(otpauthUrl), key };
  }

  public async verify(
    twoFactorAuthenticationCode: string,
    user2FACode: string,
  ): Promise<boolean> {
    return speakeasy.totp.verify({
      secret: user2FACode,
      encoding: 'base32',
      token: twoFactorAuthenticationCode,
    });
  }
}
