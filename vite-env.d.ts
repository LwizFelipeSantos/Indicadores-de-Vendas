// Type definitions for Vite environment
// Replaces /// <reference types="vite/client" /> to avoid missing type definition errors

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.bmp' {
  const value: string;
  export default value;
}

declare module '*.ico' {
  const value: string;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  
  readonly url: string;
  
  readonly glob: (
    pattern: string,
    options?: {
      as?: string;
      eager?: boolean;
      import?: string;
      query?: string | Record<string, string | number | boolean>;
    }
  ) => Record<string, () => Promise<any>>;
}
