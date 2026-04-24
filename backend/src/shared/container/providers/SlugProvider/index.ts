import { container } from 'tsyringe';
import SlugProvider from './implementations/SlugProvider';
import ISlugProvider from './models/ISlugProvider';

container.registerSingleton<ISlugProvider>('SlugProvider', SlugProvider);
