import 'vitest';

declare module 'vitest' {
  interface ProvidedContext {
    installDir: string;
    toolsPath: string;
    tarballPath: string;
  }
}
