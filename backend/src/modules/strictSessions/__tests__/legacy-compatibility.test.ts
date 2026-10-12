import 'reflect-metadata';
import { sign, verify } from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import { container } from 'tsyringe';
import AuthenticateUserService from '../../users/services/AuthenticateUserService';
import VerifyLoginEmailCodeService from '../../users/services/VerifyLoginEmailCodeService';
import ensureAuthenticated from '../../users/infra/http/middlewares/ensureAuthenticated';

jest.mock('../../../config/auth', () => ({
  __esModule: true,
  default: { jwt: { secret: 'test-only-legacy-key', expiresIn: '100m' } },
}));

describe('legacy login contract remains independent', () => {
  afterEach(() => jest.restoreAllMocks());
  test('legacy password step retains its response and legacy PIN persistence', async () => {
    const user = {
      id: 'db-user',
      email: 'legacy@example.test',
      name: 'Legacy',
      status: 'active',
      twoFactorAuthentication: true,
      password: await hash('test-password', 4),
    };
    const repo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      updateLoginCode: jest.fn(),
    };
    const hashing = {
      compareHash: jest.fn().mockResolvedValue(true),
      generateHash: jest.fn().mockResolvedValue('legacy-hash'),
    };
    const send = jest.fn();
    jest.spyOn(container, 'resolve').mockReturnValue({ execute: send });
    const result = await new AuthenticateUserService(
      repo as any,
      hashing as any,
      { generatePin: async () => 'test-pin' } as any,
    ).execute({ email: user.email, password: 'test-password' });
    expect(result).toEqual({ verificationRequired: true, email: user.email });
    expect(repo.updateLoginCode).toHaveBeenCalledWith(
      user.id,
      'legacy-hash',
      expect.any(Date),
    );
    expect(send).toHaveBeenCalled();
  });
  test('legacy code completion still returns its JWT and user response', async () => {
    const user = {
      id: 'db-user',
      sync_id: 'legacy-sync',
      email: 'legacy@example.test',
      status: 'active',
      pin: 'hash',
      pin_created_at: new Date(),
      twoFactorAuthentication: true,
      role: 'user',
    };
    const repo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      save: jest.fn(),
    };
    jest.spyOn(container, 'resolve').mockReturnValue({ execute: jest.fn() });
    const result = await new VerifyLoginEmailCodeService(
      repo as any,
      { findBalance: async () => 0 } as any,
      { compareHash: async () => true } as any,
    ).execute({ email: user.email, code: 'legacy-code' });
    expect(verify(result.token, 'test-only-legacy-key')).toMatchObject({
      sub: 'legacy-sync',
      role: 'user',
    });
    expect(result.user).toMatchObject({
      hasVerfiedTwoFactorCode: true,
      current_balance: 0,
    });
    expect(user.pin).toBeNull();
  });
  test('legacy middleware keeps its established subject contract', () => {
    const token = sign({ role: 'user' }, 'test-only-legacy-key', {
      subject: 'legacy-sync',
      expiresIn: '1h',
    });
    const req: any = { headers: { authorization: 'Bearer ' + token } };
    const next = jest.fn();
    ensureAuthenticated(req, {} as any, next);
    expect(req.user).toEqual({ sync_id: 'legacy-sync' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
