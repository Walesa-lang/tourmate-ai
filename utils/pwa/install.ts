export type InstallAvailability = "hidden" | "prompt" | "ios";

export type InstallEnvironment = {
  isStandalone: boolean;
  isDismissed: boolean;
  hasPrompt: boolean;
  isIosSafari: boolean;
};

export function getInstallAvailability(environment: InstallEnvironment): InstallAvailability {
  if (environment.isStandalone || environment.isDismissed) return "hidden";
  if (environment.hasPrompt) return "prompt";
  if (environment.isIosSafari) return "ios";
  return "hidden";
}

export function isIosSafari(userAgent: string) {
  const isIos = /iPad|iPhone|iPod/.test(userAgent);
  const isAlternativeBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return isIos && !isAlternativeBrowser;
}
