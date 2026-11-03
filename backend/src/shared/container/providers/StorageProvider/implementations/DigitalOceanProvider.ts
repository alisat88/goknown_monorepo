/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
// Kept as a compatibility import for code outside the container registration.
// DigitalOcean Spaces implements the S3 API, so it uses the shared provider.
export { default } from './S3StorageProvider';
