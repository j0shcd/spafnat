declare module 'virtual:spaf-qpdf-core' {
  interface QpdfCore {
    callMain(args: string[]): number;
    FS: {
      mkdir(path: string): void;
      writeFile(path: string, bytes: Uint8Array): void;
      readFile(path: string): Uint8Array;
      unlink(path: string): void;
    };
  }
  export default function createQpdf(options: {
    locateFile: () => string;
    noInitialRun: boolean;
    noExitRuntime: boolean;
    print: () => void;
    printErr: () => void;
  }): Promise<QpdfCore>;
}
