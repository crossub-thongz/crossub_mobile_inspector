export type JobWorkspaceView = 'areas' | 'inspect';

export function parseJobWorkspaceView(
  requested: string | null,
  areaSetupComplete: boolean,
): JobWorkspaceView {
  if (requested === 'areas') return 'areas';
  if (requested === 'inspect') return 'inspect';
  return areaSetupComplete ? 'inspect' : 'areas';
}
