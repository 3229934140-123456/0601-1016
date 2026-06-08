import { Layout, Menu } from 'antd';
import {
  PictureOutlined,
  MonitorOutlined,
  PlaySquareOutlined,
  CalendarOutlined,
  BellOutlined,
  AuditOutlined,
  DesktopOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { WindowKey } from '../types';
import MediaLibrary from '../pages/MediaLibrary';
import ScreenGroups from '../pages/ScreenGroups';
import PlaylistPage from '../pages/PlaylistPage';
import Schedule from '../pages/Schedule';
import Emergency from '../pages/Emergency';
import ApprovalCenter from '../pages/ApprovalCenter';
import Preview from '../pages/Preview';
import PublishRecord from '../pages/PublishRecord';

const { Sider, Content } = Layout;

const menuItems = [
  { key: 'mediaLibrary', icon: <PictureOutlined />, label: '素材库' },
  { key: 'screenGroups', icon: <MonitorOutlined />, label: '屏幕分组' },
  { key: 'playlist', icon: <PlaySquareOutlined />, label: '节目单' },
  { key: 'schedule', icon: <CalendarOutlined />, label: '排期日历' },
  { key: 'emergency', icon: <BellOutlined />, label: '紧急插播' },
  { key: 'approval', icon: <AuditOutlined />, label: '审批中心' },
  { key: 'preview', icon: <DesktopOutlined />, label: '播放预览' },
  { key: 'publishRecord', icon: <HistoryOutlined />, label: '发布记录' },
];

function renderContent(window: WindowKey) {
  switch (window) {
    case 'mediaLibrary':
      return <MediaLibrary />;
    case 'screenGroups':
      return <ScreenGroups />;
    case 'playlist':
      return <PlaylistPage />;
    case 'schedule':
      return <Schedule />;
    case 'emergency':
      return <Emergency />;
    case 'approval':
      return <ApprovalCenter />;
    case 'preview':
      return <Preview />;
    case 'publishRecord':
      return <PublishRecord />;
    default:
      return null;
  }
}

export default function MainLayout() {
  const { currentWindow, setCurrentWindow } = useAppStore();

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={220} theme="dark" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <MonitorOutlined style={{ marginRight: 8 }} />
          CMS 管理系统
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[currentWindow]}
          items={menuItems}
          onClick={({ key }) => setCurrentWindow(key as WindowKey)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Content style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh', overflow: 'auto' }}>
          {renderContent(currentWindow)}
        </Content>
      </Layout>
    </Layout>
  );
}
