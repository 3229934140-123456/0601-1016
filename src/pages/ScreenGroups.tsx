import { useState, useMemo } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MonitorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { Screen, ScreenGroup } from '../types';

export default function ScreenGroups() {
  const { screens, screenGroups, addScreenGroup, updateScreenGroup, deleteScreenGroup } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ScreenGroup | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [form] = Form.useForm();

  const floors = useMemo(() => {
    const floorSet = new Set(screens.map((s) => s.floor));
    return Array.from(floorSet).sort((a, b) => a - b);
  }, [screens]);

  const filteredScreens = useMemo(() => {
    if (selectedFloor === null) return screens;
    return screens.filter((s) => s.floor === selectedFloor);
  }, [screens, selectedFloor]);

  const getScreensByGroup = (groupId: string) => {
    const group = screenGroups.find((g) => g.id === groupId);
    if (!group) return [];
    return screens.filter((s) => group.screenIds.includes(s.id));
  };

  const statusIconMap: Record<string, React.ReactNode> = {
    online: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    offline: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    error: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
  };

  const statusTextMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    error: '异常',
  };

  const stats = useMemo(() => {
    const total = screens.length;
    const online = screens.filter((s) => s.status === 'online').length;
    const offline = screens.filter((s) => s.status === 'offline').length;
    const groups = screenGroups.length;
    return { total, online, offline, groups };
  }, [screens, screenGroups]);

  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (group: ScreenGroup) => {
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      floor: group.floor,
      screenIds: group.screenIds,
      description: group.description,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingGroup) {
        updateScreenGroup(editingGroup.id, values);
        message.success('修改成功');
      } else {
        addScreenGroup({
          id: `g${Date.now()}`,
          ...values,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
    });
  };

  const handleDelete = (id: string) => {
    deleteScreenGroup(id);
    message.success('删除成功');
  };

  const ScreenCard = ({ screen }: { screen: Screen }) => (
    <Card size="small" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {statusIconMap[screen.status]}
          <span style={{ marginLeft: 8, fontWeight: 500 }}>{screen.name}</span>
        </div>
        <Tag color={screen.orientation === 'landscape' ? 'blue' : 'green'}>
          {screen.orientation === 'landscape' ? '横屏' : '竖屏'}
        </Tag>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        <div>位置: {screen.location}</div>
        <div>分辨率: {screen.resolution}</div>
        {screen.ip && <div>IP: {screen.ip}</div>}
      </div>
    </Card>
  );

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="屏幕总数" value={stats.total} prefix={<MonitorOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="在线" value={stats.online} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="离线" value={stats.offline} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="分组数量" value={stats.groups} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Card
            title="楼层导航"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
                新建分组
              </Button>
            }
          >
            <div style={{ marginBottom: 12 }}>
              <Button
                type={selectedFloor === null ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedFloor(null)}
                block
              >
                全部楼层
              </Button>
            </div>
            {floors.map((floor) => (
              <Button
                key={floor}
                type={selectedFloor === floor ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedFloor(floor)}
                block
                style={{ marginBottom: 8 }}
              >
                {floor > 0 ? `${floor}楼` : `B${Math.abs(floor)}层`}
                <Tag style={{ marginLeft: 8 }}>
                  {screens.filter((s) => s.floor === floor).length}台
                </Tag>
              </Button>
            ))}

            <div style={{ marginTop: 24, marginBottom: 8, fontWeight: 500 }}>
              <ApartmentOutlined /> 屏幕分组
            </div>
            <List
              size="small"
              dataSource={screenGroups}
              renderItem={(group) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  actions={[
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(group);
                      }}
                    />,
                    <Popconfirm
                      title="确定删除此分组?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDelete(group.id);
                      }}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={group.name}
                    description={
                      <div>
                        <Tag color="blue">
                          {group.floor > 0 ? `${group.floor}楼` : `B${Math.abs(group.floor)}层`}
                        </Tag>
                        <span style={{ fontSize: 12 }}>{group.screenIds.length}台屏幕</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={18}>
          <Card title={`屏幕列表 - ${selectedFloor === null ? '全部' : (selectedFloor > 0 ? `${selectedFloor}楼` : `B${Math.abs(selectedFloor)}层`)}`}>
            <Row gutter={[16, 16]}>
              {filteredScreens.map((screen) => (
                <Col span={8} key={screen.id}>
                  <Badge.Ribbon
                    text={statusTextMap[screen.status]}
                    color={screen.status === 'online' ? 'green' : screen.status === 'offline' ? 'red' : 'orange'}
                  >
                    <Card hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <MonitorOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 12 }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 16 }}>{screen.name}</div>
                          <div style={{ color: '#666', fontSize: 12 }}>{screen.location}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        <div>分辨率: {screen.resolution}</div>
                        <div>
                          方向: {screen.orientation === 'landscape' ? '横屏' : '竖屏'}
                        </div>
                        {screen.ip && <div>IP地址: {screen.ip}</div>}
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {screenGroups
                          .filter((g) => g.screenIds.includes(screen.id))
                          .map((g) => (
                            <Tag key={g.id} color="blue">
                              {g.name}
                            </Tag>
                          ))}
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingGroup ? '编辑屏幕分组' : '新建屏幕分组'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="分组名称" rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          <Form.Item name="floor" label="所属楼层" rules={[{ required: true, message: '请选择楼层' }]}>
            <Select placeholder="请选择楼层">
              {floors.map((floor) => (
                <Select.Option key={floor} value={floor}>
                  {floor > 0 ? `${floor}楼` : `B${Math.abs(floor)}层`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="screenIds" label="包含屏幕" rules={[{ required: true, message: '请选择屏幕' }]}>
            <Select mode="multiple" placeholder="请选择要加入分组的屏幕" optionFilterProp="label">
              {screens.map((screen) => (
                <Select.Option key={screen.id} value={screen.id} label={screen.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{screen.name}</span>
                    <Tag color={screen.status === 'online' ? 'green' : 'red'}>
                      {statusTextMap[screen.status]}
                    </Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="分组描述">
            <Input.TextArea rows={2} placeholder="请输入分组描述（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
