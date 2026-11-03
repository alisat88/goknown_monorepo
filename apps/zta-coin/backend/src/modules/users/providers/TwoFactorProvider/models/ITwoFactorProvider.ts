/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
