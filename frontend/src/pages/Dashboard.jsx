import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Alert, Progress, Spin, Typography, Divider, Tooltip, Tag, Space, Dropdown, Collapse, List } from 'antd';
import {
  ThunderboltOutlined, FileTextOutlined, CodeOutlined,
  InfoCircleOutlined, ReloadOutlined, AlertOutlined,
  RocketOutlined, BranchesOutlined, DownOutlined
} from '@ant-design/icons';
import StatCard from '../components/StatCard';
import UploadZone from '../components/UploadZone';
import { uploadIncidents, uploadCommits, runAnalysis, getStats } from '../services/api';
import { useToast } from '../components/Toast';

import demoIncidents1 from '../../assests/data/1/incidents.csv?raw';
import demoCommits1 from '../../assests/data/1/commits.json';
import demoIncidents2 from '../../assests/data/2/incidents.csv?raw';
import demoCommits2 from '../../assests/data/2/commits.json';

const { Text, Title } = Typography;

// NOTE: git log --pretty='...' -p is WRONG — it appends the diff after the JSON
// line as raw text, making the output invalid JSON. The correct approach is
// git show per commit via the generate_commits.py helper script.
const GIT_CMD_LINES = [
  { text: '# Run from your git repo root', color: '#6b6b8a' },
  { text: 'python3 generate_commits.py > commits.json', color: '#86efac' },
];

const GIT_CMD_NO_DIFF = [
  { text: '# Metadata only (no diff — heuristic analysis)', color: '#6b6b8a' },
  { text: "git log --format='%H\\t%an\\t%ae\\t%s\\t%aI' | python3 -c \\", color: '#86efac' },
  { text: '  "import sys,json; rows=sys.stdin.readlines();', color: '#c084fc' },
  { text: '   commits=[dict(zip([\'commit_id\',\'author\',\'email\',\'message\',\'timestamp\'],r.strip().split(\'\\t\',4))) for r in rows];', color: '#c084fc' },
  { text: '   print(json.dumps(commits,indent=2))" > commits.json', color: '#c084fc' },
];

