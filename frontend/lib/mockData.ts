// Dados mock para desenvolvimento e fallback
export interface User {
  id: string
  name: string
  email: string
  imapServer: string
  imapPort: number
  telegramChatId: string
  telegramToken: string
  active: boolean
  password?: string
}

export interface LogEntry {
  timestamp: string
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  message: string
  user?: string
}

export interface MonitoringStatus {
  active: boolean
  totalUsers: number
  activeUsers: number
  lastCheck: string
}

export const mockUsers: User[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@empresa.com",
    imapServer: "imap.gmail.com",
    imapPort: 993,
    telegramChatId: "123456789",
    telegramToken: "123456:ABC-DEF1234ghIkl",
    active: true,
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@empresa.com",
    imapServer: "imap.outlook.com",
    imapPort: 993,
    telegramChatId: "987654321",
    telegramToken: "654321:XYZ-ABC9876fedcba",
    active: false,
  },
  {
    id: "3",
    name: "Pedro Costa",
    email: "pedro@empresa.com",
    imapServer: "imap.empresa.com",
    imapPort: 993,
    telegramChatId: "555666777",
    telegramToken: "789012:DEF-GHI3456jklmno",
    active: true,
  },
]

export const mockLogs: LogEntry[] = [
  {
    timestamp: new Date().toLocaleString(),
    level: "INFO",
    message: "Sistema iniciado em modo de desenvolvimento",
  },
  {
    timestamp: new Date(Date.now() - 120000).toLocaleString(),
    level: "SUCCESS",
    message: "Email verificado com sucesso",
    user: "joao@empresa.com",
  },
  {
    timestamp: new Date(Date.now() - 300000).toLocaleString(),
    level: "WARNING",
    message: "Backend não configurado - usando dados simulados",
  },
  {
    timestamp: new Date(Date.now() - 450000).toLocaleString(),
    level: "SUCCESS",
    message: "Notificação Telegram enviada",
    user: "pedro@empresa.com",
  },
  {
    timestamp: new Date(Date.now() - 600000).toLocaleString(),
    level: "ERROR",
    message: "Falha na conexão IMAP - credenciais inválidas",
    user: "maria@empresa.com",
  },
  {
    timestamp: new Date(Date.now() - 750000).toLocaleString(),
    level: "INFO",
    message: "Verificação automática de emails iniciada",
  },
]

export const mockMonitoringStatus: MonitoringStatus = {
  active: true,
  totalUsers: mockUsers.length,
  activeUsers: mockUsers.filter((u) => u.active).length,
  lastCheck: new Date().toLocaleString(),
}
