let webAppUrl = '';

export function setWebAppUrl(url: string): void {
  webAppUrl = url.trim();
}

export async function syncProgress(
  studentId: string,
  name: string,
  completedStages: number[],
): Promise<void> {
  if (!studentId || !name || !webAppUrl) return;

  const stages: Record<string, boolean> = {};
  for (let i = 1; i <= 6; i++) {
    stages[i] = completedStages.includes(i);
  }

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ studentId, name, stages }),
    });
  } catch {
    // Silent fail
  }
}
