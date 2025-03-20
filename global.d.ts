// global.d.ts
declare namespace YT {
  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: PlayerEvents;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    rel?: 0 | 1;
    origin?: string;
    enablejsapi?: 0 | 1;
    modestbranding?: 0 | 1;
    fs?: 0 | 1;
    iv_load_policy?: 1 | 3;
    playsinline?: 0 | 1;
  }

  interface PlayerEvents {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: number;
  }

  interface OnErrorEvent {
    data: number;
  }

  class Player {
    constructor(elementId: string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    getPlayerState(): number;
    destroy(): void;
    getIframe(): HTMLIFrameElement;
  }

  const PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
}

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
