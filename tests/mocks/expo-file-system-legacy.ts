const copiedFiles = new Map<string, string>();
const directories = new Set<string>();
const fileSizes = new Map<string, number | null>();

export const documentDirectory = 'file:///documents/';

export const copyAsync = async (options: { from: string; to: string }) => {
  copiedFiles.set(options.to, options.from);
  fileSizes.set(options.to, fileSizes.get(options.from) ?? null);
};

export const deleteAsync = async (uri: string) => {
  copiedFiles.delete(uri);
  fileSizes.delete(uri);
};

export const getInfoAsync = async (uri: string) => ({
  exists: directories.has(uri) || copiedFiles.has(uri),
  size: fileSizes.get(uri) ?? null,
});

export const makeDirectoryAsync = async (uri: string) => {
  directories.add(uri);
};

export const __resetFileSystem = () => {
  copiedFiles.clear();
  directories.clear();
  fileSizes.clear();
};

export const __setFileInfo = (uri: string, size: number | null) => {
  fileSizes.set(uri, size);
};
