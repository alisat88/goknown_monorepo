/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
export default interface IStorageProvider {
  saveFile(
    file: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string } | undefined>;
  downloadFile(
    file: string,
    destination: string,
    folder?: string,
  ): Promise<void>;
  uploadFile(
    sourcePath: string,
    filename: string,
    folder?: string,
  ): Promise<{ filename: string; mimetype: string }>;
  deleteFile(file: string, folder?: string): Promise<void>;
}
