import { useState, useMemo, useRef, useEffect } from 'react';
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
  Image,
  Select,
  Badge,
  Slider,
} from 'antd';
import {
  UploadOutlined,
  ScissorOutlined,
  DeleteOutlined,
  SearchOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { MediaItem, MediaType, CropRatio, CropConfig } from '../types';

const { RangePicker } = DatePicker;
const { Search } = Input;

const ratioMap: Record<CropRatio, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
  '4:3': 4 / 3,
  'free': 0,
};

function getCropStyle(crop?: CropConfig): React.CSSProperties {
  if (!crop || crop.ratio === 'free') {
    return {};
  }
  const ratio = ratioMap[crop.ratio];
  return {
    aspectRatio: `${ratio}`,
  };
}

function getImageStyle(crop?: CropConfig): React.CSSProperties {
  if (!crop) {
    return { objectFit: 'cover' as const };
  }
  return {
    objectFit: 'cover' as const,
    objectPosition: `${crop.positionX}% ${crop.positionY}%`,
  };
}

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

  const [cropRatio, setCropRatio] = useState<CropRatio>('16:9');
  const [cropPosX, setCropPosX] = useState(50);
  const [cropPosY, setCropPosY] = useState(50);

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
    if (media.crop) {
      setCropRatio(media.crop.ratio);
      setCropPosX(media.crop.positionX);
      setCropPosY(media.crop.positionY);
    } else {
      setCropRatio('16:9');
      setCropPosX(50);
      setCropPosY(50);
    }
    setCropModalVisible(true);
  };

  const handleCropSubmit = () => {
    if (editingMedia) {
      const cropConfig: CropConfig = {
        ratio: cropRatio,
        positionX: cropPosX,
        positionY: cropPosY,
      };
      updateMedia(editingMedia.id, { crop: cropConfig });
      message.success('裁剪成功');
      setCropModalVisible(false);
    }
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

  const previewCropStyle = getCropStyle({
    ratio: cropRatio,
    positionX: cropPosX,
    positionY: cropPosY,
  });

  const previewImgStyle = getImageStyle({
    ratio: cropRatio,
    positionX: cropPosX,
    positionY: cropPosY,
  });

  const ratioList: { value: CropRatio; label: string }[] = [
    { value: '16:9', label: '横屏 16:9' },
    { value: '9:16', label: '竖屏 9:16' },
    { value: '1:1', label: '方形 1:1' },
    { value: '4:3', label: '4:3' },
    { value: 'free', label: '原始比例' },
  ];

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
                  <div
                    style={{
                      height: 160,
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                    {media.crop && media.crop.ratio !== 'free' && (
                      <Tag
                        color="blue"
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          margin: 0,
                        }}
                      >
                        <ScissorOutlined /> {media.crop.ratio}
                      </Tag>
                    )}
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
                    style={{ color: '#1890ff' }}
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
        onOk={handleCropSubmit}
        onCancel={() => setCropModalVisible(false)}
        width={680}
        okText="保存裁剪"
        maskClosable={false}
      >
        {editingMedia && (
          <div>
            <div
              style={{
                width: '100%',
                height: 320,
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  ...previewCropStyle,
                  transition: 'all 0.3s ease',
                }}
              >
                <img
                  src={editingMedia.url}
                  alt={editingMedia.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    ...previewImgStyle,
                    transition: 'object-position 0.1s ease',
                  }}
                  draggable={false}
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '4px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {cropRatio}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>选择比例</div>
              <Space wrap>
                {ratioList.map((r) => (
                  <Button
                    key={r.value}
                    type={cropRatio === r.value ? 'primary' : 'default'}
                    onClick={() => setCropRatio(r.value)}
                    size="small"
                  >
                    {r.label}
                  </Button>
                ))}
              </Space>
            </div>

            {cropRatio !== 'free' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>水平位置</span>
                    <span style={{ fontSize: 12, color: '#1890ff' }}>{cropPosX}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={cropPosX}
                    onChange={setCropPosX}
                    tooltip={{ formatter: (v) => `${v}%` }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>垂直位置</span>
                    <span style={{ fontSize: 12, color: '#1890ff' }}>{cropPosY}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={cropPosY}
                    onChange={setCropPosY}
                    tooltip={{ formatter: (v) => `${v}%` }}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                  拖动滑块调整裁剪区域位置，保存后生效
                </div>
              </>
            )}

            {cropRatio === 'free' && (
              <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '20px 0' }}>
                原始比例，不进行裁剪
              </div>
            )}
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
