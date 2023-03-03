// TODO(@camillateodoro) Remove when port getto to TypeScript.
declare module 'getto' {
  function getto(code: unknown): {get: (value: string) => string & number};
  export default getto;
}
