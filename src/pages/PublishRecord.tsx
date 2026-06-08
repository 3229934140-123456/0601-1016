import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlaySquareOutlined,
  CalendarOutlined,
  BellOutlined,
  EyeOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { PublishRecord } from '../types';

const { RangePicker } = DatePicker;

export default function PublishRecordPage() {
  const { publishRecords, playlists, setCurrentWindow, setSelectedPlaylistId, addPublishRecord, updatePublishRecord } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PublishRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return publishRecords.filter((record) => {
      const matchSearch =
        searchText === '' ||
        record.targetName.toLowerCase().includes(searchText.toLowerCase()) ||
        record.screenGroupName.toLowerCase().includes(searchText.toLowerCase());
      const matchType = filterType === 'all' || record.type === filterType;
      const matchStatus = filterStatus === 'all' || record.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [publishRecords, searchText, filterType, filterStatus]);

  const stats = useMemo(() => ({
    total: publishRecords.length,
    success: publishRecords.filter((r) => r.status === 'success').length,
    failed: publishRecords.filter((r) => r.status === 'failed').length,
    publishing: publishRecords.filter((r) => r.status === 'publishing').length,
  }), [publishRecords]);

  const statusColorMap: Record<string, string> = {
    success: 'green',
    failed: 'red',
    publishing: 'blue',
  };

  const statusTextMap: Record<string, string> = {
    success: '发布成功',
    failed: '发布失败',
    publishing: '发布中',
  };

  const statusIconMap: Record<string, React.ReactNode> = {
    success: <CheckCircleOutlined />,
    failed: <CloseCircleOutlined />,
    publishing: <LoadingOutlined />,
  };

  const typeIconMap: Record<string, React.ReactNode> = {
    playlist: <PlaySquareOutlined />,
    schedule: <CalendarOutlined />,
    emergency: <BellOutlined />,
  };

  const typeTextMap: Record<string, string> = {
    playlist: '节目单',
    schedule: '排期',
    emergency: '紧急插播',
  };

  const handleViewDetail = (record: PublishRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const handleViewPlaylist = (record: PublishRecord) => {
    if (record.type === 'playlist') {
      setSelectedPlaylistId(record.targetId);
      setCurrentWindow('preview');
    }
  };

  const handleRepublish = (record: PublishRecord) => {
    Modal.confirm({
      title: '重新发布',
      content: `确定要重新发布「${record.targetName}」吗?`,
      onOk: () => {
        const newRecordId = `pr${Date.now()}`;
        addPublishRecord({
          id: newRecordId,
          type: record.type,
          targetId: record.targetId,
          targetName: record.targetName,
          screenGroupName: record.screenGroupName,
          publishTime: new Date().toISOString(),
          operator: '当前用户',
          status: 'publishing',
          detail: '正在发布中...',
        });
        message.success('已发起重新发布');
        setTimeout(() => {
          updatePublishRecord(newRecordId, {
            status: 'success',
            detail: '重新发布成功',
          });
        }, 1500);
      },
    });
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Space>
          {typeIconMap[type]}
          <span>{typeTextMap[type]}</span>
        </Space>
      ),
    },
    {
      title: '内容名称',
      dataIndex: 'targetName',
      key: 'targetName',
      render: (text: string, record: PublishRecord) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      ),
    },
    {
      title: '屏幕组',
      dataIndex: 'screenGroupName',
      key: 'screenGroupName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColorMap[status]} icon={statusIconMap[status]}>
          {statusTextMap[status]}
        </Tag>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: PublishRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.type === 'playlist' && (
            <Tooltip title="查看播放效果">
              <Button type="link" size="small" onClick={() => handleViewPlaylist(record)}>
                预览
              </Button>
            </Tooltip>
          )}
          <Button type="link" size="small" icon={<RedoOutlined />} onClick={() => handleRepublish(record)}>
            重发
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总发布数" value={stats.total} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="成功" value={stats.success} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="失败" value={stats.failed} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="发布中" value={stats.publishing} valueStyle={{ color: '#1890ff' }} prefix={<LoadingOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title="发布记录"
        extra={
          <Space>
            <Input
              placeholder="搜索内容名称或屏幕组"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              style={{ width: 120 }}
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'playlist', label: '节目单' },
                { value: 'schedule', label: '排期' },
                { value: 'emergency', label: '紧急插播' },
              ]}
            />
            <Select
              style={{ width: 120 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'success', label: '成功' },
                { value: 'failed', label: '失败' },
                { value: 'publishing', label: '发布中' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={filteredRecords}
          columns={columns}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="发布详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button key="republish" type="primary" onClick={() => {
            if (selectedRecord) handleRepublish(selectedRecord);
          }}>
            重新发布
          </Button>,
        ]}
        width={600}
      >
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="内容类型">
              <Space>
                {typeIconMap[selectedRecord.type]}
                {typeTextMap[selectedRecord.type]}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="内容名称">
              {selectedRecord.targetName}
            </Descriptions.Item>
            <Descriptions.Item label="屏幕组">
              {selectedRecord.screenGroupName}
            </Descriptions.Item>
            <Descriptions.Item label="发布状态">
              <Tag color={statusColorMap[selectedRecord.status]} icon={statusIconMap[selectedRecord.status]}>
                {statusTextMap[selectedRecord.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {selectedRecord.operator}
            </Descriptions.Item>
            <Descriptions.Item label="发布时间">
              {dayjs(selectedRecord.publishTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedRecord.detail && (
              <Descriptions.Item label="详细信息">
                <span style={{ color: '#ff4d4f' }}>{selectedRecord.detail}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
