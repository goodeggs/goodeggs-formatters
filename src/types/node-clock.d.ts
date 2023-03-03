// TODO(@camillateodoro) Remove when migrate to Moment.
declare module 'node-clock' {
  interface TZFunc {
    (value: string): number & Date;
    tzid: string;
  }
  const clock: {
    utc: TZFunc;
    extendNumber(): void;
    tz(date: number | string, format?: string, tz?: string): string;
    now(): number;
    pacific: TZFunc;
  };

  export default clock;
}
