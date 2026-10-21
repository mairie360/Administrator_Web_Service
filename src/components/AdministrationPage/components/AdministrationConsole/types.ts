export type RunAction = (
  key: string,
  successMessage: string,
  action: () => Promise<unknown>,
  refresh?: () => Promise<unknown>,
) => Promise<boolean>;
