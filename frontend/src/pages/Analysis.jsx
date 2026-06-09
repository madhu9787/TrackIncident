import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Row, Col, Tag, Typography, Space, Empty, Alert, Divider,
  Tooltip, Button, Spin, Modal
} from 'antd';
import {
  BugOutlined, CodeOutlined, UserOutlined, ClockCircleOutlined,
  FileOutlined, WarningOutlined, ThunderboltFilled, CopyOutlined,
  CheckOutlined, DiffOutlined, BranchesOutlined
} from '@ant-design/icons';
import ConfidenceRing from '../components/ConfidenceRing';
import BlastRadiusBadge from '../components/BlastRadiusBadge';
import { useToast } from '../components/Toast';
import { getAnalyses, getAnalysisRuns } from '../services/api';

const { Title, Text } = Typography;

const SEV_CFG = {
  critical: { color: '#ef4444', bg: 'var(--bg-card)', border: '#ef444433' },
  high:     { color: '#f97316', bg: 'var(--bg-card)', border: '#f9731633' },
  medium:   { color: '#eab308', bg: 'var(--bg-card)', border: '#eab30833' },
  low:      { color: '#22c55e', bg: 'var(--bg-card)', border: '#22c55e33' },
};

// ── Diff viewer ───────────────────────────────────────────────────────────────

function DiffLine({ line, index }) {
  let bg = 'transparent';
  let color = '#9898b8';
  let prefix = ' ';

  if (line.startsWith('+++') || line.startsWith('---')) {
    bg = '#1a1a2e'; color = '#818cf8'; prefix = '';
  } else if (line.startsWith('+')) {
    bg = '#0a1a0f'; color = '#4ade80'; prefix = '';
  } else if (line.startsWith('-')) {
    bg = '#1a0808'; color = '#f87171'; prefix = '';
  } else if (line.startsWith('@@')) {
    bg = '#0d1117'; color = '#60a5fa'; prefix = '';
  } else if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('new file') || line.startsWith('old mode')) {
    bg = '#0d0d15'; color = '#6366f1'; prefix = '';
  }

  return (
    <div style={{
      display: 'flex', background: bg,
      borderLeft: line.startsWith('+') && !line.startsWith('+++')
        ? '3px solid #22c55e33'
        : line.startsWith('-') && !line.startsWith('---')
        ? '3px solid #ef444433'
        : '3px solid transparent',
    }}>
      <span style={{
        minWidth: 40, textAlign: 'right', paddingRight: 12,
        color: '#3a3a5a', fontSize: 11, userSelect: 'none',
        flexShrink: 0, lineHeight: '20px',
      }}>
        {index + 1}
      </span>
      <pre style={{
        margin: 0, padding: '0 12px 0 0', color, fontSize: 12,
        lineHeight: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        flex: 1, fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      }}>
        {line || ' '}
      </pre>
    </div>
  );
}

