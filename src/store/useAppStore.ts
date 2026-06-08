import { create } from 'zustand';
import {
  MediaItem,
  Screen,
  ScreenGroup,
  Playlist,
  ScheduleItem,
  EmergencyBroadcast,
  ApprovalRecord,
  PublishRecord,
  WindowKey,
} from '../types';
import {
  mockMediaItems,
  mockScreens,
  mockScreenGroups,
  mockPlaylists,
  mockScheduleItems,
  mockEmergencyBroadcasts,
  mockApprovalRecords,
  mockPublishRecords,
} from '../mock/data';

interface AppState {
  currentWindow: WindowKey;
  mediaItems: MediaItem[];
  screens: Screen[];
  screenGroups: ScreenGroup[];
  playlists: Playlist[];
  scheduleItems: ScheduleItem[];
  emergencyBroadcasts: EmergencyBroadcast[];
  approvalRecords: ApprovalRecord[];
  publishRecords: PublishRecord[];
  selectedMediaIds: string[];
  selectedPlaylistId: string | null;

  setCurrentWindow: (window: WindowKey) => void;
  
  addMedia: (media: MediaItem) => void;
  updateMedia: (id: string, updates: Partial<MediaItem>) => void;
  deleteMedia: (id: string) => void;
  batchUpdateMedia: (ids: string[], updates: Partial<MediaItem>) => void;
  batchDeleteMedia: (ids: string[]) => void;
  
  addScreenGroup: (group: ScreenGroup) => void;
  updateScreenGroup: (id: string, updates: Partial<ScreenGroup>) => void;
  deleteScreenGroup: (id: string) => void;
  
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  copyPlaylist: (id: string) => void;
  submitPlaylistApproval: (id: string) => void;
  withdrawPlaylist: (id: string) => void;
  
  addSchedule: (schedule: ScheduleItem) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedulePause: (id: string) => void;
  
  addEmergency: (emergency: EmergencyBroadcast) => void;
  updateEmergency: (id: string, updates: Partial<EmergencyBroadcast>) => void;
  deleteEmergency: (id: string) => void;
  
  approveRecord: (id: string, approver: string, comment?: string) => void;
  rejectRecord: (id: string, approver: string, comment: string) => void;
  
  addPublishRecord: (record: PublishRecord) => void;
  updatePublishRecord: (id: string, updates: Partial<PublishRecord>) => void;
  
  setSelectedMediaIds: (ids: string[]) => void;
  setSelectedPlaylistId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentWindow: 'mediaLibrary',
  mediaItems: mockMediaItems,
  screens: mockScreens,
  screenGroups: mockScreenGroups,
  playlists: mockPlaylists,
  scheduleItems: mockScheduleItems,
  emergencyBroadcasts: mockEmergencyBroadcasts,
  approvalRecords: mockApprovalRecords,
  publishRecords: mockPublishRecords,
  selectedMediaIds: [],
  selectedPlaylistId: null,

  setCurrentWindow: (window) => set({ currentWindow: window }),

  addMedia: (media) => set((state) => ({
    mediaItems: [media, ...state.mediaItems],
  })),

  updateMedia: (id, updates) => set((state) => ({
    mediaItems: state.mediaItems.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
  })),

  deleteMedia: (id) => set((state) => ({
    mediaItems: state.mediaItems.filter((m) => m.id !== id),
  })),

  batchUpdateMedia: (ids, updates) => set((state) => ({
    mediaItems: state.mediaItems.map((m) =>
      ids.includes(m.id) ? { ...m, ...updates } : m
    ),
  })),

  batchDeleteMedia: (ids) => set((state) => ({
    mediaItems: state.mediaItems.filter((m) => !ids.includes(m.id)),
  })),

  addScreenGroup: (group) => set((state) => ({
    screenGroups: [...state.screenGroups, group],
  })),

