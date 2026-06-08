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
  List,
  Divider,
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
  ExclamationCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { PublishRecord, PublishGroupResult } from '../types';
import { generatePublishResults, calculatePublishStats } from '../utils/publishUtils';

const { RangePicker } = DatePicker;

export default function PublishRecordPage() {
  const { publishRecords, playlists, screenGroups, screens, setCurrentWindow, setSelectedPlaylistId, addPublishRecord, updatePublishRecord } = useAppStore();
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
    partial: 'orange',
  };

  const statusTextMap: Record<string, string> = {
    success: '发布成功',
    failed: '发布失败',
    publishing: '发布中',
    partial: '部分成功',
  };

  const statusIconMap: Record<string, React.ReactNode> = {
    success: <CheckCircleOutlined />,
    failed: <CloseCircleOutlined />,
    publishing: <LoadingOutlined />,
    partial: <ExclamationCircleOutlined />,
  };

  const operationTypeTextMap: Record<string, string> = {
    publish: '发布',
    stop: '停止',
  };

  const operationTypeIconMap: Record<string, React.ReactNode> = {
    publish: <PlayCircleOutlined />,
    stop: <StopOutlined />,
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

  const handleRepublish = (record: PublishRecord, failedOnly: boolean = false) => {
    const actionText = failedOnly ? '重发失败屏幕' : '重新发布';
    Modal.confirm({
      title: actionText,
      content: failedOnly
        ? `确定只重新发布「${record.targetName}」的失败屏幕吗?`
        : `确定要重新发布「${record.targetName}」吗?`,
      onOk: () => {
        const newRecordId = `pr${Date.now()}`;

        let groups: PublishGroupResult[] | undefined;
        if (record.groups && record.groups.length > 0) {
          if (failedOnly) {
            groups = record.groups.map((group) => ({
              ...group,
              screens: group.screens.map((screen) => {
                if (screen.status === 'failed') {
                  return { ...screen, status: 'publishing' as const, errorMessage: undefined };
                }
                return screen;
              }),
            }));
          } else {
            groups = record.groups.map((group) => ({
              ...group,
              screens: group.screens.map((screen) => ({
                ...screen,
                status: 'publishing' as const,
                errorMessage: undefined,
              })),
            }));
          }
        }

        addPublishRecord({
          id: newRecordId,
          type: record.type,
          targetId: record.targetId,
          targetName: record.targetName,
          screenGroupName: record.screenGroupName,
          publishTime: new Date().toISOString(),
          operator: '当前用户',
          status: 'publishing',
          detail: failedOnly ? '正在重发失败屏幕...' : '正在发布中...',
          operationType: 'publish',
          groups,
          successCount: 0,
          failedCount: 0,
          totalCount: record.totalCount,
        });
        message.success('已发起重新发布');

        setTimeout(() => {
          let finalGroups: PublishGroupResult[] | undefined;
          if (groups) {
            finalGroups = groups.map((group) => ({
              ...group,
              screens: group.screens.map((screen) => {
                if (screen.status === 'publishing') {
                  const screenData = screens.find((s) => s.id === screen.screenId);
                  const isSuccess = screenData?.status === 'online';
                  return {
                    ...screen,
                    status: isSuccess ? ('success' as const) : ('failed' as const),
                    errorMessage: isSuccess ? undefined : '屏幕离线，发布失败',
                    finishedTime: new Date().toISOString(),
                  };
                }
                return screen;
              }),
            }));
            const stats = calculatePublishStats(finalGroups);
            updatePublishRecord(newRecordId, {
              status: stats.overallStatus,
              detail: failedOnly
                ? `重发失败屏幕完成（成功 ${stats.successCount} 台，失败 ${stats.failedCount} 台）`
                : `重新发布成功（成功 ${stats.successCount} 台，失败 ${stats.failedCount} 台）`,
              groups: finalGroups,
              successCount: stats.successCount,
              failedCount: stats.failedCount,
            });
          } else {
            updatePublishRecord(newRecordId, {
              status: 'success',
              detail: failedOnly ? '重发失败屏幕完成' : '重新发布成功',
            });
          }
        }, 1500);
      },
    });
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 100,
      render: (type: string) => {
        const opType = type || 'publish';
        return (
          <Tag color={opType === 'stop' ? 'default' : 'blue'}>
            {operationTypeIconMap[opType]} {operationTypeTextMap[opType]}
          </Tag>
        );
      },
    },
    {
      title: '内容类型',
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
      title: '发布结果',
      key: 'result',
      width: 140,
      render: (_: any, record: PublishRecord) => {
        if (record.successCount !== undefined && record.totalCount !== undefined) {
          return (
            <Space size="small">
              <Tag color="green">成功 {record.successCount}</Tag>
              {record.failedCount !== undefined && record.failedCount > 0 && (
                <Tag color="red">失败 {record.failedCount}</Tag>
              )}
              <span style={{ color: '#999', fontSize: 12 }}>/ {record.totalCount}台</span>
            </Space>
          );
        }
        return <span style={{ color: '#999' }}>-</span>;
      },
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
      width: 220,
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
          selectedRecord?.failedCount && selectedRecord.failedCount > 0 ? (
            <Button key="republishFailed" danger onClick={() => {
              if (selectedRecord) handleRepublish(selectedRecord, true);
            }}>
              只重发失败屏幕
            </Button>
          ) : null,
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="操作类型">
                <Tag color={selectedRecord.operationType === 'stop' ? 'default' : 'blue'}>
                  {operationTypeIconMap[selectedRecord.operationType || 'publish']}
                  {operationTypeTextMap[selectedRecord.operationType || 'publish']}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="内容类型">
                <Space>
                  {typeIconMap[selectedRecord.type]}
                  {typeTextMap[selectedRecord.type]}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="内容名称" span={2}>
                {selectedRecord.targetName}
              </Descriptions.Item>
              <Descriptions.Item label="屏幕组" span={2}>
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
              <Descriptions.Item label="发布时间" span={2}>
                {dayjs(selectedRecord.publishTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {selectedRecord.successCount !== undefined && selectedRecord.totalCount !== undefined && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ marginBottom: 12 }}>
                  <strong>发布结果统计</strong>
                </div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="成功" value={selectedRecord.successCount} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="失败" value={selectedRecord.failedCount || 0} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title="总计" value={selectedRecord.totalCount} prefix={<HistoryOutlined />} />
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {selectedRecord.groups && selectedRecord.groups.length > 0 && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ marginBottom: 12 }}>
                  <strong>各屏幕发布详情</strong>
                </div>
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {selectedRecord.groups.map((group) => (
                    <div key={group.groupId} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>
                        {group.groupName}
                      </div>
                      <List
                        size="small"
                        bordered
                        dataSource={group.screens}
                        renderItem={(screen) => (
                          <List.Item
                            style={{
                              background: screen.status === 'failed' ? '#fff1f0' : 'transparent',
                            }}
                          >
                            <Space style={{ width: '100%' }}>
                              {statusIconMap[screen.status]}
                              <span style={{ flex: 1 }}>{screen.screenName}</span>
                              <Tag color={statusColorMap[screen.status]}>
                                {statusTextMap[screen.status]}
                              </Tag>
                              {screen.errorMessage && (
                                <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                                  {screen.errorMessage}
                                </span>
                              )}
                              {screen.finishedTime && (
                                <span style={{ color: '#999', fontSize: 12 }}>
                                  {dayjs(screen.finishedTime).format('HH:mm:ss')}
                                </span>
                              )}
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedRecord.detail && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div>
                  <strong>详细信息：</strong>
                  <span style={{ color: selectedRecord.status === 'failed' ? '#ff4d4f' : '#666' }}>
                    {selectedRecord.detail}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