const STAGES = [
  'Correlating commits to incidents…',
  'Sending diffs to AI engine…',
  'Scoring blast radius…',
  'Finalising root-cause report…',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [incidents,   setIncidents]   = useState(null);
  const [commits,     setCommits]     = useState(null);
  const [incUploading, setIncUploading] = useState(false);
  const [comUploading, setComUploading] = useState(false);
  const [incError,    setIncError]    = useState(null);
  const [comError,    setComError]    = useState(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [stageIdx,    setStageIdx]    = useState(0);
  const [stats,       setStats]       = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [incidentPreview, setIncidentPreview] = useState([]);
  const [commitPreview, setCommitPreview] = useState([]);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try { const res = await getStats(); setStats(res.data); } catch (_) {}
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h?.trim()] = values[i]?.trim());
      return obj;
    });
  };

  const loadDemoSample = async (sampleNum) => {
    try {
      const incRaw = sampleNum === 1 ? demoIncidents1 : demoIncidents2;
      const comData = sampleNum === 1 ? demoCommits1 : demoCommits2;
      
      const incFile = new File([incRaw], `incidents_sample${sampleNum}.csv`, { type: 'text/csv' });
      const comFile = new File([JSON.stringify(comData)], `commits_sample${sampleNum}.json`, { type: 'application/json' });
      
      await handleIncidentFile(incFile);
      await handleCommitFile(comFile);
      toast.success(`Demo Sample ${sampleNum} loaded successfully!`);
    } catch (e) {
      toast.error('Failed to load demo sample');
    }
  };

  const demoItems = [
    { key: '1', label: 'Load Sample 1', onClick: () => loadDemoSample(1) },
    { key: '2', label: 'Load Sample 2', onClick: () => loadDemoSample(2) }
  ];

  const handleIncidentFile = async (file) => {
    if (!file.name.endsWith('.csv')) { setIncError('File must be a .csv'); return; }
    setIncError(null);
    setIncUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setIncidentPreview(parseCSV(e.target.result));
    };
    reader.readAsText(file);

    try {
      const res = await uploadIncidents(file);
      setIncidents({ name: file.name, count: res.data.count });
      const skipNote = res.data.skipped ? ` · ${res.data.skipped} duplicates skipped` : '';
      toast.success(`Loaded ${res.data.count} incidents from ${file.name}${skipNote}`);
      loadStats();
    } catch (e) {
      setIncError(e.message);
      toast.error(`Incidents upload failed: ${e.message}`);
    } finally {
      setIncUploading(false);
    }
  };

  const handleCommitFile = async (file) => {
    if (!file.name.endsWith('.json')) { setComError('File must be a .json'); return; }
    setComError(null);
    setComUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setCommitPreview(JSON.parse(e.target.result));
      } catch (err) {}
    };
    reader.readAsText(file);

    try {
      const res = await uploadCommits(file);
      setCommits({ name: file.name, count: res.data.count });
      toast.success(`Loaded ${res.data.count} commits from ${file.name}`);
      loadStats();
    } catch (e) {
      setComError(e.message);
      toast.error(`Commits upload failed: ${e.message}`);
    } finally {
      setComUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!incidents) { toast.warning('Upload incidents.csv first'); return; }
    if (!commits)   { toast.warning('Upload commits.json first');   return; }

    setGlobalError(null);
    setAnalyzing(true);
    setProgress(0);
    setStageIdx(0);

    const tick = setInterval(() => {
      setProgress(p => {
        const next = p >= 88 ? 88 : p + Math.random() * 6;
        setStageIdx(Math.min(STAGES.length - 1, Math.floor(next / 25)));
        return next;
      });
    }, 700);

    try {
      const res = await runAnalysis();
      clearInterval(tick);
      setProgress(100);
      await loadStats();
      toast.success(`Analysis complete — ${res.data.total} incidents processed`);
      setTimeout(() => navigate('/analysis', { state: { analysisData: res.data } }), 400);
    } catch (e) {
      clearInterval(tick);
      setProgress(0);
      setGlobalError(e.message);
      toast.error(`Analysis failed: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = incidents && commits && !analyzing;

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>
          <RocketOutlined style={{ color: '#6366f1', marginRight: 10 }} />
          Release → Incident Correlator
        </Title>
        <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Upload incident tickets and git commits — AI pinpoints which commit caused each incident.
        </Text>
      </div>

      {/* ── KPI stats ───────────────────────────────────────────────────── */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 28 }}>
          <Col xs={12} sm={6}>
            <StatCard label="Incidents" value={stats.incidents} color="#ef4444"
              icon={<AlertOutlined />} />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard label="Commits" value={stats.commits} color="#6366f1"
              icon={<BranchesOutlined />} />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard label="Analyses Run" value={stats.analyses} color="#22c55e"
              icon={<ThunderboltOutlined />} />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard label="Avg Confidence" value={stats.avg_confidence} color="#eab308"
              icon={<RocketOutlined />} suffix="%" decimals={1} />
          </Col>
        </Row>
      )}

      <Row gutter={24}>
        {/* ── Upload + run column ── */}
        <Col xs={24} lg={12}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 16, padding: '32px 32px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>Data Sources</Text>
              <Space>
                <Dropdown menu={{ items: demoItems }} trigger={['click']}>
                  <Button size="small" style={{ borderColor: 'var(--border-strong)', color: '#10b981', background: 'transparent' }}>
                    Load Demo Sample <DownOutlined />
                  </Button>
                </Dropdown>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadStats}
                  style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)', background: 'transparent' }}>
                  Refresh Stats
                </Button>
              </Space>
            </div>

            {/* Incidents */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Space size={6}>
                  <FileTextOutlined style={{ color: '#ef4444' }} />
                  <Text style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>Incidents CSV</Text>
                  {incidents && <Tag color="green" style={{ fontSize: 10 }}>{incidents.count} loaded</Tag>}
                </Space>
                <Tooltip title="Required: title, timestamp (ISO 8601) · Optional: id (auto-generated if blank), description, severity">
                  <InfoCircleOutlined style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                </Tooltip>
              </div>
              <UploadZone
                accept=".csv" label="incidents.csv"
                hint="title · timestamp (required)" subHint="id auto-generated if blank · description · severity optional"
                uploaded={incidents} uploading={incUploading} error={incError}
                onFile={handleIncidentFile}
                onClear={() => { setIncidents(null); setIncError(null); setIncidentPreview([]); }}
              />
              {incError && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6, paddingLeft: 4 }}>
                  ⚠ {incError}
                </div>
              )}
            </div>

            {/* Commits */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Space size={6}>
                  <CodeOutlined style={{ color: '#6366f1' }} />
                  <Text style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>Commits JSON</Text>
                  {commits && <Tag color="purple" style={{ fontSize: 10 }}>{commits.count} loaded</Tag>}
                </Space>
                <Tooltip title='From: git log --format=&apos;{"commit_id":"%H","author":"%an","message":"%s","timestamp":"%aI"}&apos; -p > commits.json'>
                  <InfoCircleOutlined style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                </Tooltip>
              </div>
              <UploadZone
                accept=".json" label="commits.json"
                hint="commit_id · author · message · timestamp · diff"
                uploaded={commits} uploading={comUploading} error={comError}
                onFile={handleCommitFile}
                onClear={() => { setCommits(null); setComError(null); setCommitPreview([]); }}
              />
              {comError && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6, paddingLeft: 4 }}>
                  ⚠ {comError}
                </div>
              )}
            </div>

            {/* Validation warning */}
            {!incidents && !commits && (
              <Alert
                message="Upload both files to enable analysis"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {incidents && !commits && (
              <Alert
                message="Incidents loaded — now upload commits.json"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {!incidents && commits && (
              <Alert
                message="Commits loaded — now upload incidents.csv"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Global error */}
            {globalError && (
              <Alert
                message={globalError} type="error" showIcon closable
                style={{ marginBottom: 16 }}
                onClose={() => setGlobalError(null)}
              />
            )}

            {/* Progress */}
            {analyzing && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{STAGES[stageIdx]}</Text>
                  <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: 700 }}>{Math.round(progress)}%</Text>
                </div>
                <Progress
                  percent={Math.round(progress)} showInfo={false}
                  strokeColor={{ '0%': '#6366f1', '100%': '#a855f7' }}
                  trailColor="var(--bg-elevated)" strokeLinecap="round"
                />
              </div>
            )}

            {/* Analyze button */}
            <button
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              style={{
                width: '100%', height: 50, border: 'none', borderRadius: 10,
                background: canAnalyze
                  ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                  : 'var(--bg-elevated)',
                color: canAnalyze ? '#fff' : 'var(--text-muted)',
                fontWeight: 800, fontSize: 15, letterSpacing: 0.3,
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: canAnalyze ? '0 4px 24px #6366f144' : 'none',
              }}
              onMouseEnter={e => canAnalyze && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {analyzing ? <><Spin size="small" style={{ marginRight: 6 }} /> Analyzing with AI…</> : <><ThunderboltOutlined /> Analyze Incidents</>}
            </button>
          </div>
        </Col>

        {/* ── Data Preview column ── */}
        <Col xs={24} lg={12}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 16, padding: '32px 32px 24px', height: '100%',
            display: 'flex', flexDirection: 'column', gap: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          }}>
            <Text style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>Data Preview</Text>
            
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '10px' }}>
              <Text style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 600 }}>Incidents</Text>
              {incidentPreview.length > 0 ? (
                <List
                  dataSource={incidentPreview}
                  renderItem={item => (
                    <List.Item style={{ borderBottom: '1px solid var(--border-strong)', padding: '8px 0', display: 'block' }}>
                      <Text style={{ color: 'var(--text-primary)', display: 'block', fontWeight: 500 }}>{item.title || item.id}</Text>
                      <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.timestamp}</Text>
                    </List.Item>
                  )}
                />
              ) : <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>No incidents uploaded</Text>}
            </div>

            <Divider style={{ borderColor: 'var(--border-strong)', margin: '0' }} />

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', paddingRight: '10px' }}>
              <Text style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 600 }}>Commits & Diffs</Text>
              {commitPreview.length > 0 ? (
                <Collapse ghost expandIconPosition="end">
                  {commitPreview.map((commit, idx) => (
                    <Collapse.Panel 
                      key={idx} 
                      header={<Text style={{ color: 'var(--text-primary)' }}><span style={{color: '#a855f7'}}>{commit.commit_id?.substring(0,7)}</span> - {commit.message}</Text>}
                    >
                      <pre style={{ 
                        background: 'var(--bg-elevated)', padding: 12, borderRadius: 6, 
                        overflowX: 'auto', color: 'var(--text-muted)', fontSize: 11,
                        margin: 0, border: '1px solid var(--border-light)'
                      }}>
                        {commit.diff || 'No diff available'}
                      </pre>
                    </Collapse.Panel>
                  ))}
                </Collapse>
              ) : <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>No commits uploaded</Text>}
            </div>

          </div>
        </Col>
      </Row>
    </div>
  );
}
