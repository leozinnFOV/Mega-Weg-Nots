// Configuração centralizada da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_TIMEOUT = 10000 // 10 segundos

// Headers padrão para todas as requisições
const getHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  // Adicione o token JWT quando implementar autenticação
  // "Authorization": `Bearer ${getToken()}`
})

// Função para fazer requisições com timeout e tratamento de erro
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Verifica se a resposta tem conteúdo JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }

    return { success: true }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Timeout: Servidor não respondeu")
      }
      throw error
    }

    throw new Error("Erro desconhecido na requisição")
  }
}

// Função para testar conectividade com o backend
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    await apiRequest("/api/users", { method: "GET" })
    return true
  } catch (error) {
    console.log("Backend não disponível:", error)
    return false
  }
}

// Serviços da API organizados por funcionalidade
export const userService = {
  // GET /api/users - Listar todos os usuários
  getAll: () => apiRequest("/api/users"),

  // POST /api/users - Criar novo usuário
  create: (userData: any) =>
    apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // DELETE /api/users/<user_id> - Remover usuário
  delete: (userId: string) =>
    apiRequest(`/api/users/${userId}`, {
      method: "DELETE",
    }),

  // PATCH /api/users/<user_id>/status - Alterar status do usuário
  toggleStatus: (userId: string) =>
    apiRequest(`/api/users/${userId}/status`, {
      method: "PATCH",
    }),

  // POST /api/users/<user_id>/test-connection - Testar conexão IMAP
  testConnection: (userId: string) =>
    apiRequest(`/api/users/${userId}/test-connection`, {
      method: "POST",
    }),

  // POST /api/users/<user_id>/check-emails - Forçar verificação de emails
  checkEmails: (userId: string) =>
    apiRequest(`/api/users/${userId}/check-emails`, {
      method: "POST",
    }),

  // POST /api/users/<user_id>/test-telegram - Testar Telegram
  testTelegram: (userId: string) =>
    apiRequest(`/api/users/${userId}/test-telegram`, {
      method: "POST",
    }),
}

export const monitoringService = {
  // GET /api/monitoring/status - Obter status do monitoramento
  getStatus: () => apiRequest("/api/monitoring/status"),

  // PATCH /api/monitoring/status - Alterar status do monitoramento
  toggleStatus: (active: boolean) =>
    apiRequest("/api/monitoring/status", {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
}

export const logService = {
  // GET /api/logs - Obter logs do sistema
  getAll: () => apiRequest("/api/logs"),
}

export const settingsService = {
  // GET /api/settings - Obter configurações
  get: () => apiRequest("/api/settings"),

  // POST /api/settings - Salvar configurações
  save: (settings: any) =>
    apiRequest("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    }),
}
