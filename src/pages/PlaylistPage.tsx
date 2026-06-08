import { useState, useMemo } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
  Image,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  SendOutlined,
  RollbackOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  DragOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { Playlist } from '../types';
import dayjs from 'dayjs';
import { getCropStyle, getImageStyle } from '../utils/cropUtils';

export default function PlaylistPage() {
  const {
    playlists,
    mediaItems,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    copyPlaylist,
    submitPlaylistApproval,
    withdrawPlaylist,
    setCurrentWindow,
    setSelectedPlaylistId,
  } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [form] = Form.useForm();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedId) || playlists[0] || null,
    [playlists, selectedId]
  );

  const statusColorMap: Record<string, string> = {
    draft: 'default',
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
  };

  const statusTextMap: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };

  const stats = useMemo(() => {
    const total = playlists.length;
    const draft = playlists.filter((p) => p.status === 'draft').length;
    const pending = playlists.filter((p) => p.status === 'pending').length;
    const approved = playlists.filter((p) => p.status === 'approved').length;
    return { total, draft, pending, approved };
  }, [playlists]);

  const handleAdd = () => {
    setEditingPlaylist(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    form.setFieldsValue({
      name: playlist.name,
      items: playlist.items,
    });
    setModalVisible(true);
  };

  const handleCopy = (id: string) => {
    copyPlaylist(id);
    message.success('已复制节目单');
  };

  const handleSubmitApproval = (id: string) => {
    submitPlaylistApproval(id);
    message.success('已提交审核');
  };

  const handleWithdraw = (id: string) => {
    withdrawPlaylist(id);
    message.success('已撤回');
  };

  const handleDelete = (id: string) => {
    deletePlaylist(id);
    message.success('删除成功');
  };

  const handlePreview = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentWindow('preview');
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const items = (values.items || []).map((item: any, index: number) => ({
        ...item,
        order: index + 1,
      }));
      const totalDuration = items.reduce(
        (sum: number, item: any) => sum + (item.duration || 0),
        0
      );

      if (editingPlaylist) {
        updatePlaylist(editingPlaylist.id, {
          name: values.name,
          items,
          totalDuration,
          updatedAt: new Date().toISOString(),
        });
        message.success('修改成功');
      } else {
        const newPlaylist: Playlist = {
          id: `p${Date.now()}`,
          name: values.name,
          items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
          createdBy: '当前用户',
          totalDuration,
        };
        addPlaylist(newPlaylist);
        message.success('创建成功');
      }
      setModalVisible(false);
    });
  };

  const addMediaToPlaylist = (mediaId: string) => {
    const media = mediaItems.find((m) => m.id === mediaId);
    if (!media) return;

    const currentItems = form.getFieldValue('items') || [];
    const newItem = {
      id: `pi${Date.now()}`,
      mediaId: media.id,
      mediaName: media.name,
      duration: media.duration || 10,
      order: currentItems.length + 1,
    };
    form.setFieldsValue({
      items: [...currentItems, newItem],
    });
  };

  const removeItem = (index: number) => {
    const currentItems = form.getFieldValue('items') || [];
    const newItems = currentItems.filter((_: any, i: number) => i !== index);
    form.setFieldsValue({ items: newItems });
  };

  const updateItemDuration = (index: number, duration: number) => {
    const currentItems = form.getFieldValue('items') || [];
    currentItems[index].duration = duration;
    form.setFieldsValue({ items: [...currentItems] });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="节目单总数" value={stats.total} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="草稿" value={stats.draft} valueStyle={{ color: '#999' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待审核" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已通过" value={stats.approved} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card
            title="节目单列表"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
                新建
              </Button>
            }
            style={{ height: 'calc(100vh - 240px)', overflow: 'auto' }}
          >
            <List
              dataSource={playlists}
              renderItem={(playlist) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedId === playlist.id ? '#e6f7ff' : 'transparent',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                  onClick={() => setSelectedId(playlist.id)}
                  actions={[
                    <Tooltip title="预览">
                      <EyeOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(playlist.id);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="编辑">
                      <EditOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(playlist);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="复制">
                      <CopyOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(playlist.id);
                        }}
                      />
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{playlist.name}</span>
                        <Tag color={statusColorMap[playlist.status]}>
                          {statusTextMap[playlist.status]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          {playlist.items.length} 个素材 · 总时长 {formatDuration(playlist.totalDuration)}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          创建: {dayjs(playlist.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={16}>
          <Card
            title={selectedPlaylist ? `节目单详情 - ${selectedPlaylist.name}` : '节目单详情'}
            extra={
              selectedPlaylist && (
                <Space>
                  {selectedPlaylist.status === 'draft' && (
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={() => handleSubmitApproval(selectedPlaylist.id)}
                    >
                      提交审核
                    </Button>
                  )}
                  {selectedPlaylist.status === 'pending' && (
                    <Button
                      icon={<RollbackOutlined />}
                      onClick={() => handleWithdraw(selectedPlaylist.id)}
                    >
                      撤回
                    </Button>
                  )}
                  <Popconfirm
                    title="确定删除此节目单?"
                    onConfirm={() => handleDelete(selectedPlaylist.id)}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          >
            {selectedPlaylist ? (
              <div>
                <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ color: '#666', fontSize: 12 }}>状态</div>
                      <Tag color={statusColorMap[selectedPlaylist.status]} style={{ marginTop: 4 }}>
                        {statusTextMap[selectedPlaylist.status]}
                      </Tag>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#666', fontSize: 12 }}>素材数量</div>
                      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>
                        {selectedPlaylist.items.length} 个
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#666', fontSize: 12 }}>总时长</div>
                      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>
                        {formatDuration(selectedPlaylist.totalDuration)}
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ fontWeight: 500, marginBottom: 12 }}>轮播内容</div>
                <List
                  bordered
                  dataSource={selectedPlaylist.items}
                  renderItem={(item, index) => {
                    const media = mediaItems.find((m) => m.id === item.mediaId);
                    return (
                      <List.Item>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <div style={{ width: 32, textAlign: 'center', color: '#999' }}>
                            <DragOutlined /> {index + 1}
                          </div>
                          {media && (
                            <div
                              style={{
                                width: 80,
                                height: 45,
                                overflow: 'hidden',
                                borderRadius: 4,
                                marginRight: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f0f0f0',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  overflow: 'hidden',
                                  ...getCropStyle(media.crop),
                                }}
                              >
                                <Image
                                  src={media.thumbnail}
                                  alt={media.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    ...getImageStyle(media.crop),
                                  }}
                                  preview={{ src: media.url }}
                                />
                              </div>
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{item.mediaName || item.mediaId}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {media?.type === 'image' ? <PictureOutlined /> : <VideoCameraOutlined />}
                              {' '}{media?.type === 'image' ? '图片' : '视频'}
                              {' · '}
                              <ClockCircleOutlined /> {formatDuration(item.duration)}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              </div>
            ) : (
              <Empty description="请选择一个节目单查看详情" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingPlaylist ? '编辑节目单' : '新建节目单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="节目单名称" rules={[{ required: true, message: '请输入节目单名称' }]}>
            <Input placeholder="请输入节目单名称" />
          </Form.Item>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>从素材库添加</div>
            <Select
              showSearch
              placeholder="搜索并添加素材"
              style={{ width: '100%' }}
              optionFilterProp="label"
              filterOption
              onSelect={(value) => addMediaToPlaylist(value)}
              value={undefined}
            >
              {mediaItems.map((media) => (
                <Select.Option key={media.id} value={media.id} label={media.name}>
                  <Space>
                    {media.type === 'image' ? <PictureOutlined /> : <VideoCameraOutlined />}
                    <span>{media.name}</span>
                    <Tag>{media.tags[0] || ''}</Tag>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>

          <Form.List name="items">
            {(fields) => (
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  轮播列表（共 {fields.length} 个素材）
                </div>
                {fields.length === 0 ? (
                  <Empty description="暂无素材，请从上方添加" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div
                    style={{
                      maxHeight: 300,
                      overflow: 'auto',
                      border: '1px solid #d9d9d9',
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    {fields.map(({ key, name, ...restField }, index) => {
                      const itemValue = form.getFieldValue('items')?.[index];
                      const media = mediaItems.find((m) => m.id === itemValue?.mediaId);
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 8,
                            marginBottom: 4,
                            background: '#fafafa',
                            borderRadius: 4,
                          }}
                        >
                          <div style={{ width: 24, textAlign: 'center', color: '#999' }}>
                            <DragOutlined />
                          </div>
                          <div style={{ width: 40, textAlign: 'center', fontWeight: 500 }}>
                            {index + 1}
                          </div>
                          {media && (
                            <Image
                              width={50}
                              height={28}
                              src={media.thumbnail}
                              style={{ borderRadius: 2, objectFit: 'cover' }}
                              preview={false}
                            />
                          )}
                          <div style={{ flex: 1, marginLeft: 12 }}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>
                              {itemValue?.mediaName || itemValue?.mediaId}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: 8, fontSize: 12 }}>播放时长:</span>
                            <InputNumber
                              min={1}
                              max={3600}
                              size="small"
                              style={{ width: 80 }}
                              value={itemValue?.duration}
                              onChange={(val) => updateItemDuration(index, val as number)}
                            />
                            <span style={{ marginLeft: 4, fontSize: 12 }}>秒</span>
                          </div>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeItem(index)}
                            style={{ marginLeft: 8 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