  updateScreenGroup: (id, updates) => set((state) => ({
    screenGroups: state.screenGroups.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    ),
  })),

  deleteScreenGroup: (id) => set((state) => ({
    screenGroups: state.screenGroups.filter((g) => g.id !== id),
  })),

  addPlaylist: (playlist) => set((state) => ({
    playlists: [playlist, ...state.playlists],
  })),

  updatePlaylist: (id, updates) => set((state) => ({
    playlists: state.playlists.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  deletePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter((p) => p.id !== id),
  })),

  copyPlaylist: (id) => {
    const playlist = get().playlists.find((p) => p.id === id);
    if (playlist) {
      const newPlaylist: Playlist = {
        ...playlist,
        id: `p${Date.now()}`,
        name: `${playlist.name} - 副本`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: playlist.items.map((item) => ({
          ...item,
          id: `pi${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        })),
      };
      set((state) => ({
        playlists: [newPlaylist, ...state.playlists],
      }));
    }
  },

  submitPlaylistApproval: (id) => {
    const playlist = get().playlists.find((p) => p.id === id);
    if (playlist) {
      set((state) => ({
        playlists: state.playlists.map((p) =>
          p.id === id ? { ...p, status: 'pending' } : p
        ),
        approvalRecords: [
          {
            id: `a${Date.now()}`,
            type: 'playlist',
            targetId: id,
            targetName: playlist.name,
            submitter: '当前用户',
            submitTime: new Date().toISOString(),
            status: 'pending',
          },
          ...state.approvalRecords,
        ],
      }));
    }
  },

  withdrawPlaylist: (id) => set((state) => ({
    playlists: state.playlists.map((p) =>
      p.id === id ? { ...p, status: 'draft' } : p
    ),
    approvalRecords: state.approvalRecords.filter(
      (r) => !(r.targetId === id && r.type === 'playlist' && r.status === 'pending')
    ),
  })),

  addSchedule: (schedule) => set((state) => ({
    scheduleItems: [schedule, ...state.scheduleItems],
  })),

  updateSchedule: (id, updates) => set((state) => ({
    scheduleItems: state.scheduleItems.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  deleteSchedule: (id) => set((state) => ({
    scheduleItems: state.scheduleItems.filter((s) => s.id !== id),
  })),

  toggleSchedulePause: (id) => set((state) => ({
    scheduleItems: state.scheduleItems.map((s) =>
      s.id === id ? { ...s, isPaused: !s.isPaused } : s
    ),
  })),

  addEmergency: (emergency) => set((state) => ({
    emergencyBroadcasts: [emergency, ...state.emergencyBroadcasts],
  })),

  updateEmergency: (id, updates) => set((state) => ({
    emergencyBroadcasts: state.emergencyBroadcasts.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    ),
  })),

  deleteEmergency: (id) => set((state) => ({
    emergencyBroadcasts: state.emergencyBroadcasts.filter((e) => e.id !== id),
  })),

  approveRecord: (id, approver, comment) => set((state) => {
    const record = state.approvalRecords.find((r) => r.id === id);
    if (!record) return state;

    let playlists = state.playlists;
    if (record.type === 'playlist') {
      playlists = state.playlists.map((p) =>
        p.id === record.targetId ? { ...p, status: 'approved' } : p
      );
    }

    return {
      approvalRecords: state.approvalRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              approver,
              approveTime: new Date().toISOString(),
              comment,
            }
          : r
      ),
      playlists,
    };
  }),

  rejectRecord: (id, approver, comment) => set((state) => {
    const record = state.approvalRecords.find((r) => r.id === id);
    if (!record) return state;

    let playlists = state.playlists;
    if (record.type === 'playlist') {
      playlists = state.playlists.map((p) =>
        p.id === record.targetId ? { ...p, status: 'rejected' } : p
      );
    }

    return {
      approvalRecords: state.approvalRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              approver,
              approveTime: new Date().toISOString(),
              comment,
            }
          : r
      ),
      playlists,
    };
  }),

  addPublishRecord: (record) => set((state) => ({
    publishRecords: [record, ...state.publishRecords],
  })),

  updatePublishRecord: (id, updates) => set((state) => ({
    publishRecords: state.publishRecords.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    ),
  })),

  setSelectedMediaIds: (ids) => set({ selectedMediaIds: ids }),
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id }),
}));
