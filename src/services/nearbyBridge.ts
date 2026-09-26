import { PermissionsAndroid, Platform } from 'react-native';

type Nearby = typeof import('expo-nearby-connections');
let nearbyModule: Nearby | null = null;

const nearby = async (): Promise<Nearby> => {
  if (Platform.OS === 'web') throw new Error('Offline transfer requires the QRVerse development build on Android or iOS.');
  if (Platform.OS === 'android' && Number(Platform.Version) >= 23) {
    const apiLevel = Number(Platform.Version);
    const requested = apiLevel >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          ...(apiLevel >= 33 ? [PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES] : []),
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    const result = await PermissionsAndroid.requestMultiple(requested);
    if (Object.values(result).some(status => status !== PermissionsAndroid.RESULTS.GRANTED)) {
      throw new Error('Nearby device permissions are required to transfer files.');
    }
  }
  nearbyModule ??= await import('expo-nearby-connections');
  return nearbyModule;
};

export const startNearbyAdvertising = async (deviceName: string) => {
  const module = await nearby();
  const stopInvitation = module.onInvitationReceived(({ peerId }) => { void module.acceptConnection(peerId); });
  return { peerId: await module.startAdvertise(deviceName), stopInvitation };
};

export const connectToNearbyPeer = async (peerId: string) => (await nearby()).requestConnection(peerId);
export const startNearbyDiscovery = async (deviceName: string) => (await nearby()).startDiscovery(deviceName);
export const sendNearbyText = async (peerId: string, text: string) => (await nearby()).sendText(peerId, text);
export const stopNearby = async () => {
  if (!nearbyModule) return;
  await Promise.allSettled([nearbyModule.stopAdvertise(), nearbyModule.stopDiscovery(), nearbyModule.disconnect()]);
  nearbyModule = null;
};

export const onNearbyConnected = async (listener: Parameters<Nearby['onConnected']>[0]) => (await nearby()).onConnected(listener);
export const onNearbyText = async (listener: Parameters<Nearby['onTextReceived']>[0]) => (await nearby()).onTextReceived(listener);
export const onNearbyPeerFound = async (listener: Parameters<Nearby['onPeerFound']>[0]) => (await nearby()).onPeerFound(listener);
