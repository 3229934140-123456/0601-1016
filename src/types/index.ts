export type MediaType = 'image' | 'video';

export type CropRatio = '16:9' | '9:16' | '1:1' | '4:3' | 'free';

export interface CropConfig {
  ratio: CropRatio;
  positionX: number;
  positionY: number;
}

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnail: string;
  size: number;
  duration?: number;
  tags: string[];
  validFrom: string;
  validTo: string;
  usageCount: number;
  createdAt: string;
  status: 'active' | 'expired' | 'draft';
  crop?: CropConfig;
}

export interface Screen {
  id: string;
  name: string;
  location: string;
  floor: number;
  groupId?: string;
  resolution: string;
  orientation: 'landscape' | 'portrait';
  status: 'online' | 'offline' | 'error';
  ip?: string;
}

export interface ScreenGroup {
  id: string;
  name: string;
  floor: number;
  screenIds: string[];
  description?: string;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  mediaName?: string;
  duration: number;
  order: number;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy: string;
  totalDuration: number;
}

export interface ScheduleItem {
  id: string;
  playlistId: string;
  playlistName?: string;
  screenGroupId: string;
  screenGroupName?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  isHoliday: boolean;
  isPaused: boolean;
}

export interface EmergencyBroadcast {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'warning' | 'emergency';
  screenGroupIds: string[];
  startTime: string;
  endTime?: string;
  status: 'active' | 'ended' | 'draft';
  createdBy: string;
  createdAt: string;
}

export interface ApprovalRecord {
  id: string;
  type: 'playlist' | 'schedule' | 'emergency';
  targetId: string;
  targetName: string;
  submitter: string;
  submitTime: string;
  approver?: string;
  approveTime?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

export interface PublishRecord {
  id: string;
  type: 'playlist' | 'schedule' | 'emergency';
  targetId: string;
  targetName: string;
  screenGroupName: string;
  publishTime: string;
  operator: string;
  status: 'success' | 'failed' | 'publishing';
  detail?: string;
}

export type WindowKey = 
  | 'mediaLibrary'
  | 'screenGroups'
  | 'playlist'
  | 'schedule'
  | 'emergency'
  | 'approval'
  | 'preview'
  | 'publishRecord';
