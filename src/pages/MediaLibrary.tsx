import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  DatePicker,
  Upload,
  message,
  Popconfirm,
  Statistic,
  Tabs,
  Image,
  Select,
  Badge,
} from 'antd';
import {
  UploadOutlined,
  ScissorOutlined,
  DeleteOutlined,
  SearchOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { MediaItem, MediaType } from '../types';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { TabPane } = Tabs;

export default function MediaLibrary() {
  const { mediaItems, addMedia, updateMedia, deleteMedia } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'draft'>('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [form] = Form.useForm();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      const matchSearch =
        searchText === '' ||
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()));
      const matchType = filterType === 'all' || item.type === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [mediaItems, searchText, filterType, filterStatus]);

  const stats = useMemo(() => {
    const total = mediaItems.length;
    const images = mediaItems.filter((m) => m.type === 'image').length;
    const videos = mediaItems.filter((m) => m.type === 'video').length;
    const expired = mediaItems.filter((m) => m.status === 'expired').length;
    return { total, images, videos, expired };
  }, [mediaItems]);

  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
    form.setFieldsValue({
      name: media.name,
      tags: media.tags,
      validRange: [dayjs(media.validFrom), dayjs(media.validTo)],
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = () => {
    form.validateFields().then((values) => {
      if (editingMedia) {
        updateMedia(editingMedia.id, {
          name: values.name,
          tags: values.tags,
          validFrom: values.validRange[0].format('YYYY-MM-DD'),
          validTo: values.validRange[1].format('YYYY-MM-DD'),
        });
        message.success('修改成功');
        setEditModalVisible(false);
      }
    });
  };

  const handleCrop = (media: MediaItem) => {
    setEditingMedia(media);
    setCropModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteMedia(id);
    message.success('删除成功');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        message.error('只能上传图片或视频文件!');
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newMedia: MediaItem = {
          id: `m${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: isImage ? 'image' : 'video',
          url,
          thumbnail: url,
          size: file.size,
          duration: isVideo ? 60 : undefined,
          tags: [],
          validFrom: dayjs().format('YYYY-MM-DD'),
          validTo: dayjs().add(30, 'day').format('YYYY-MM-DD'),
          usageCount: 0,
          createdAt: dayjs().format('YYYY-MM-DD'),
          status: 'draft',
        };
        addMedia(newMedia);
      };
      reader.readAsDataURL(file);
      message.success('上传成功');
      return false;
    },
  };

  const statusColorMap: Record<string, string> = {
    active: 'green',
    expired: 'red',
    draft: 'default',
  };

  const statusTextMap: Record<string, string> = {
    active: '有效',
    expired: '已过期',
    draft: '草稿',
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    mediaItems.forEach((m) => m.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [mediaItems]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索素材名称或标签..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Select
              style={{ width: 120 }}
              value={filterType}
              onChange={setFilterType}
              size="large"
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'image', label: '图片' },
                { value: 'video', label: '视频' },
              ]}
            />
          </Col>
          <Col>
            <Select
              style={{ width: 120 }}
              value={filterStatus}
              onChange={setFilterStatus}
              size="large"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'active', label: '有效' },
                { value: 'expired', label: '已过期' },
                { value: 'draft', label: '草稿' },
              ]}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传素材
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="素材总数" value={stats.total} prefix={<PictureOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="图片数量" value={stats.images} prefix={<PictureOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="视频数量" value={stats.videos} prefix={<VideoCameraOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已过期" value={stats.expired} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 12 }}>
        <Space wrap>
          <span style={{ color: '#666' }}>热门标签:</span>
          {allTags.slice(0, 10).map((tag) => (
            <Tag
              key={tag}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => setSearchText(tag)}
            >
              {tag}
            </Tag>
          ))}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {filteredMedia.map((media) => (
          <Col span={6} key={media.id}>
            <Badge.Ribbon
              text={statusTextMap[media.status]}
              color={statusColorMap[media.status]}
            >
              <Card
                hoverable
                cover={
                  <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                    <Image
                      src={media.thumbnail}
                      alt={media.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      preview={{ src: media.url }}
                    />
                    {media.type === 'video' && media.duration && (
                      <Tag
                        color="black"
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          margin: 0,
                        }}
                      >
                        {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                      </Tag>
                    )}
                  </div>
                }
                actions={[
                  <ScissorOutlined
                    key="crop"
                    title="裁剪"
                    onClick={() => handleCrop(media)}
                  />,
                  <Button
                    type="text"
                    size="small"
                    key="edit"
                    onClick={() => handleEdit(media)}
                    style={{ padding: 0 }}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定删除此素材?"
                    onConfirm={() => handleDelete(media.id)}
                  >
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={media.name}
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        使用次数: <Tag color="blue">{media.usageCount}次</Tag>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        有效期: {media.validFrom} ~ {media.validTo}
                      </div>
                      <div>
                        {media.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      <Modal
        title="编辑素材"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="素材名称" rules={[{ required: true, message: '请输入素材名称' }]}>
            <Input placeholder="请输入素材名称" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车添加" />
          </Form.Item>
          <Form.Item name="validRange" label="有效期" rules={[{ required: true, message: '请选择有效期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="裁剪素材"
        open={cropModalVisible}
        onOk={() => {
          message.success('裁剪成功（模拟）');
          setCropModalVisible(false);
        }}
        onCancel={() => setCropModalVisible(false)}
        width={700}
      >
        {editingMedia && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '100%',
                height: 360,
                border: '2px dashed #d9d9d9',
                borderRadius: 8,
                backgroundImage: `url(${editingMedia.url})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '20%',
                  width: '60%',
                  height: '60%',
                  border: '2px solid #1890ff',
                  background: 'rgba(24, 144, 255, 0.1)',
                  cursor: 'move',
                }}
              />
            </div>
            <p style={{ marginTop: 16, color: '#999' }}>拖动选框可调整裁剪区域（演示效果）</p>
            <Space>
              <Button size="small">16:9</Button>
              <Button size="small" type="primary">9:16</Button>
              <Button size="small">4:3</Button>
              <Button size="small">1:1</Button>
              <Button size="small">自由</Button>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="上传素材"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={500}
      >
        <Upload.Dragger {...uploadProps} accept="image/*,video/*">
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持图片（JPG、PNG、GIF）和视频（MP4、MOV）格式</p>
        </Upload.Dragger>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button onClick={() => setUploadModalVisible(false)}>关闭</Button>
        </div>
      </Modal>
    </div>
  );
}
