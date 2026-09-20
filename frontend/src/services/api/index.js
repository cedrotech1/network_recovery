import apiClient, { API_BASE_URL } from './config.js';

function makeCrudService(basePath) {
  return {
    getAll: async (params = {}) => (await apiClient.get(basePath, { params })).data,
    getById: async (id) => (await apiClient.get(`${basePath}/${id}`)).data,
    create: async (data) => (await apiClient.post(basePath, data)).data,
    update: async (id, data) => (await apiClient.put(`${basePath}/${id}`, data)).data,
    remove: async (id) => (await apiClient.delete(`${basePath}/${id}`)).data,
  };
}

export const nodesService = {
  ...makeCrudService('/nodes'),
  recover: async (id) => (await apiClient.post(`/nodes/${id}/recover`)).data,
  provision: async (id) => (await apiClient.post(`/nodes/${id}/provision`)).data,
};

export const networkService = {
  dashboard: async () => (await apiClient.get('/dashboard')).data,
  metrics: async (params = {}) => (await apiClient.get('/metrics', { params })).data,
  generalReport: async (params = {}) => (await apiClient.get('/report/general', { params })).data,
  settings: async () => (await apiClient.get('/settings')).data,
  updateSettings: async (payload) => (await apiClient.put('/settings', payload)).data,
  failures: async (params = {}) => (await apiClient.get('/failures', { params })).data,
  recoveries: async (params = {}) => (await apiClient.get('/recoveries', { params })).data,
  healthChecks: async (params = {}) => (await apiClient.get('/health-checks', { params })).data,
  logs: async (params = {}) => (await apiClient.get('/logs', { params })).data,
  inject: async (payload) => (await apiClient.post('/experiments/inject', payload)).data,
  injectMulti: async (payload) => (await apiClient.post('/experiments/inject-multi', payload)).data,
  clearHistory: async () => (await apiClient.post('/experiments/clear-history')).data,
  resetToStart: async () => (await apiClient.post('/experiments/reset-to-start')).data,
  runCycle: async () => (await apiClient.post('/monitor/run-cycle')).data,
};

export const usersService = {
  getAll: async () => (await apiClient.get('/auth/users')).data,
  create: async (data) => (await apiClient.post('/auth/users', data)).data,
};

export function resolveSocketUrl() {
  try {
    const api = new URL(API_BASE_URL);
    return `${api.protocol}//${api.host}`;
  } catch {
    return 'http://localhost:9500';
  }
}

export { authService } from './authService.js';
export { default as apiClient } from './config.js';
