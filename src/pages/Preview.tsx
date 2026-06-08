import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Tabs,
  Row,
  Col,
  Tag,
  Progress,
  Tooltip,
  List,
  Image,
  Empty,
  Badge,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  FullscreenOutlined,
  DesktopOutlined,
  MobileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { PlaylistItem } from '../types';

const { TabPane } = Tabs;

export default function Preview() {
  const { playlists, mediaItems, selectedPlaylistId, setSelectedPlaylistId } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) || playlists[0] || null,
    [playlists, selectedPlaylistId]
  );

  const currentItem: PlaylistItem | null = useMemo(() => {
    if (!selectedPlaylist || selectedPlaylist.items.length === 0) return null;
    return selectedPlaylist.items[currentIndex] || null;
  }, [selectedPlaylist, currentIndex]);

  const currentMedia = useMemo(() => {
    if (!currentItem) return null;
    return mediaItems.find((m) => m.id === currentItem.mediaId) || null;
  }, [currentItem, mediaItems]);

  useEffect(() => {
    if (!currentItem || !isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const duration = currentItem.duration;
    const increment = 100 / (duration * 10);

    setProgress(0);
    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, isPlaying, currentItem]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    if (!selectedPlaylist) return;
    setCurrentIndex((prev) =>
      prev <= 0 ? selectedPlaylist.items.length - 1 : prev - 1
    );
    setProgress(0);
  };

  const handleNext = () => {
    if (!selectedPlaylist) return;
    setCurrentIndex((prev) =>
      prev >= selectedPlaylist.items.length - 1 ? 0 : prev + 1
    );
    setProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = currentItem ? (progress / 100) * currentItem.duration : 0;

  const previewStyle = useMemo(() => {
    if (orientation === 'landscape') {
      return {
        width: '100%',
        maxWidth: 640,
        aspectRatio: '16 / 9',
      };
    }
    return {
      width: '100%',
      maxWidth: 360,
      aspectRatio: '9 / 16',
    };
  }, [orientation]);

  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="播放预览"
            extra={
              <Space>
                <Space.Compact>
                  <Tooltip title="横屏预览">
                    <Button
                      type={orientation === 'landscape' ? 'primary' : 'default'}
                      icon={<DesktopOutlined />}
                      onClick={() => setOrientation('landscape')}
                    />
                  </Tooltip>
                  <Tooltip title="竖屏预览">
                    <Button
                      type={orientation === 'portrait' ? 'primary' : 'default'}
                      icon={<MobileOutlined />}
                      onClick={() => setOrientation('portrait')}
                    />
                  </Tooltip>
                </Space.Compact>
                <Button icon={<FullscreenOutlined />}>全屏</Button>
              </Space>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <div
                style={{
                  ...previewStyle,
                  border: '4px solid #333',
                  borderRadius: orientation === 'portrait' ? 24 : 12,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#000',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                {currentMedia ? (
                  <>
                    <Image
                      src={currentMedia.url}
                      alt={currentMedia.name}
                      preview={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {currentMedia.type === 'video' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%',
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 24,
                        }}
                      >
                        <PlayCircleOutlined style={{ fontSize: 32 }} />
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        padding: 16,
                        color: '#fff',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                        {currentMedia.name}
                      </div>
                      <Progress
                        percent={Math.round(progress)}
                        showInfo={false}
                        size="small"
                        strokeColor="#1890ff"
                        style={{ marginBottom: 8 }}
                      />
                      <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(currentItem?.duration || 0)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      background: '#f0f0f0',
                    }}
                  >
                    <Empty description="请选择节目单" />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Space size="large">
                <Button
                  type="text"
                  size="large"
                  icon={<StepBackwardOutlined />}
                  onClick={handlePrev}
                  disabled={!currentItem}
                />
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={handlePlayPause}
                  disabled={!currentItem}
                  style={{ width: 56, height: 56 }}
                />
                <Button
                  type="text"
                  size="large"
                  icon={<StepForwardOutlined />}
                  onClick={handleNext}
                  disabled={!currentItem}
                />
                <Button
                  type="text"
                  icon={<SoundOutlined style={{ color: isMuted ? '#999' : undefined }} />}
                  onClick={() => setIsMuted(!isMuted)}
                />
              </Space>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="选择节目单"
            extra={
              <Select
                style={{ width: 180 }}
                placeholder="选择节目单"
                value={selectedPlaylist?.id}
                onChange={(value) => {
                  setSelectedPlaylistId(value);
                  setCurrentIndex(0);
                  setProgress(0);
                }}
              >
                {playlists.map((p) => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.name}
                  </Select.Option>
                ))}
              </Select>
            }
          >
            {selectedPlaylist ? (
              <div>
                <div style={{ marginBottom: 12, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{selectedPlaylist.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    共 {selectedPlaylist.items.length} 个素材
                    <span style={{ margin: '0 8px' }}>·</span>
                    总时长 {formatTime(selectedPlaylist.totalDuration)}
                  </div>
                </div>

                <div style={{ fontWeight: 500, marginBottom: 8 }}>播放列表</div>
                <List
                  size="small"
                  dataSource={selectedPlaylist.items}
                  renderItem={(item, index) => {
                    const media = mediaItems.find((m) => m.id === item.mediaId);
                    const isActive = index === currentIndex;
                    return (
                      <List.Item
                        style={{
                          cursor: 'pointer',
                          background: isActive ? '#e6f7ff' : 'transparent',
                          borderRadius: 4,
                          padding: '8px 12px',
                          border: isActive ? '1px solid #1890ff' : '1px solid transparent',
                        }}
                        onClick={() => {
                          setCurrentIndex(index);
                          setProgress(0);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <div style={{ width: 24, textAlign: 'center' }}>
                            {isActive && isPlaying ? (
                              <Badge status="processing" />
                            ) : (
                              <span style={{ color: '#999', fontSize: 12 }}>{index + 1}</span>
                            )}
                          </div>
                          {media && (
                            <Image
                              width={48}
                              height={27}
                              src={media.thumbnail}
                              style={{ borderRadius: 2, objectFit: 'cover', margin: '0 8px' }}
                              preview={false}
                            />
                          )}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: isActive ? 500 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.mediaName || item.mediaId}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>
                              {media?.type === 'image' ? <PictureOutlined /> : <VideoCameraOutlined />}
                              {' '}{formatTime(item.duration)}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              </div>
            ) : (
              <Empty description="暂无节目单" />
            )}
          </Card>

          <Card title="播放设置" style={{ marginTop: 16 }}>
            <List size="small">
              <List.Item>
                <span>屏幕方向</span>
                <Tag color={orientation === 'landscape' ? 'blue' : 'green'}>
                  {orientation === 'landscape' ? '横屏 (16:9)' : '竖屏 (9:16)'}
                </Tag>
              </List.Item>
              <List.Item>
                <span>播放状态</span>
                <Tag color={isPlaying ? 'green' : 'default'}>
                  {isPlaying ? '播放中' : '已暂停'}
                </Tag>
              </List.Item>
              <List.Item>
                <span>当前第几个</span>
                <Tag>
                  {currentIndex + 1} / {selectedPlaylist?.items.length || 0}
                </Tag>
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
