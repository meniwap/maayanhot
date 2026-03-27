type NetworkState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

const listeners = new Set<(state: NetworkState) => void>();

let currentState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
};

export const getNetworkStateAsync = async () => currentState;

export const addNetworkStateListener = (listener: (state: NetworkState) => void) => {
  listeners.add(listener);

  return {
    remove() {
      listeners.delete(listener);
    },
  };
};

export const __resetNetworkState = () => {
  currentState = {
    isConnected: true,
    isInternetReachable: true,
  };
  listeners.clear();
};

export const __setNetworkState = (nextState: Partial<NetworkState>) => {
  currentState = {
    ...currentState,
    ...nextState,
  };

  for (const listener of listeners) {
    listener(currentState);
  }
};
