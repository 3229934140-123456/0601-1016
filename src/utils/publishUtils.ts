import { PublishGroupResult, PublishScreenResult, Screen, ScreenGroup } from '../types';

export function generatePublishResults(
  screenGroups: ScreenGroup[],
  screens: Screen[],
  groupIds: string[]
): PublishGroupResult[] {
  return groupIds.map((groupId) => {
    const group = screenGroups.find((g) => g.id === groupId);
    const groupScreens = screens.filter((s) => s.groupId === groupId);

    const screenResults: PublishScreenResult[] = groupScreens.map((screen) => {
      let status: 'success' | 'failed' | 'publishing';
      let errorMessage: string | undefined;

      if (screen.status === 'offline') {
        status = 'failed';
        errorMessage = '屏幕离线，发布失败';
      } else if (screen.status === 'error') {
        status = 'failed';
        errorMessage = '屏幕异常，发布失败';
      } else {
        status = 'success';
      }

      return {
        screenId: screen.id,
        screenName: screen.name,
        status,
        errorMessage,
        finishedTime: status !== 'publishing' ? new Date().toISOString() : undefined,
      };
    });

    return {
      groupId,
      groupName: group?.name || '未知屏幕组',
      screens: screenResults,
    };
  });
}

export function calculatePublishStats(groups: PublishGroupResult[]): {
  successCount: number;
  failedCount: number;
  totalCount: number;
  overallStatus: 'success' | 'failed' | 'publishing' | 'partial';
} {
  let successCount = 0;
  let failedCount = 0;
  let totalCount = 0;

  groups.forEach((group) => {
    group.screens.forEach((screen) => {
      totalCount++;
      if (screen.status === 'success') {
        successCount++;
      } else if (screen.status === 'failed') {
        failedCount++;
      }
    });
  });

  let overallStatus: 'success' | 'failed' | 'publishing' | 'partial';
  if (failedCount === 0 && successCount > 0) {
    overallStatus = 'success';
  } else if (successCount === 0 && failedCount > 0) {
    overallStatus = 'failed';
  } else if (successCount > 0 && failedCount > 0) {
    overallStatus = 'partial';
  } else {
    overallStatus = 'publishing';
  }

  return { successCount, failedCount, totalCount, overallStatus };
}

export function getFailedScreenIds(groups: PublishGroupResult[]): string[] {
  const ids: string[] = [];
  groups.forEach((group) => {
    group.screens.forEach((screen) => {
      if (screen.status === 'failed') {
        ids.push(screen.screenId);
      }
    });
  });
  return ids;
}
