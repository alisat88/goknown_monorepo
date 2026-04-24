import { container } from 'tsyringe';

import IHashProvider from './HashProvider/models/IHashProvider';
import BCryptHashProvider from './HashProvider/implementations/BCryptHashProvider';

import IPinProvider from './PinProvider/models/IPinProvider';
import PinProvider from './PinProvider/implementations/PinProvider';

import './TwoFactorProvider';

container.registerSingleton<IHashProvider>('HashProvider', BCryptHashProvider);
container.registerSingleton<IPinProvider>('PinProvider', PinProvider);
