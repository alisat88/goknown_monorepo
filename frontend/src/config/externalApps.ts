const configuredUrl = (
  value: string | undefined,
  defaultUrl: string
): string => {
  const trimmed = value?.trim();

  return trimmed || defaultUrl;
};

export const KNOWNCOMPUTE_URL = configuredUrl(
  process.env.REACT_APP_KNOWNCOMPUTE_URL,
  "https://knowncompute.ai"
);

export const ZTA_COIN_URL = configuredUrl(
  process.env.REACT_APP_ZTA_COIN_URL,
  "https://zta-coin.org"
);

export const DAPP_BUILDER_URL = configuredUrl(
  process.env.REACT_APP_DAPP_BUILDER_URL,
  "http://localhost:5173"
);
