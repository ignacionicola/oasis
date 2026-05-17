import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.79:8000/api/v1';

class ApiService {
  async getToken() {
    return await AsyncStorage.getItem('oasis_token');
  }

  async setToken(token) {
    await AsyncStorage.setItem('oasis_token', token);
  }

  async removeToken() {
    await AsyncStorage.removeItem('oasis_token');
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const token = await this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (response.status === 401) {
        await this.removeToken();
        throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let message = `Error ${response.status}`;
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation error: [{loc, msg, type}, ...]
            const first = errorData.detail[0];
            message = first?.msg || message;
          } else if (typeof errorData.detail === 'string') {
            message = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            message = errorData.detail.msg || JSON.stringify(errorData.detail);
          }
        }
        throw new Error(message);
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('El servidor tardó demasiado en responder. Verificá tu conexión.');
      }
      if (error.message === 'Network request failed') {
        throw new Error('No se pudo conectar al servidor. ¿Está corriendo el backend?');
      }
      throw error;
    }
  }

  // ── Auth ──

  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    await this.removeToken();
  }

  async deleteData() {
    return this.request('/auth/data', { method: 'DELETE' });
  }

  async deleteAccount() {
    return this.request('/auth/account', { method: 'DELETE' });
  }

  // ── Expenses ──

  async createExpense(expenseData) {
    return this.request('/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async getExpenses({ month, year, category, search, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('limit', limit);

    return this.request(`/expenses/?${params.toString()}`);
  }

  async updateExpense(id, data) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  async exportExpenses() {
    const token = await this.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/expenses/export`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      await this.removeToken();
      throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}`);
    }

    return await response.blob();
  }

  async scanTicket(imageUri) {
    console.log('[API.scanTicket] URI recibida:', imageUri);
    const token = await this.getToken();
    console.log('[API.scanTicket] Token presente:', !!token);
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'ticket.jpg',
    });
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      console.log('[API.scanTicket] POST a', `${BASE_URL}/scanner/ticket`);
      const response = await fetch(`${BASE_URL}/scanner/ticket`, {
        method: 'POST',
        headers,
        body: formData,
      });
      console.log('[API.scanTicket] Status:', response.status);
      if (response.status === 401) {
        await this.removeToken();
        throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.log('[API.scanTicket] Error body:', err);
        throw new Error(err.detail || `Error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error.message === 'Network request failed') {
        throw new Error('No se pudo conectar al servidor. ¿Está corriendo el backend?');
      }
      throw error;
    }
  }

  // ── Budgets ──

  async getBudgets() {
    return this.request('/budgets/');
  }

  async createBudget(data) {
    return this.request('/budgets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async initDefaultBudgets() {
    return this.request('/budgets/init-defaults', { method: 'POST' });
  }

  // ── Incomes ──

  async createIncome(data) {
    return this.request('/incomes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIncomes({ month, year } = {}) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return this.request(`/incomes/?${params.toString()}`);
  }

  async deleteIncome(id) {
    return this.request(`/incomes/${id}`, { method: 'DELETE' });
  }

  // ── Dashboard ──

  async getMonthSummary(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return this.request(`/dashboard/summary?${params.toString()}`);
  }

  async getCategoriesBreakdown(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return this.request(`/dashboard/categories?${params.toString()}`);
  }
}

export default new ApiService();
