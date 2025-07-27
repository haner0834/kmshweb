export const getClientDeviceId = (): string => {
  const key = "clientDeviceId";
  let deviceId = localStorage.getItem(key);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
};
