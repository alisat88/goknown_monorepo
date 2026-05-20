import { container } from 'tsyringe';

import IChecksumProvider from './ChecksumProvider/models/IChecksumProvider';
import ChecksumProvider from './ChecksumProvider/implementations/ChecksumProvider';

container.registerInstance<IChecksumProvider>(
  'ChecksumProvider',
  container.resolve(ChecksumProvider),
);
