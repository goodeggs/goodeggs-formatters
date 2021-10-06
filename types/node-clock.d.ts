declare module 'node-clock' {
    interface UTC {
        tzid: string;
    }
    
    const clock: {
        utc: UTC;
        extendNumber(): void;
        tz(date: number | string, format?: string, tz?: string): string;
        now: any;
        pacific: any;
      };
    
    export default clock;
}
