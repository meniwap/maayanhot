const copiedFiles = new Map<string, string>();
const directories = new Set<string>();

export const documentDirectory = 'file:///documents/';

export const copyAsync = async (options: { from: string; to: string }) => {
  copiedFiles.set(options.to, options.from);
};

export const deleteAsync = async (uri: string) => {
  copiedFiles.delete(uri);
};

export const getInfoAsync = async (uri: string) => ({
  exists: directories.has(uri) || copiedFiles.has(uri),
});

export const makeDirectoryAsync = async (uri: string) => {
  directories.add(uri);
};

export const __resetFileSystem = () => {
  copiedFiles.clear();
  directories.clear();
};
