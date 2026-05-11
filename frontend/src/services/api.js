/**
 * API Service — Comunicación con el backend FastAPI.
 *
 * Cambiá BASE_URL a la IP de tu máquina cuando
 * testees desde un dispositivo físico.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.79:8000/api/v1';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}`);
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

  async scanTicket(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'ticket.jpg',
    });
    try {
      const response = await fetch(`${BASE_URL}/scanner/ticket`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
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
