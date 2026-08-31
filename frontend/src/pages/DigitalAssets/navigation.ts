export function getDigitalAssetReturnPath(
  baseNavigationPath: string,
  folderId?: string
): string {
  if (folderId) {
    return baseNavigationPath
      ? `${baseNavigationPath}/folders/${folderId}`
      : `/digitalassets/folders/${folderId}`;
  }

  return `${baseNavigationPath}/digitalassets`;
}
