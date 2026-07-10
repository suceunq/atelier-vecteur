export interface Command {
  label: string;
  do(): void;
  undo(): void;
}
