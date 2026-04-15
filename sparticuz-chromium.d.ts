/** Ambient types when @sparticuz/chromium is not installed in the root workspace (backend installs it separately). */
declare module '@sparticuz/chromium' {
  const chromium: {
    executablePath(): Promise<string>;
    args: string[];
    defaultViewport: { width: number; height: number };
  };
  export default chromium;
}
