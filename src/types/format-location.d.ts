// TODO(@camillateodoro) Remove when port format-location to TypeScript.
declare module 'format-location' {
  interface Location {
    address?: string;
    address2?: string | null;
    city?: string;
    zip?: string;
    state?: string;
  }
  function formatLocation(location: Location, formatString: string): string;
  export default formatLocation;
}
