declare module 'accouting' {
  interface Accounting {
    settings: {
      currency: {
        format: {
          pos: string;
          neg: string;
          zero: string;
        };
      };
    };
  }
  export default Accounting;
}
