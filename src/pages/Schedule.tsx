import { useState, useMemo } from 'react';
import {
  Card,
  Calendar,
  Badge,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  List,
  Row,
  Col,
  Statistic,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { ScheduleItem } from '../types';

const { RangePicker } = DatePicker;

export default function Schedule() {
  const {
    scheduleItems,
    playlists,
    screenGroups,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedulePause,
  } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [form] = Form.useForm();

  const dateSchedules = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    scheduleItems.forEach((schedule) => {
      const start = dayjs(schedule.startDate);
      const end = dayjs(schedule.endDate);
      let current = start;
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        const key = current.format('YYYY-MM-DD');
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(schedule);
        current = current.add(1, 'day');
      }
    });
    return map;
  }, [scheduleItems]);

  const stats = useMemo(() => {
    const today = dayjs();
    const todayItems = scheduleItems.filter(
      (s) => !s.isPaused && today.isBetween(dayjs(s.startDate), dayjs(s.endDate), 'day', '[]')
    );
    const pausedItems = scheduleItems.filter((s) => s.isPaused);
    const expiredItems = scheduleItems.filter((s) => dayjs(s.endDate).isBefore(today, 'day'));
    const holidayItems = scheduleItems.filter((s) => s.isHoliday);
    return {
      today: todayItems.length,
      paused: pausedItems.length,
      expired: expiredItems.length,
      holiday: holidayItems.length,
    };
  }, [scheduleItems]);

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    return dateSchedules.get(dateStr) || [];
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    form.setFieldsValue({
      repeat: 'daily',
      isHoliday: false,
      isPaused: false,
    });
    setModalVisible(true);
  };

  const handleEdit = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      playlistId: schedule.playlistId,
      screenGroupId: schedule.screenGroupId,
      dateRange: [dayjs(schedule.startDate), dayjs(schedule.endDate)],
      timeRange: [dayjs(schedule.startTime, 'HH:mm'), dayjs(schedule.endTime, 'HH:mm')],
      repeat: schedule.repeat,
      isHoliday: schedule.isHoliday,
      isPaused: schedule.isPaused,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const [startDate, endDate] = values.dateRange;
      const [startTime, endTime] = values.timeRange;
      const playlist = playlists.find((p) => p.id === values.playlistId);
      const screenGroup = screenGroups.find((g) => g.id === values.screenGroupId);

      if (editingSchedule) {
        updateSchedule(editingSchedule.id, {
          playlistId: values.playlistId,
          playlistName: playlist?.name,
          screenGroupId: values.screenGroupId,
          screenGroupName: screenGroup?.name,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          startTime: startTime.format('HH:mm'),
          endTime: endTime.format('HH:mm'),
          repeat: values.repeat,
          isHoliday: values.isHoliday,
          isPaused: values.isPaused,
        });
        message.success('修改成功');
      } else {
        addSchedule({
          id: `sch${Date.now()}`,
          playlistId: values.playlistId,
          playlistName: playlist?.name,
          screenGroupId: values.screenGroupId,
          screenGroupName: screenGroup?.name,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          startTime: startTime.format('HH:mm'),
          endTime: endTime.format('HH:mm'),
          repeat: values.repeat,
          isHoliday: values.isHoliday,
          isPaused: values.isPaused,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
    });
  };

  const handleDelete = (id: string) => {
    deleteSchedule(id);
    message.success('删除成功');
  };

  const handleTogglePause = (id: string) => {
    toggleSchedulePause(id);
    const schedule = scheduleItems.find((s) => s.id === id);
    message.success(schedule?.isPaused ? '已恢复播放' : '已暂停');
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    const isToday = value.isSame(dayjs(), 'day');
    const isPast = value.isBefore(dayjs(), 'day');

    return (
      <ul className="schedule-events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.slice(0, 3).map((item) => (
          <li key={item.id} style={{ marginBottom: 4 }}>
            <Badge
              status={item.isPaused ? 'default' : item.isHoliday ? 'orange' : 'success'}
              text={
                <span
                  style={{
                    fontSize: 11,
                    color: item.isPaused ? '#999' : undefined,
                    textDecoration: item.isPaused ? 'line-through' : 'none',
                  }}
                >
                  {item.playlistName}
                </span>
              }
            />
          </li>
        ))}
        {listData.length > 3 && (
          <li style={{ fontSize: 11, color: '#999' }}>+{listData.length - 3} 更多</li>
        )}
      </ul>
    );
  };

  const selectedDateSchedules = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    return dateSchedules.get(dateStr) || [];
  }, [selectedDate, dateSchedules]);

  const hasExpiredContent = useMemo(() => {
    return scheduleItems.some((s) => dayjs(s.endDate).isBefore(dayjs(), 'day'));
  }, [scheduleItems]);

  return (
    <div>
      {hasExpiredContent && (
        <Alert
          message="有排期已过期"
          description="部分排期内容已超过有效期，请及时清理或更新。"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="今日排期" value={stats.today} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已暂停" value={stats.paused} valueStyle={{ color: '#999' }} prefix={<PauseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已过期" value={stats.expired} valueStyle={{ color: '#ff4d4f' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="节假日排期" value={stats.holiday} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="排期日历"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
                新建排期
              </Button>
            }
          >
            <Calendar cellRender={dateCellRender} onSelect={setSelectedDate} />
          </Card>
        </Col>

        <Col span={8}>
          <Card title={`${selectedDate.format('YYYY年MM月DD日')} 排期`}>
            {selectedDateSchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                当日无排期
              </div>
            ) : (
              <List
                dataSource={selectedDateSchedules}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                    }}
                    actions={[
                      <Tooltip title={item.isPaused ? '恢复' : '暂停'}>
                        <Button
                          type="text"
                          size="small"
                          icon={item.isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
                          onClick={() => handleTogglePause(item.id)}
                        />
                      </Tooltip>,
                      <Popconfirm
                        title="确定删除此排期?"
                        onConfirm={() => handleDelete(item.id)}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500 }}>{item.playlistName}</span>
                      <Space>
                        {item.isHoliday && <Tag color="orange">节假日</Tag>}
                        {item.isPaused ? (
                          <Tag color="default">已暂停</Tag>
                        ) : (
                          <Tag color="green">播放中</Tag>
                        )}
                      </Space>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      <ClockCircleOutlined /> {item.startTime} - {item.endTime}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      屏幕组: {item.screenGroupName}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Button type="link" size="small" onClick={() => handleEdit(item)}>
                        编辑
                      </Button>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingSchedule ? '编辑排期' : '新建排期'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="playlistId" label="节目单" rules={[{ required: true, message: '请选择节目单' }]}>
            <Select placeholder="请选择节目单" showSearch optionFilterProp="label">
              {playlists.map((p) => (
                <Select.Option key={p.id} value={p.id} label={p.name}>
                  <Space>
                    <span>{p.name}</span>
                    <Tag color={p.status === 'approved' ? 'green' : 'orange'}>
                      {p.status === 'approved' ? '已审核' : '草稿'}
                    </Tag>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="screenGroupId" label="屏幕分组" rules={[{ required: true, message: '请选择屏幕分组' }]}>
            <Select placeholder="请选择屏幕分组">
              {screenGroups.map((g) => (
                <Select.Option key={g.id} value={g.id}>
                  {g.name}（{g.screenIds.length}台）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="播放日期" rules={[{ required: true, message: '请选择播放日期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="timeRange" label="播放时段" rules={[{ required: true, message: '请选择播放时段' }]}>
            <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item name="repeat" label="重复方式" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="none">不重复</Select.Option>
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="isHoliday" label="仅节假日播放" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="isPaused" label="暂停播放" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
