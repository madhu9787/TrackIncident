import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, Tag, Tooltip, ConfigProvider, theme } from 'antd';
import {
  DashboardOutlined, LineChartOutlined, HistoryOutlined,
  FundOutlined, ApiOutlined, ClockCircleOutlined, MenuOutlined,
  SunFilled, MoonFilled
} from '@ant-design/icons';
import Landing   from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Analysis  from './pages/Analysis';
import History   from './pages/History';
import { ToastProvider } from './components/Toast';
import { checkHealth } from './services/api';

const { Header, Sider, Content } = Layout;

const NAV = [
  { key: '/dashboard', path: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/analysis',  path: '/analysis',  icon: <LineChartOutlined />, label: 'Analysis'  },
  { key: '/history',   path: '/history',   icon: <HistoryOutlined />,   label: 'History'   },
];

// ── App-shell (with sidebar) used for /dashboard /analysis /history ───────────
function AppShell({ theme, toggleTheme }) {
  const [aiStatus,   setAiStatus]   = useState('checking');
  const [healthData, setHealthData] = useState(null);
  const [collapsed,  setCollapsed]  = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = NAV.find(n => location.pathname === n.path)?.key ?? '/dashboard';

  useEffect(() => {
    checkHealth()
      .then(res => { setHealthData(res.data); setAiStatus('connected'); })
      .catch(()  => setAiStatus('fallback'));
  }, []);

  const isGroq      = healthData?.ai_provider === 'groq';
  const modelShort  = healthData?.model
    ? healthData.model.replace('llama3', 'Llama 3').replace('-instant', '').replace('-versatile', '').trim()
    : aiStatus === 'fallback' ? 'Heuristic' : '…';
  const providerLabel =
    aiStatus === 'checking' ? 'Connecting…'
    : aiStatus === 'fallback' ? 'Heuristic mode'
    : isGroq                 ? 'Groq connected'
    : 'Ollama connected';

  const statusMap = {
    connected: { color: 'success',    tagColor: isGroq ? 'green' : 'purple' },
    fallback:  { color: 'warning',    tagColor: 'gold'    },
    checking:  { color: 'processing', tagColor: 'default' },
  };
  const s = { ...statusMap[aiStatus], label: providerLabel, modelLabel: modelShort };

  const pageLabel = NAV.find(n => n.key === activeKey)?.label ?? 'Dashboard';

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        breakpoint="lg" collapsedWidth="0"
        trigger={null}
        width={228}
        style={{ background: 'var(--bg-app)', borderRight: '1px solid var(--border-solid)', position: 'relative', zIndex: 100 }}
      >
        {/* Logo — click returns to landing */}
        <div
          onClick={() => navigate('/')}
          style={{
            padding: collapsed ? '20px 12px' : '20px 18px',
            borderBottom: '1px solid var(--border-solid)',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
          }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px #6366f144',
          }}>
            <FundOutlined style={{ color: '#fff', fontSize: 17 }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 14, lineHeight: 1.2, letterSpacing: -0.3 }}>
                RIC
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: 10, letterSpacing: 0.5 }}>
                Incident Correlator
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ background: 'var(--bg-app)', border: 'none', marginTop: 8, padding: '0 8px' }}
          onClick={({ key }) => navigate(key)}
          items={NAV.map(n => ({
            key:   n.key,
            icon:  n.icon,
            label: n.label,
            style: {
              borderRadius: 8,
              marginBottom: 4,
              fontWeight: activeKey === n.key ? 700 : 500,
              background: activeKey === n.key ? 'var(--bg-elevated)' : 'transparent',
              color: activeKey === n.key ? '#6366f1' : 'var(--text-muted)',
            },
          }))}
        />

        {/* AI status pill */}
        {!collapsed && (
          <div style={{
            position: 'absolute', bottom: 52, left: 0, right: 0,
            padding: '12px 18px', borderTop: '1px solid var(--border-solid)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge status={s.color} />
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{s.label}</span>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ background: 'var(--bg-base)' }}>
        {/* ── Top header ──────────────────────────────────────────── */}
        <Header style={{
          background: 'var(--bg-app)', padding: '0 16px',
          borderBottom: '1px solid var(--border-solid)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MenuOutlined
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}
              className="lg:hidden"
            />
            {/* Logo on mobile */}
            <div className="lg:hidden flex items-center gap-2" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FundOutlined style={{ color: '#fff', fontSize: 14 }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>RIC</span>
            </div>

            <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>RIC</span>
              <span style={{ color: 'var(--border-solid)' }}>/</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>{pageLabel}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10 cursor-pointer"
              style={{ background: 'transparent', border: 'none' }}
            >
              {theme === 'dark' ? <SunFilled style={{ fontSize: 16, color: '#fbbf24' }} /> : <MoonFilled style={{ fontSize: 16, color: '#6366f1' }} />}
            </button>
          </div>
        </Header>

        {/* ── Content ─────────────────────────────────────────────── */}
        <Content style={{ padding: '28px 24px', overflow: 'auto', minHeight: 0 }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis"  element={<Analysis />} />
            <Route path="/history"   element={<History />} />
            {/* Fallback inside shell → Dashboard */}
            <Route path="*"          element={<Dashboard />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

// ── Root: Landing has NO sidebar, everything else uses AppShell ────────────────
import ChatBot from './components/ChatBot';

export default function App() {
  const [themeMode, setThemeMode] = useState('dark');

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
          colorPrimary:     '#6366f1',
          colorBgBase:      themeMode === 'light' ? '#f8fafc' : '#0b0b10',
          colorBgContainer: themeMode === 'light' ? '#ffffff' : '#16161d',
          colorBgElevated:  themeMode === 'light' ? '#f1f5f9' : '#1e1e2a',
          colorText:        themeMode === 'light' ? '#0f172a' : '#ffffff',
          borderRadius:     8,
          fontFamily:       "'Inter', 'SF Pro Display', system-ui, sans-serif",
        },
        components: {
          Layout: { siderBg: 'var(--bg-app)', headerBg: 'var(--bg-app)' },
          Menu:   { darkItemBg: 'var(--bg-app)', darkSubMenuItemBg: 'var(--bg-app)', darkItemSelectedBg: 'var(--bg-elevated)' },
        },
      }}
    >
      <ToastProvider>
        <ChatBot />
        <Routes>
          {/* Full-page landing — no app shell */}
          <Route path="/" element={<Landing theme={themeMode} toggleTheme={toggleTheme} />} />
          {/* All other routes get the sidebar shell */}
          <Route path="/*" element={<AppShell theme={themeMode} toggleTheme={toggleTheme} />} />
        </Routes>
      </ToastProvider>
    </ConfigProvider>
  );
}
