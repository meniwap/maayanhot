import { vi } from 'vitest';

export const canOpenURL = vi.fn(async () => true);
export const openURL = vi.fn(async () => true);

export const __resetLinkingMocks = () => {
  canOpenURL.mockReset();
  canOpenURL.mockResolvedValue(true);
  openURL.mockReset();
  openURL.mockResolvedValue(true);
};
