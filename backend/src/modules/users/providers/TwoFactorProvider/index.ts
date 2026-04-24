import { container } from 'tsyringe';
import twofactorConfig from '@config/twofactor';

import ITwoFactorProvider from './models/ITwoFactorProvider';
import TwoFactorProvider from './implementations/TwoFactorProvider';

import ISMSTwoFactorProvider from './models/ISMSTwoFactorProvider';
import SMSTwoFactorProvider from './implementations/SMSTwoFactorProvider';

container.registerSingleton<ITwoFactorProvider>(
  'TwoFactorProvider',
  TwoFactorProvider,
);

container.registerSingleton<ISMSTwoFactorProvider>(
  'SMSTwoFactorProvider',
  SMSTwoFactorProvider,
);
