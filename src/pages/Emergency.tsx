import { useState } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Badge,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  BellOutlined,
  WarningOutlined,
  SoundOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { EmergencyBroadcast } from '../types';
import { generatePublishResults, calculatePublishStats } from '../utils/publishUtils';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function Emergency() {
  const { emergencyBroadcasts, screenGroups, screens, addEmergency, updateEmergency, deleteEmergency, addPublishRecord } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState<EmergencyBroadcast | null>(null);
  const [form] = Form.useForm();

  const typeColorMap: Record<string, string> = {
    notice: 'blue',
    warning: 'orange',
    emergency: 'red',
  };

  const typeIconMap: Record<string, React.ReactNode> = {
    notice: <BellOutlined />,
    warning: <WarningOutlined />,
    emergency: <SoundOutlined />,
  };

  const typeTextMap: Record<string, string> = {
    notice: '通知',
    warning: '预警',
    emergency: '紧急',
  };

  const statusColorMap: Record<string, string> = {
    active: 'green',
    ended: 'default',
    draft: 'orange',
  };

  const statusTextMap: Record<string, string> = {
    active: '播放中',
    ended: '已结束',
    draft: '草稿',
  };

  const stats = {
    active: emergencyBroadcasts.filter((e) => e.status === 'active').length,
    draft: emergencyBroadcasts.filter((e) => e.status === 'draft').length,
    total: emergencyBroadcasts.length,
  };

  const handleAdd = () => {
    setEditingEmergency(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'notice',
      status: 'draft',
    });
    setModalVisible(true);
  };

  const handleEdit = (emergency: EmergencyBroadcast) => {
    setEditingEmergency(emergency);
    form.setFieldsValue({
      title: emergency.title,
      content: emergency.content,
      type: emergency.type,
      screenGroupIds: emergency.screenGroupIds,
      status: emergency.status,
      timeRange: [
        dayjs(emergency.startTime),
        emergency.endTime ? dayjs(emergency.endTime) : null,
      ],
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const [startTime, endTime] = values.timeRange || [];

      if (editingEmergency) {
        updateEmergency(editingEmergency.id, {
          title: values.title,
          content: values.content,
          type: values.type,
          screenGroupIds: values.screenGroupIds,
          startTime: startTime?.toISOString() || new Date().toISOString(),
          endTime: endTime?.toISOString(),
          status: values.status,
        });
        message.success('修改成功');
      } else {
        addEmergency({
          id: `e${Date.now()}`,
          title: values.title,
          content: values.content,
          type: values.type,
          screenGroupIds: values.screenGroupIds,
          startTime: startTime?.toISOString() || new Date().toISOString(),
          endTime: endTime?.toISOString(),
          status: values.status,
          createdBy: '当前用户',
          createdAt: new Date().toISOString(),
        });
        message.success('创建成功');
      }
      setModalVisible(false);
    });
  };

  const handleDelete = (id: string) => {
    deleteEmergency(id);
    message.success('删除成功');
  };

  const handlePublishNow = (id: string) => {
    const emergency = emergencyBroadcasts.find((e) => e.id === id);
    updateEmergency(id, {
      status: 'active',
      startTime: new Date().toISOString(),
    });
    if (emergency) {
      const groups = generatePublishResults(screenGroups, screens, emergency.screenGroupIds);
      const stats = calculatePublishStats(groups);
      const groupNames = groups.map((g) => g.groupName).join('、');

      addPublishRecord({
        id: `pr${Date.now()}`,
        type: 'emergency',
        targetId: id,
        targetName: emergency.title,
        screenGroupName: groupNames || '多屏幕组',
        publishTime: new Date().toISOString(),
        operator: '当前用户',
        status: stats.overallStatus,
        detail: `紧急插播已发布（成功 ${stats.successCount} 台，失败 ${stats.failedCount} 台）`,
        operationType: 'publish',
        groups,
        successCount: stats.successCount,
        failedCount: stats.failedCount,
        totalCount: stats.totalCount,
      });
    }
    message.success('已立即发布');
  };

  const handleStop = (id: string) => {
    const emergency = emergencyBroadcasts.find((e) => e.id === id);
    updateEmergency(id, {
      status: 'ended',
      endTime: new Date().toISOString(),
    });
    if (emergency) {
      const groups = generatePublishResults(screenGroups, screens, emergency.screenGroupIds);
      const stats = calculatePublishStats(groups);
      const groupNames = groups.map((g) => g.groupName).join('、');

      addPublishRecord({
        id: `pr${Date.now()}`,
        type: 'emergency',
        targetId: id,
        targetName: emergency.title,
        screenGroupName: groupNames || '多屏幕组',
        publishTime: new Date().toISOString(),
        operator: '当前用户',
        status: stats.overallStatus,
        detail: `紧急插播已停止（成功 ${stats.successCount} 台，失败 ${stats.failedCount} 台）`,
        operationType: 'stop',
        groups,
        successCount: stats.successCount,
        failedCount: stats.failedCount,
        totalCount: stats.totalCount,
      });
    }
    message.success('已停止播放');
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="总插播数" value={stats.total} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="播放中" value={stats.active} valueStyle={{ color: '#52c41a' }} prefix={<SoundOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="草稿" value={stats.draft} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="紧急插播列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建插播
          </Button>
        }
      >
        <List
          dataSource={emergencyBroadcasts}
          renderItem={(item) => (
            <List.Item
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                alignItems: 'flex-start',
              }}
              actions={[
                item.status === 'draft' && (
                  <Button
                    key="publish"
                    type="primary"
                    size="small"
                    onClick={() => handlePublishNow(item.id)}
                  >
                    立即发布
                  </Button>
                ),
                item.status === 'active' && (
                  <Button
                    key="stop"
                    danger
                    size="small"
                    icon={<StopOutlined />}
                    onClick={() => handleStop(item.id)}
                  >
                    停止
                  </Button>
                ),
                <Button key="edit" size="small" onClick={() => handleEdit(item)}>
                  编辑
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定删除此插播?"
                  onConfirm={() => handleDelete(item.id)}
                >
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Badge
                    count={typeTextMap[item.type]}
                    color={typeColorMap[item.type]}
                    style={{ fontSize: 14 }}
                  />
                }
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{item.title}</span>
                    <Tag color={statusColorMap[item.status]}>{statusTextMap[item.status]}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ color: '#333', marginBottom: 8 }}>{item.content}</p>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <Space split="·">
                        <span>
                          <ClockCircleOutlined /> {dayjs(item.startTime).format('YYYY-MM-DD HH:mm')}
                          {item.endTime && ` ~ ${dayjs(item.endTime).format('YYYY-MM-DD HH:mm')}`}
                        </span>
                        <span>创建者: {item.createdBy}</span>
                      </Space>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {item.screenGroupIds.map((gid) => {
                        const group = screenGroups.find((g) => g.id === gid);
                        return (
                          <Tag key={gid} color="blue">
                            {group?.name || gid}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingEmergency ? '编辑紧急插播' : '新建紧急插播'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Radio.Group>
              <Radio.Button value="notice">
                <BellOutlined /> 通知
              </Radio.Button>
              <Radio.Button value="warning">
                <WarningOutlined /> 预警
              </Radio.Button>
              <Radio.Button value="emergency">
                <SoundOutlined /> 紧急
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入插播标题" maxLength={50} showCount />
          </Form.Item>

          <Form.Item name="content" label="插播内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={4} placeholder="请输入插播内容" maxLength={500} showCount />
          </Form.Item>

          <Form.Item name="screenGroupIds" label="发布屏幕组" rules={[{ required: true, message: '请选择屏幕组' }]}>
            <Select mode="multiple" placeholder="请选择要发布的屏幕分组">
              {screenGroups.map((g) => (
                <Select.Option key={g.id} value={g.id}>
                  {g.name}（{g.screenIds.length}台）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="timeRange" label="播放时间">
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="active">立即发布</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
