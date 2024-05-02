export interface Loggable {
  default?(message: string): Promise<void> | void;
  info?(message: string): Promise<void> | void;
  warn(message: string): Promise<void> | void;
  error(message: string): Promise<void> | void;
  success(message: string): Promise<void> | void;
}
