import { useState, useMemo } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Empty,
  Avatar,
  Descriptions,
} from 'antd';
import {
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlaySquareOutlined,
  CalendarOutlined,
  BellOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { ApprovalRecord } from '../types';

const { TextArea } = Input;
const { TabPane } = Tabs;

export default function ApprovalCenter() {
  const { approvalRecords, approveRecord, rejectRecord } = useAppStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApprovalRecord | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [form] = Form.useForm();

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return approvalRecords;
    return approvalRecords.filter((r) => r.status === activeTab);
  }, [approvalRecords, activeTab]);

  const stats = useMemo(() => ({
    pending: approvalRecords.filter((r) => r.status === 'pending').length,
    approved: approvalRecords.filter((r) => r.status === 'approved').length,
    rejected: approvalRecords.filter((r) => r.status === 'rejected').length,
    total: approvalRecords.length,
  }), [approvalRecords]);

  const statusColorMap: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
  };

  const statusTextMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
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

  const handleViewDetail = (record: ApprovalRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleAction = (record: ApprovalRecord, type: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setActionType(type);
    form.resetFields();
    setActionModalVisible(true);
  };

  const handleActionSubmit = () => {
    form.validateFields().then((values) => {
      if (selectedRecord) {
        if (actionType === 'approve') {
          approveRecord(selectedRecord.id, '当前审核人', values.comment);
          message.success('已通过审核');
        } else {
          rejectRecord(selectedRecord.id, '当前审核人', values.comment || '');
          message.success('已拒绝');
        }
        setActionModalVisible(false);
      }
    });
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待审核" value={stats.pending} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已通过" value={stats.approved} valueStyle={{ color: '#52c41a' }} prefix={<CheckOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已拒绝" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总计" value={stats.total} prefix={<AuditOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`待审核 (${stats.pending})`} key="pending" />
          <TabPane tab={`已通过 (${stats.approved})`} key="approved" />
          <TabPane tab={`已拒绝 (${stats.rejected})`} key="rejected" />
          <TabPane tab={`全部 (${stats.total})`} key="all" />
        </Tabs>

        {filteredRecords.length === 0 ? (
          <Empty description="暂无记录" style={{ padding: 40 }} />
        ) : (
          <List
            dataSource={filteredRecords}
            renderItem={(record) => (
              <List.Item
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                }}
                actions={[
                  <Button key="detail" type="link" onClick={() => handleViewDetail(record)}>
                    查看详情
                  </Button>,
                  record.status === 'pending' && (
                    <Button
                      key="approve"
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleAction(record, 'approve')}
                    >
                      通过
                    </Button>
                  ),
                  record.status === 'pending' && (
                    <Button
                      key="reject"
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleAction(record, 'reject')}
                    >
                      拒绝
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={typeIconMap[record.type]} />}
                  title={
                    <Space>
                      <span style={{ fontWeight: 500 }}>{record.targetName}</span>
                      <Tag>{typeTextMap[record.type]}</Tag>
                      <Tag color={statusColorMap[record.status]}>
                        {statusTextMap[record.status]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <UserOutlined /> 提交人: {record.submitter}
                        <span style={{ margin: '0 12px' }}>·</span>
                        <ClockCircleOutlined /> 提交时间: {dayjs(record.submitTime).format('YYYY-MM-DD HH:mm')}
                      </div>
                      {record.approver && (
                        <div>
                          <UserOutlined /> 审核人: {record.approver}
                          <span style={{ margin: '0 12px' }}>·</span>
                          审核时间: {dayjs(record.approveTime).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                      {record.comment && (
                        <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          审核意见: {record.comment}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="审核详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="内容名称">{selectedRecord.targetName}</Descriptions.Item>
            <Descriptions.Item label="内容类型">
              {typeIconMap[selectedRecord.type]} {typeTextMap[selectedRecord.type]}
            </Descriptions.Item>
            <Descriptions.Item label="审核状态">
              <Tag color={statusColorMap[selectedRecord.status]}>
                {statusTextMap[selectedRecord.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提交人">{selectedRecord.submitter}</Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {dayjs(selectedRecord.submitTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedRecord.approver && (
              <Descriptions.Item label="审核人">{selectedRecord.approver}</Descriptions.Item>
            )}
            {selectedRecord.approveTime && (
              <Descriptions.Item label="审核时间">
                {dayjs(selectedRecord.approveTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedRecord.comment && (
              <Descriptions.Item label="审核意见">{selectedRecord.comment}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={actionType === 'approve' ? '通过审核' : '拒绝审核'}
        open={actionModalVisible}
        onOk={handleActionSubmit}
        onCancel={() => setActionModalVisible(false)}
        okText={actionType === 'approve' ? '确认通过' : '确认拒绝'}
        okButtonProps={{ danger: actionType === 'reject' }}
      >
        <p style={{ marginBottom: 16 }}>
          确定要{actionType === 'approve' ? '通过' : '拒绝'}「{selectedRecord?.targetName}」的审核吗?
        </p>
        <Form form={form} layout="vertical">
          <Form.Item name="comment" label={actionType === 'approve' ? '审核意见（选填）' : '拒绝原因'} rules={actionType === 'reject' ? [{ required: true, message: '请填写拒绝原因' }] : []}>
            <TextArea rows={4} placeholder={actionType === 'approve' ? '请输入审核意见' : '请填写拒绝原因'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