function DiffModal({ open, onClose, commit, incidentTitle }) {
  const [copied, setCopied] = useState(false);
  const diff = commit?.diff || commit?.commit_diff || '';
  const lines = diff ? diff.split('\n') : [];

  const additions = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const deletions = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  const files     = (commit?.files_changed || []);
  const commitHash = commit?.commit_hash || commit?.commit_id || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(diff).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={null}
      styles={{
        content: { background: '#0d0d15', border: '1px solid #1f1f2e', padding: 0, borderRadius: 14 },
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.7)' },
      }}
    >
      {/* Modal header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid #1f1f2e',
        background: '#13131e',
        borderRadius: '14px 14px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <DiffOutlined style={{ color: '#6366f1', fontSize: 16 }} />
            <Text style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 15 }}>
              Commit Diff
            </Text>
            <code style={{
              color: '#f97316', background: '#1a0f08', border: '1px solid #f9731622',
              padding: '2px 8px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace',
            }}>
              {commitHash.slice(0, 12) || '—'}
            </code>
          </div>
          <Text style={{ color: '#6b6b8a', fontSize: 12 }}>
            Root cause for: <span style={{ color: '#9898b8' }}>{incidentTitle}</span>
          </Text>
        </div>
        <Space size={8}>
          {/* Stats */}
          <Tag color="green" style={{ fontSize: 11 }}>+{additions}</Tag>
          <Tag color="red"   style={{ fontSize: 11 }}>−{deletions}</Tag>
          <Button
            size="small" type="text"
            icon={copied ? <CheckOutlined style={{ color: '#22c55e' }} /> : <CopyOutlined />}
            style={{ color: '#6b6b8a', border: '1px solid #2a2a3e', borderRadius: 6 }}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy diff'}
          </Button>
        </Space>
      </div>

      {/* Commit meta row */}
      <div style={{
        padding: '10px 24px',
        borderBottom: '1px solid var(--border-strong)',
        background: 'var(--bg-card)',
        display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <Space size={6}>
          <UserOutlined style={{ color: '#6b6b8a', fontSize: 11 }} />
          <Text style={{ color: '#9898b8', fontSize: 12 }}>{commit?.author || '—'}</Text>
        </Space>
        {commit?.branch && (
          <Space size={6}>
            <BranchesOutlined style={{ color: '#6b6b8a', fontSize: 11 }} />
            <code style={{ color: '#818cf8', fontSize: 12 }}>{commit.branch}</code>
          </Space>
        )}
        {files.length > 0 && (
          <Space size={4} wrap>
            {files.map(f => (
              <Tag key={f} icon={<FileOutlined />} color="default"
                style={{ fontSize: 10, fontFamily: 'monospace' }}>
                {f.split('/').pop()}
              </Tag>
            ))}
          </Space>
        )}
      </div>

      {/* Commit message */}
      {commit?.message && (
        <div style={{
          padding: '10px 24px', borderBottom: '1px solid #1a1a28',
          background: '#0b0b12',
        }}>
          <Text style={{ color: '#c2c2e0', fontSize: 13, fontStyle: 'italic' }}>
            {commit.message}
          </Text>
        </div>
      )}

      {/* Diff content */}
      <div style={{
        maxHeight: 480, overflowY: 'auto',
        background: '#080810',
        borderRadius: '0 0 14px 14px',
      }}>
        {!diff ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#4a4a6a' }}>
            <DiffOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
            No diff data available for this commit.
            <br />
            <span style={{ fontSize: 12 }}>
              Re-upload commits.json with diffs included (use{' '}
              <code style={{ color: '#6366f1' }}>git log -p</code> flag).
            </span>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {lines.map((line, i) => (
              <DiffLine key={i} line={line} index={i} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy commit hash'}>
      <Button
        size="small" type="text"
        icon={copied ? <CheckOutlined style={{ color: '#22c55e' }} /> : <CopyOutlined />}
        style={{ color: '#6b6b8a', padding: '0 4px' }}
        onClick={handle}
      />
    </Tooltip>
  );
}

// ── Incident card ─────────────────────────────────────────────────────────────

function IncidentCard({ item }) {
  const [diffOpen, setDiffOpen] = useState(false);

  const sev      = SEV_CFG[item.incident?.severity] || SEV_CFG.medium;
  const analysis = item.result;
  const commit   = analysis?.commit;

  if (!analysis) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 12, padding: 20, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BugOutlined style={{ color: 'var(--text-muted)', fontSize: 18, marginTop: 2 }} />
          <div>
            <Text style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.incident?.title}</Text>
            <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>{item.incident?.severity}</Tag>
            <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>
              No commits found in the {item.message || '6-hour correlation window'}.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const commitHash = commit?.commit_hash || commit?.commit_id || '';
  const hasDiff    = !!(commit?.diff || commit?.commit_diff);

  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${sev.border}`,
        borderRadius: 14,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: `0 2px 16px ${sev.color}08`,
        transition: 'box-shadow 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px ${sev.color}18`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 16px ${sev.color}08`}
      >
        {/* Card header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #1f1f2e',
          background: `${sev.bg}cc`,
        }}>
          <Row justify="space-between" align="middle" wrap={false}>
            <Col style={{ minWidth: 0 }}>
              <Space size={8} wrap>
                <BugOutlined style={{ color: sev.color, fontSize: 15 }} />
                <Text style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }} ellipsis>
                  {item.incident?.title}
                </Text>
                <Tag
                  color={item.incident?.severity === 'critical' ? 'red' : item.incident?.severity === 'high' ? 'orange' : 'gold'}
                  style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
                >
                  {item.incident?.severity}
                </Tag>
              </Space>
            </Col>
            <Col style={{ flexShrink: 0 }}>
              <Space size={6}>
                <Tag color="purple" icon={<ClockCircleOutlined />} style={{ fontSize: 11 }}>
                  {new Date(item.incident?.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Tag>
                {item.candidates_checked && (
                  <Tag color="blue" style={{ fontSize: 10 }}>{item.candidates_checked} commits checked</Tag>
                )}
              </Space>
            </Col>
          </Row>
          {item.incident?.description && (
            <Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginTop: 6 }}>
              {item.incident.description}
            </Text>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '20px' }}>
          <Row gutter={20} align="top">
            {/* Confidence ring */}
            <Col flex="110px" style={{ textAlign: 'center' }}>
              <ConfidenceRing value={analysis.confidence} size={96} />
            </Col>

            {/* Root cause commit */}
            <Col flex="1" style={{ minWidth: 0 }}>
              <div style={{
                background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px',
                border: '1px solid var(--border-light)', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Space>
                    <CodeOutlined style={{ color: '#6366f1' }} />
                    <Text style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>Likely root cause</Text>
                  </Space>
                  <Space>
                    <code style={{
                      color: '#f97316', background: '#1a0f08', border: '1px solid #f9731622',
                      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontFamily: 'monospace',
                    }}>
                      {commitHash.slice(0, 10) || '—'}
                    </code>
                    <CopyButton text={commitHash} />
                    {/* ── See Diff button ── */}
                    <Tooltip title={hasDiff ? 'View full diff in deep' : 'No diff data — re-upload commits with git log -p'}>
                      <Button
                        size="small"
                        icon={<DiffOutlined />}
                        onClick={() => setDiffOpen(true)}
                        style={{
                          borderColor: hasDiff ? '#6366f1' : '#2a2a3e',
                          color:       hasDiff ? '#818cf8' : '#4a4a6a',
                          background:  hasDiff ? '#6366f110' : 'transparent',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        See Diff
                      </Button>
                    </Tooltip>
                  </Space>
                </div>

                <Text style={{ color: 'var(--text-muted)', fontSize: 13, display: 'block', marginBottom: 10, lineHeight: 1.5 }}>
                  {commit?.message}
                </Text>

                <Space size={16} wrap>
                  <Space size={4}>
                    <UserOutlined style={{ color: '#6b6b8a', fontSize: 11 }} />
                    <Text style={{ color: '#6b6b8a', fontSize: 12 }}>{commit?.author}</Text>
                  </Space>
                  {commit?.delta_minutes != null && (
                    <Space size={4}>
                      <ClockCircleOutlined style={{ color: '#6b6b8a', fontSize: 11 }} />
                      <Text style={{ color: '#6b6b8a', fontSize: 12 }}>{commit.delta_minutes}m before incident</Text>
                    </Space>
                  )}
                  <BlastRadiusBadge value={analysis.blast_radius} />
                </Space>
              </div>

              {/* Changed files */}
              {commit?.files_changed?.length > 0 && (
                <div>
                  <Text style={{ color: '#4a4a6a', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                    Changed files
                  </Text>
                  <Space wrap size={4}>
                    {commit.files_changed.map(f => (
                      <Tooltip key={f} title={f}>
                        <Tag icon={<FileOutlined />} color="default"
                          style={{ fontSize: 10, fontFamily: 'monospace', cursor: 'default' }}>
                          {f.split('/').pop()}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                </div>
              )}
            </Col>
          </Row>

          <Divider style={{ borderColor: '#1f1f2e', margin: '16px 0' }} />

          {/* Explanation + Recommendation */}
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <div style={{
                background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px',
                border: '1px solid #22c55e33', height: '100%',
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <WarningOutlined style={{ color: '#22c55e', fontSize: 12, marginTop: 2 }} />
                  <Text style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Root Cause Explanation
                  </Text>
                </div>
                <Text style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.65 }}>
                  {analysis.explanation}
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{
                background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px',
                border: '1px solid #eab30833', height: '100%',
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <ThunderboltFilled style={{ color: '#eab308', fontSize: 12, marginTop: 2 }} />
                  <Text style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Recommended Action
                  </Text>
                </div>
                <Text style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.65 }}>
                  {analysis.recommendation}
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Diff modal */}
      <DiffModal
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        commit={commit}
        incidentTitle={item.incident?.title}
      />
    </>
  );
}


// ── Shape raw /analyses rows into the same format Dashboard returns ───────────

function shapeRunData(runId, runs, rawAnalyses) {
  const run         = runs.find(r => r.run_id === runId);
  const runAnalyses = rawAnalyses.filter(a => a.run_id === runId);

  return {
    run_id:    runId,
    run_label: run?.run_label,
    total:     runAnalyses.length,
    analyses:  runAnalyses.map(a => ({
      incident: {
        id:          a.incident_id,
        title:       a.incident_title,
        description: a.incident_description,
        severity:    a.severity,
        timestamp:   a.created_at,
      },
      result: {
        confidence:          a.confidence,
        explanation:         a.explanation,
        recommendation:      a.recommendation,
        blast_radius:        a.blast_radius,
        affected_components: a.affected_files || [],
        commit: {
          commit_hash:   a.commit_hash || '',
          commit_id:     a.commit_hash || '',
          message:       a.commit_message,
          author:        a.author,
          branch:        a.branch,
          files_changed: a.files_changed || [],
          diff:          a.commit_diff  || '',   // ← from c.diff AS commit_diff
          delta_minutes: null,
        },
      },
    })),
  };
}


// ── Page component ────────────────────────────────────────────────────────────

export default function Analysis() {
  const toast          = useToast();
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.analysisData) {
      setData(location.state.analysisData);
      return;
    }

    const runId = searchParams.get('run_id');
    if (runId) {
      setLoading(true);
      Promise.all([getAnalysisRuns(), getAnalyses()])
        .then(([runsRes, anaRes]) => {
          const shaped = shapeRunData(
            runId,
            runsRes.data.runs    || [],
            anaRes.data.analyses || [],
          );
          setData(shaped);
        })
        .catch(e => toast.error(`Failed to load run: ${e.message}`))
        .finally(() => setLoading(false));
    }
  }, [location.state, searchParams]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ color: '#6b6b8a', marginTop: 16 }}>Loading analysis run…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <Empty
          description={<span style={{ color: '#6b6b8a' }}>Run an analysis from the Dashboard, or open a run from History.</span>}
          style={{ padding: '80px 0' }}
        />
      </div>
    );
  }

  const analyses  = data.analyses || [];
  const matched   = analyses.filter(a => a.result);
  const unmatched = analyses.filter(a => !a.result);
  const avgConf   = matched.length
    ? Math.round(matched.reduce((s, a) => s + a.result.confidence, 0) / matched.length)
    : 0;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ric-analysis-${data.run_id?.slice(0, 8) || 'export'}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Analysis exported as JSON');
  };

  const handleDownloadTxt = () => {
    let text = 'RELEASE INCIDENT CORRELATOR - ANALYSIS REPORT\n';
    text += '=============================================\n\n';
    
    analyses.forEach((a, i) => {
      text += `Incident ${i+1}: ${a.incident?.title || 'Unknown'}\n`;
      text += `Severity: ${a.incident?.severity || 'N/A'}\n`;
      if (a.result) {
        text += `Root Cause Commit: ${a.result.commit?.commit_hash?.slice(0,8)} - ${a.result.commit?.message}\n`;
        text += `Confidence: ${Math.round(a.result.confidence)}%\n`;
        text += `Blast Radius: ${a.result.blast_radius}\n`;
        text += `Explanation: ${a.result.explanation}\n`;
        text += `Recommendation: ${a.result.recommendation}\n`;
      } else {
        text += `Root Cause: Not found in correlation window.\n`;
      }
      text += '---------------------------------------------\n\n';
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = `ric-report-${data.run_id?.slice(0, 8) || 'export'}.txt`;
    aEl.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded as TXT');
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>Analysis Results</Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {matched.length} of {analyses.length} incidents correlated · avg {avgConf}% confidence
            {data.run_label && <> · <Tag color="purple" style={{ marginLeft: 4 }}>{data.run_label}</Tag></>}
          </Text>
        </div>
        <Space>
          <Tag color="green">{matched.length} correlated</Tag>
          {unmatched.length > 0 && <Tag color="default">{unmatched.length} no match</Tag>}
          <Button size="small" icon={<FileOutlined />} onClick={handleExport}
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)', background: 'transparent' }}>
            Export JSON
          </Button>
          <Button size="small" icon={<FileOutlined />} onClick={handleDownloadTxt} type="primary"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }}>
            Download Report (.txt)
          </Button>
        </Space>
      </div>

      {/* Summary alert */}
      {matched.length > 0 && (
        <Alert
          type="info" showIcon
          style={{ marginBottom: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
          message={
            <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
              Found <strong style={{ color: '#6366f1' }}>{matched.length} likely root cause{matched.length > 1 ? 's' : ''}</strong>{' '}
              across {analyses.length} incidents using AI diff analysis
            </span>
          }
        />
      )}

      {analyses.map((item, i) => <IncidentCard key={i} item={item} />)}

      {/* Ant Modal dark theme overrides */}
      <style>{`
        .ant-modal-close { color: #6b6b8a !important; }
        .ant-modal-close:hover { color: #e2e2f0 !important; background: #1f1f2e !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a12; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 3px; }
      `}</style>
    </div>
  );
}
