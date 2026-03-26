import { vi } from 'vitest';

type PermissionStatus = 'granted' | 'denied';

type PickerAsset = {
  assetId?: string | null;
  exif?: Record<string, string> | null;
  fileSize?: number | null;
  height?: number | null;
  mimeType?: string | null;
  uri: string;
  width?: number | null;
};

let cameraPermission: PermissionStatus = 'granted';
let libraryPermission: PermissionStatus = 'granted';
let nextCameraResult: { assets: PickerAsset[]; canceled: false } | { assets: []; canceled: true } =
  { assets: [], canceled: true };
let nextLibraryResult: { assets: PickerAsset[]; canceled: false } | { assets: []; canceled: true } =
  { assets: [], canceled: true };

export const __resetImagePickerMocks = () => {
  cameraPermission = 'granted';
  libraryPermission = 'granted';
  nextCameraResult = { assets: [], canceled: true };
  nextLibraryResult = { assets: [], canceled: true };
  requestCameraPermissionsAsync.mockClear();
  requestMediaLibraryPermissionsAsync.mockClear();
  launchCameraAsync.mockClear();
  launchImageLibraryAsync.mockClear();
};

export const __setCameraPermission = (status: PermissionStatus) => {
  cameraPermission = status;
};

export const __setLibraryPermission = (status: PermissionStatus) => {
  libraryPermission = status;
};

export const __setNextCameraResult = (assets: PickerAsset[]) => {
  nextCameraResult =
    assets.length > 0 ? { assets, canceled: false } : { assets: [], canceled: true };
};

export const __setNextLibraryResult = (assets: PickerAsset[]) => {
  nextLibraryResult =
    assets.length > 0 ? { assets, canceled: false } : { assets: [], canceled: true };
};

export const requestCameraPermissionsAsync = vi.fn(async () => ({
  granted: cameraPermission === 'granted',
  status: cameraPermission,
}));

export const requestMediaLibraryPermissionsAsync = vi.fn(async () => ({
  granted: libraryPermission === 'granted',
  status: libraryPermission,
}));

export const launchCameraAsync = vi.fn(async () => nextCameraResult);
export const launchImageLibraryAsync = vi.fn(async () => nextLibraryResult);
