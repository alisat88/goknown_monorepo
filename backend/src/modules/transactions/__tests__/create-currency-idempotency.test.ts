import 'reflect-metadata';

import { EnumStatus } from '../infra/typeorm/entities/Currency';
import CreateCurrencyService from '../services/CreateCurrencyService';

describe('CreateCurrencyService idempotency', () => {
  const organization = {
    id: 'organization-id',
    enableWallet: false,
  };

  function buildService(existingCurrency?: any, organizationData = organization) {
    const currenciesRepository = {
      findByOrganizationId: jest.fn().mockResolvedValue(existingCurrency),
      create: jest.fn(),
    };

    const organizationsRepository = {
      findById: jest.fn().mockResolvedValue(organizationData),
    };

    return {
      service: new CreateCurrencyService(
        currenciesRepository as any,
        organizationsRepository as any,
      ),
      currenciesRepository,
    };
  }

  test('returns the existing organization currency', async () => {
    const existingCurrency = {
      id: 'existing-currency-id',
      organization_id: organization.id,
      status: EnumStatus.Inactive,
    };

    const { service, currenciesRepository } =
      buildService(existingCurrency);

    await expect(
      service.execute({
        organization_id: organization.id,
        enableWallet: false,
      }),
    ).resolves.toBe(existingCurrency);

    expect(currenciesRepository.create).not.toHaveBeenCalled();
  });

  test('creates one currency when the organization has none', async () => {
    const { service, currenciesRepository } = buildService();

    await service.execute({
      organization_id: organization.id,
      enableWallet: false,
    });

    expect(currenciesRepository.create).toHaveBeenCalledTimes(1);
    expect(currenciesRepository.create).toHaveBeenCalledWith({
      organization_id: organization.id,
      status: EnumStatus.Inactive,
    });
  });

  test('does not create a currency for an enabled organization wallet', async () => {
    const { service, currenciesRepository } = buildService(undefined, {
      ...organization,
      enableWallet: true,
    });

    await service.execute({
      organization_id: organization.id,
      enableWallet: true,
    });

    expect(currenciesRepository.create).not.toHaveBeenCalled();
  });
});
