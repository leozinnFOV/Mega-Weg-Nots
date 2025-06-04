"use client"

import { useState, useEffect } from "react"
import {
  Monitor,
  Users,
  Activity,
  Settings,
  Plus,
  Play,
  Square,
  Wifi,
  WifiOff,
  Mail,
  MessageSquare,
  Power,
  RefreshCw,
  Trash2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useApi } from "@/hooks/useApi"

export default function WegMonitor() {
  const [activeView, setActiveView] = useState("dashboard")
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    imapServer: "",
    imapPort: 993,
    telegramChatId: "",
    telegramToken: "",
    active: true,
    password: "",
  })

  const { toast } = useToast()
  const api = useApi()
  const userApi = api.useUsers()
  const logApi = api.useLogs()
  const monitoringApi = api.useMonitoring()

  // Navigation items
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "users", label: "Usuários", icon: Users },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "settings", label: "Configurações", icon: Settings },
  ]

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([userApi.loadUsers(), logApi.loadLogs(), monitoringApi.loadStatus()])

      // Mostrar status da conexão apenas se conectado
      if (api.isConnected) {
        toast({
          title: "Conectado ao Backend",
          description: "Sistema pronto para uso",
        })
      }
    }

    initializeData()
  }, [])

  // Adicionar usuário
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos nome e email",
        variant: "destructive",
      })
      return
    }

    const success = await userApi.addUser(newUser)

    if (success) {
      toast({
        title: "Usuário Adicionado",
        description: "Usuário criado com sucesso",
      })

      // Limpar formulário
      setNewUser({
        name: "",
        email: "",
        imapServer: "",
        imapPort: 993,
        telegramChatId: "",
        telegramToken: "",
        active: true,
        password: "",
      })

      setActiveView("users")
    } else {
      toast({
        title: "Erro",
        description: "Falha ao adicionar usuário",
        variant: "destructive",
      })
    }
  }

  // Toggle status do usuário
  const handleToggleUserStatus = async (userId: string) => {
    const success = await userApi.toggleUserStatus(userId)

    if (success) {
      toast({
        title: "Status Alterado",
        description: "Status do usuário atualizado",
      })
    } else {
      toast({
        title: "Erro",
        description: "Falha ao alterar status",
        variant: "destructive",
      })
    }
  }

  // Deletar usuário
  const handleDeleteUser = async (userId: string) => {
    const success = await userApi.deleteUser(userId)

    if (success) {
      toast({
        title: "Usuário Removido",
        description: "Usuário removido com sucesso",
      })
    } else {
      toast({
        title: "Erro",
        description: "Falha ao remover usuário",
        variant: "destructive",
      })
    }
  }

  // Testar conexão
  const handleTestConnection = async (userId: string, type: "imap" | "telegram") => {
    const success = await userApi.testConnection(userId, type)

    if (success) {
      toast({
        title: "Teste Realizado",
        description: `Conexão ${type.toUpperCase()} testada com sucesso`,
      })
    } else {
      toast({
        title: "Erro no Teste",
        description: `Falha no teste de conexão ${type.toUpperCase()}`,
        variant: "destructive",
      })
    }
  }

  // Toggle monitoramento
  const handleToggleMonitoring = async () => {
    const success = await monitoringApi.toggleMonitoring()

    if (success) {
      toast({
        title: monitoringApi.status.active ? "Monitoramento Parado" : "Monitoramento Iniciado",
        description: "Status do sistema atualizado",
      })
    } else {
      toast({
        title: "Erro",
        description: "Falha ao alterar monitoramento",
        variant: "destructive",
      })
    }
  }

  // Atualizar dados
  const handleRefresh = async () => {
    await Promise.all([userApi.loadUsers(), logApi.loadLogs(), monitoringApi.loadStatus()])

    toast({
      title: "Dados Atualizados",
      description: "Informações recarregadas",
    })
  }

  const activeUsers = userApi.users.filter((u) => u.active).length

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Visão geral do sistema de monitoramento</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userApi.users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                  <Power className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${monitoringApi.status.active ? "text-green-600" : "text-red-600"}`}
                  >
                    {monitoringApi.status.active ? "Online" : "Offline"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Controle do Monitoramento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Status: {monitoringApi.status.active ? "Monitoramento Ativo" : "Sistema Parado"}
                    </p>
                    <p className="text-sm text-gray-500">Backend: {api.isConnected ? "Conectado" : "Desconectado"}</p>
                    <p className="text-sm text-gray-500">Última verificação: {monitoringApi.status.lastCheck}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                    <Button
                      onClick={handleToggleMonitoring}
                      variant={monitoringApi.status.active ? "destructive" : "default"}
                    >
                      {monitoringApi.status.active ? "Parar Sistema" : "Iniciar Sistema"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "users":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Usuários</h1>
                <p className="text-gray-600">Gerencie os usuários do sistema de monitoramento</p>
              </div>
              <Button onClick={() => setActiveView("add-user")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            {userApi.users.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário cadastrado</h3>
                  <p className="text-gray-500 mb-4">Adicione o primeiro usuário para começar o monitoramento</p>
                  <Button onClick={() => setActiveView("add-user")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userApi.users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            {user.imapServer}:{user.imapPort}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={user.active ? "default" : "secondary"}>
                            {user.active ? "Ativo" : "Inativo"}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleToggleUserStatus(user.id)}>
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleTestConnection(user.id, "imap")}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTestConnection(user.id, "telegram")}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case "add-user":
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button onClick={() => setActiveView("users")} variant="outline">
                ← Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Adicionar Usuário</h1>
                <p className="text-gray-600">Configure um novo usuário para monitoramento</p>
              </div>
            </div>

            <Card className="max-w-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imapServer">Servidor IMAP</Label>
                    <Input
                      id="imapServer"
                      value={newUser.imapServer}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, imapServer: e.target.value }))}
                      placeholder="imap.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imapPort">Porta IMAP</Label>
                    <Input
                      id="imapPort"
                      type="number"
                      value={newUser.imapPort}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, imapPort: Number.parseInt(e.target.value) }))}
                      placeholder="993"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                    <Input
                      id="telegramChatId"
                      value={newUser.telegramChatId}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, telegramChatId: e.target.value }))}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telegramToken">Telegram Token</Label>
                    <Input
                      id="telegramToken"
                      value={newUser.telegramToken}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, telegramToken: e.target.value }))}
                      placeholder="123456:ABC-DEF"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Senha do email"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newUser.active}
                      onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="active">Ativar monitoramento</Label>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button onClick={() => setActiveView("users")} variant="outline">
                    Cancelar
                  </Button>
                  <Button onClick={handleAddUser}>Adicionar Usuário</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "logs":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Logs</h1>
                <p className="text-gray-600">Visualize os logs do sistema em tempo real</p>
              </div>
              <Button onClick={logApi.loadLogs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {logApi.logs.length === 0 ? (
                  <div className="p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum log disponível</h3>
                    <p className="text-gray-500">Os logs do sistema aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {logApi.logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={
                              log.level === "SUCCESS"
                                ? "default"
                                : log.level === "WARNING"
                                  ? "secondary"
                                  : log.level === "ERROR"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {log.level}
                          </Badge>
                          <span>{log.message}</span>
                          {log.user && <span className="text-gray-500 text-sm">({log.user})</span>}
                        </div>
                        <span className="text-gray-500 text-sm font-mono">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
              <p className="text-gray-600">Configure as opções globais do sistema</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiUrl">URL do Backend</Label>
                  <Input id="apiUrl" value={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"} disabled />
                  <p className="text-sm text-gray-500 mt-1">
                    Configure NEXT_PUBLIC_API_URL no arquivo .env.local para conectar ao backend
                  </p>
                </div>

                <div>
                  <Label>Status da Conexão</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {api.isConnected ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Wifi className="h-3 w-3 mr-1" />
                        Conectado ao Backend
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Backend Desconectado
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="checkInterval">Intervalo de Verificação (minutos)</Label>
                  <Input id="checkInterval" type="number" defaultValue="5" />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="autoRefresh" defaultChecked />
                  <Label htmlFor="autoRefresh">Auto-refresh ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="notifications" defaultChecked />
                  <Label htmlFor="notifications">Notificações ativas</Label>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={api.checkConnection} variant="outline">
                    Testar Conexão
                  </Button>
                  <Button>Salvar Configurações</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">WEG MONITOR</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={monitoringApi.status.active ? "default" : "secondary"}>
                  {monitoringApi.status.active ? "Ativo" : "Inativo"}
                </Badge>
                {api.isConnected ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeView === item.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Status Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Última verificação:</p>
            <p className="font-mono">{monitoringApi.status.lastCheck}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {userApi.users.length} usuários • {activeUsers} ativos
              </div>
            </div>
            <Button
              onClick={handleToggleMonitoring}
              variant={monitoringApi.status.active ? "destructive" : "default"}
              size="sm"
            >
              {monitoringApi.status.active ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">{renderContent()}</div>
      </div>

      <Toaster />
    </div>
  )
}
