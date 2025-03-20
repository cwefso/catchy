declare module "dom-screen-capture" {
  interface MediaTrackConstraintSet {
    selfBrowserSurface?: "include" | "exclude";
    systemAudio?: "include" | "exclude";
  }
}
