import type { GeoPoint, NavigationApp, SpringId } from '@maayanhot/contracts';

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
