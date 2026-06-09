import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '600000', 10);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const msg = isTimeout
      ? `Request timed out after ${TIMEOUT_MS / 1000}s. If using Ollama locally, set VITE_API_TIMEOUT_MS=180000.`
      : (err.response?.data?.detail || err.message || 'Network error');
    return Promise.reject(new Error(msg));
  }
);

export const uploadIncidents  = (file)  => { const f = new FormData(); f.append('file', file); return api.post('/upload/incidents', f); };
export const uploadCommits    = (file)  => { const f = new FormData(); f.append('file', file); return api.post('/upload/commits', f); };
export const runAnalysis      = ()      => api.post('/analyze');
export const getAnalyses      = ()      => api.get('/analyses');
export const getAnalysisRuns  = ()      => api.get('/analyses/runs');
export const deleteRun        = (runId) => api.delete(`/analyses/runs/${runId}`);
export const getStats         = ()      => api.get('/stats');
export const checkHealth      = ()      => api.get('/health');
export const sendChatMessage  = (messages) => api.post('/chat', { messages });

export default api;
