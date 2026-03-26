import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildNavigationUrl,
  linkingNavigationAdapter,
  navigationAppOptions,
} from '@maayanhot/navigation-core';
import { __resetLinkingMocks, canOpenURL, openURL } from '../mocks/expo-linking';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-linking', async () => import('../mocks/expo-linking'));

afterEach(() => {
  __resetLinkingMocks();
});

describe('navigation-core', () => {
  it('keeps the public navigation surface app-oriented and provider URL generation internal to the package', () => {
    expect(navigationAppOptions).toEqual([
      {
        app: 'google_maps',
        label: 'Google Maps',
      },
      {
        app: 'apple_maps',
        label: 'Apple Maps',
      },
      {
        app: 'waze',
        label: 'Waze',
      },
    ]);
  });

  it('builds provider URLs and opens them through expo-linking', async () => {
    const googleUrl = buildNavigationUrl({
      app: 'google_maps',
      destination: {
        coordinate: {
          latitude: 31.7454,
          longitude: 35.1691,
        },
        label: 'עין חניה',
      },
      travelMode: 'walking',
    });

    expect(googleUrl).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=31.7454%2C35.1691&travelmode=walking',
    );

    await linkingNavigationAdapter.open({
      app: 'waze',
      destination: {
        coordinate: {
          latitude: 31.7454,
          longitude: 35.1691,
        },
        label: 'עין חניה',
      },
      travelMode: 'driving',
    });

    expect(openURL).toHaveBeenCalledWith(
      'https://www.waze.com/ul?ll=31.7454%2C35.1691&navigate=yes',
    );
  });

  it('checks app reachability through expo-linking without leaking the provider call into screens', async () => {
    await linkingNavigationAdapter.canOpen('apple_maps');

    expect(canOpenURL).toHaveBeenCalledWith('http://maps.apple.com/');
  });

  it('keeps screen-level files free of direct provider URLs and expo-linking calls', () => {
    const mapBrowseSource = readFileSync(
      resolve(process.cwd(), 'apps/mobile/src/features/map-browse/MapBrowseScreen.tsx'),
      'utf8',
    );
    const teaserSource = readFileSync(
      resolve(process.cwd(), 'apps/mobile/src/features/map-browse/SelectedSpringTeaser.tsx'),
      'utf8',
    );
    const detailSource = readFileSync(
      resolve(process.cwd(), 'apps/mobile/src/features/spring-detail/SpringDetailScreen.tsx'),
      'utf8',
    );
    const detailViewSource = readFileSync(
      resolve(process.cwd(), 'apps/mobile/src/features/spring-detail/SpringDetailView.tsx'),
      'utf8',
    );

    expect(mapBrowseSource).not.toContain('expo-linking');
    expect(teaserSource).not.toContain('expo-linking');
    expect(detailSource).not.toContain('expo-linking');
    expect(detailViewSource).not.toContain('expo-linking');
    expect(detailSource).not.toContain('google.com/maps');
    expect(detailSource).not.toContain('maps.apple.com');
    expect(detailSource).not.toContain('waze.com/ul');
  });
});
