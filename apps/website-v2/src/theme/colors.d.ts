/**
 * Type declarations for colors.js
 */

export interface HubColors {
  base: string;
  glow: string;
  muted: string;
  gradient: string;
}

export interface Colors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  border: {
    subtle: string;
    default: string;
    hover: string;
    active: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    inverse: string;
  };
  hub: {
    sator: HubColors;
    rotas: HubColors;
    arepo: HubColors;
    opera: HubColors;
    tenet: HubColors;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
    live: string;
  };
  glass: {
    light: string;
    medium: string;
    heavy: string;
    border: string;
  };
  // Porcelain design system aliases
  porcelain?: {
    frost: string;
  };
}

export declare const colors: Colors;
export default colors;
