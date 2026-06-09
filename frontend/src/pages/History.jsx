import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag, Typography, Space, Button,
  Empty, Spin, Tooltip, Modal, Row, Col
} from 'antd';
import {
  ReloadOutlined, LineChartOutlined, UserOutlined,
  DeleteOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getAnalysisRuns, getAnalyses, deleteRun } from '../services/api';
import BlastRadiusBadge from '../components/BlastRadiusBadge';
import ConfidenceRing from '../components/ConfidenceRing';
import { useToast } from '../components/Toast';

const { Text, Title } = Typography;

function RunCard({ run, analyses, onDelete, onView }) {
  const [expanded, setExpanded] = useState(false);
  const runAnalyses = analyses.filter(a => a.run_id === run.run_id);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: 12, marginBottom: 14, overflow: 'hidden',
    }}>
      {/* Run header */}
      <div
        style={{
          padding: '14px 20px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: expanded ? 'var(--bg-elevated)' : 'var(--bg-card)',
          transition: 'background 0.15s',
          borderBottom: expanded ? '1px solid var(--border-strong)' : 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Space size={12}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#6366f1', boxShadow: '0 0 8px #6366f1',
          }} />
          <div>
            <Text style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>
              {run.run_label || run.run_id.slice(0, 8)}
            </Text>
            <Text style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 10 }}>
              {new Date(run.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </div>
          <Tag color="purple" style={{ fontSize: 10 }}>
            {run.incident_count} incident{run.incident_count !== 1 ? 's' : ''}
          </Tag>
          <Tag
            color={run.avg_confidence >= 75 ? 'green' : run.avg_confidence >= 50 ? 'gold' : 'red'}
            style={{ fontSize: 10 }}
          >
            avg {run.avg_confidence?.toFixed(1)}% confidence
          </Tag>
        </Space>

        <Space>
          <Button
            size="small" type="link" icon={<LineChartOutlined />}
            style={{ color: '#6366f1', padding: 0 }}
            onClick={e => { e.stopPropagation(); onView(run.run_id); }}
          >
            View
          </Button>
          <Button
            size="small" type="text" icon={<DeleteOutlined />}
            danger style={{ padding: '0 8px' }}
            onClick={e => { e.stopPropagation(); onDelete(run); }}
          />
          <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</Text>
        </Space>
      </div>

      {/* Expanded analysis rows */}
      {expanded && (
        <div style={{ padding: '0 0 8px' }}>
          {runAnalyses.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No detail records for this run.
            </div>
          ) : runAnalyses.map(a => (
            <div key={a.id} style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Confidence mini */}
              <div style={{ flexShrink: 0 }}>
                <ConfidenceRing value={a.confidence} size={52} />
              </div>

              {/* Incident + commit */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Text style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }} ellipsis>
                    {a.incident_title}
                  </Text>
                  <Tag
                    color={a.severity === 'critical' ? 'red' : a.severity === 'high' ? 'orange' : 'gold'}
                    style={{ fontSize: 9, textTransform: 'uppercase' }}
                  >
                    {a.severity}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <code style={{
                    color: '#f97316', background: '#1a0f08', border: '1px solid #f9731622',
                    padding: '1px 6px', borderRadius: 4, fontSize: 10,
                  }}>
                    {/* commit_hash is the real column; commit_id is an alias from the JOIN */}
                    {(a.commit_hash || a.commit_id || '').slice(0, 10)}
                  </code>
                  <Text style={{ color: 'var(--text-muted)', fontSize: 11 }} ellipsis>{a.commit_message}</Text>
                </div>
              </div>

              {/* Author */}
              <Space size={4} style={{ flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserOutlined style={{ color: '#6366f1', fontSize: 11 }} />
                </div>
                <Text style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.author}</Text>
              </Space>

              {/* Blast radius */}
              <div style={{ flexShrink: 0 }}>
                <BlastRadiusBadge value={a.blast_radius} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const toast    = useToast();
  const navigate = useNavigate();

  const [runs,     setRuns]     = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [runsRes, anaRes] = await Promise.all([getAnalysisRuns(), getAnalyses()]);
      setRuns(runsRes.data.runs     || []);
      setAnalyses(anaRes.data.analyses || []);
    } catch (e) {
      toast.error(`Failed to load history: ${e.message}`);
    }
    setLoading(false);
  };

  const handleDeleteConfirm = (run) => {
    Modal.confirm({
      title: 'Delete this run?',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div style={{ color: 'var(--text-muted)' }}>
          This will permanently delete all {run.incident_count} analyses from run{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{run.run_label}</strong>.
          This action cannot be undone.
        </div>
      ),
      okText: 'Delete Run',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        setDeleting(run.run_id);
        try {
          await deleteRun(run.run_id);
          toast.success(`Run "${run.run_label}" deleted`);
          await load();
        } catch (e) {
          toast.error(`Delete failed: ${e.message}`);
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  // Navigate to /analysis?run_id=<id> — Analysis page fetches and shapes the data
  const handleView = (runId) => {
    navigate(`/analysis?run_id=${runId}`);
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>Analysis History</Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {runs.length} run{runs.length !== 1 ? 's' : ''} · {analyses.length} total analyses stored
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)', background: 'transparent' }}>
          Refresh
        </Button>
      </div>

      {/* Run summary stat cards */}
      {runs.length > 0 && (
        <Row gutter={12} style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Runs',     value: runs.length,      color: '#6366f1' },
            { label: 'Total Analyses', value: analyses.length,  color: '#22c55e' },
            { label: 'Avg Confidence', value: `${(analyses.reduce((s, a) => s + a.confidence, 0) / (analyses.length || 1)).toFixed(1)}%`, color: '#eab308' },
          ].map(s => (
            <Col xs={8} key={s.label}>
              <div style={{
                background: 'var(--bg-card)', border: `1px solid ${s.color}22`,
                borderRadius: 10, padding: '14px 18px',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Run list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Loading analysis history…</div>
        </div>
      ) : runs.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: 12, padding: '60px 0', textAlign: 'center',
        }}>
          <Empty
            description={<span style={{ color: 'var(--text-muted)' }}>No analyses yet. Run an analysis from the Dashboard.</span>}
          />
        </div>
      ) : (
        runs.map(run => (
          <RunCard
            key={run.run_id}
            run={run}
            analyses={analyses}
            onDelete={handleDeleteConfirm}
            onView={handleView}
          />
        ))
      )}

      {/* Modal dark theme overrides */}
      <style>{`
        .ant-modal-content { background: #1e1e2a !important; border: 1px solid #2a2a3e; }
        .ant-modal-title    { color: #e2e2f0 !important; }
        .ant-modal-confirm-content { color: #9898b8 !important; }
        .ant-btn-default    { background: #16161d !important; border-color: #2a2a3e !important; color: #9898b8 !important; }
      `}</style>
    </div>
  );
}
