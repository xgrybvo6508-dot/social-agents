export type Clock = () => number;

export const now: Clock = () => Date.now();

export const startOfLocalDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
