import type { GeoPoint, NavigationApp, SpringId } from '@maayanhot/contracts';
import * as Linking from 'expo-linking';

export type NavigationDestination = {
  springId?: SpringId;
  label: string;
  coordinate: GeoPoint;
};

export type NavigationHandoffRequest = {
  app: NavigationApp;
  destination: NavigationDestination;
  sourceLabel?: string | null;
  travelMode?: 'driving' | 'walking';
};

export interface ExternalNavigationAdapter {
  canOpen(app: NavigationApp): Promise<boolean>;
  open(request: NavigationHandoffRequest): Promise<void>;
}

export type NavigationAppOption = {
  app: NavigationApp;
  label: string;
};

const navigationRoots: Record<NavigationApp, string> = {
  apple_maps: 'http://maps.apple.com/',
  google_maps: 'https://www.google.com/maps',
  waze: 'https://www.waze.com/ul',
};

export const navigationAppOptions: NavigationAppOption[] = [
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
];

const toCoordinateString = ({ latitude, longitude }: GeoPoint) => `${latitude},${longitude}`;

const toAppleDirectionsMode = (travelMode: NavigationHandoffRequest['travelMode']) =>
  travelMode === 'walking' ? 'w' : 'd';

export const buildNavigationUrl = (request: NavigationHandoffRequest) => {
  const coordinate = toCoordinateString(request.destination.coordinate);

  if (request.app === 'apple_maps') {
    const params = new URLSearchParams({
      daddr: coordinate,
      dirflg: toAppleDirectionsMode(request.travelMode),
    });

    return `${navigationRoots.apple_maps}?${params.toString()}`;
  }

  if (request.app === 'google_maps') {
    const params = new URLSearchParams({
      api: '1',
      destination: coordinate,
      travelmode: request.travelMode ?? 'driving',
    });

    return `${navigationRoots.google_maps}/dir/?${params.toString()}`;
  }

  const params = new URLSearchParams({
    ll: coordinate,
    navigate: 'yes',
  });

  return `${navigationRoots.waze}?${params.toString()}`;
};

export const linkingNavigationAdapter: ExternalNavigationAdapter = {
  canOpen: async (app) => Linking.canOpenURL(navigationRoots[app]),
  open: async (request) => {
    await Linking.openURL(buildNavigationUrl(request));
  },
};
