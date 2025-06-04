"use client"

import { useState } from "react"
import { testBackendConnection, userService, logService, monitoringService } from "@/lib/api"
import {
  mockUsers,
  mockLogs,
  mockMonitoringStatus,
  type User,
  type LogEntry,
  type MonitoringStatus,
} from "@/lib/mockData"

export const useApi = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Testar conexão com backend
  const checkConnection = async () => {
    const connected = await testBackendConnection()
    setIsConnected(connected)
    return connected
  }

  // Hook para gerenciar usuários
  const useUsers = () => {
    const [users, setUsers] = useState<User[]>([])

    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const connected = await checkConnection()

        if (connected) {
          const data = await userService.getAll()
          setUsers(data)
        } else {
          // Remover: setUsers(mockUsers)
          setUsers([])
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error)
        // Remover: setUsers(mockUsers)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    const addUser = async (userData: Omit<User, "id">) => {
      try {
        const connected = await checkConnection()

        if (connected) {
          await userService.create(userData)
          await loadUsers() // Recarregar lista
        } else {
          // Modo offline - adicionar localmente
          const newUser: User = {
            id: Date.now().toString(),
            ...userData,
          }
          setUsers((prev) => [...prev, newUser])
        }
        return true
      } catch (error) {
        console.error("Erro ao adicionar usuário:", error)
        return false
      }
    }

    const toggleUserStatus = async (userId: string) => {
      try {
        const connected = await checkConnection()

        if (connected) {
          await userService.toggleStatus(userId)
          await loadUsers() // Recarregar lista
        } else {
          // Modo offline - alterar localmente
          setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, active: !user.active } : user)))
        }
        return true
      } catch (error) {
        console.error("Erro ao alterar status:", error)
        return false
      }
    }

    const deleteUser = async (userId: string) => {
      try {
        const connected = await checkConnection()

        if (connected) {
          await userService.delete(userId)
          await loadUsers() // Recarregar lista
        } else {
          // Modo offline - remover localmente
          setUsers((prev) => prev.filter((user) => user.id !== userId))
        }
        return true
      } catch (error) {
        console.error("Erro ao deletar usuário:", error)
        return false
      }
    }

    const testConnection = async (userId: string, type: "imap" | "telegram") => {
      try {
        const connected = await checkConnection()

        if (connected) {
          if (type === "imap") {
            await userService.testConnection(userId)
          } else {
            await userService.testTelegram(userId)
          }
        }
        return true
      } catch (error) {
        console.error(`Erro ao testar ${type}:`, error)
        return false
      }
    }

    return {
      users,
      loadUsers,
      addUser,
      toggleUserStatus,
      deleteUser,
      testConnection,
    }
  }

  // Hook para gerenciar logs
  const useLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([])

    const loadLogs = async () => {
      try {
        const connected = await checkConnection()

        if (connected) {
          const data = await logService.getAll()
          setLogs(data)
        } else {
          // Remover: setLogs(mockLogs)
          setLogs([])
        }
      } catch (error) {
        console.error("Erro ao carregar logs:", error)
        // Remover: setLogs(mockLogs)
        setLogs([])
      }
    }

    return {
      logs,
      loadLogs,
    }
  }

  // Hook para gerenciar monitoramento
  const useMonitoring = () => {
    const [status, setStatus] = useState<MonitoringStatus>(mockMonitoringStatus)

    const loadStatus = async () => {
      try {
        const connected = await checkConnection()

        if (connected) {
          const data = await monitoringService.getStatus()
          setStatus(data)
        } else {
          // Remover: setStatus(mockMonitoringStatus)
          setStatus({ active: false, totalUsers: 0, activeUsers: 0, lastCheck: "" })
        }
      } catch (error) {
        console.error("Erro ao carregar status:", error)
        // Remover: setStatus(mockMonitoringStatus)
        setStatus({ active: false, totalUsers: 0, activeUsers: 0, lastCheck: "" })
      }
    }

    const toggleMonitoring = async () => {
      try {
        const connected = await checkConnection()

        if (connected) {
          await monitoringService.toggleStatus(!status.active)
          await loadStatus() // Recarregar status
        } else {
          // Modo offline - alterar localmente
          setStatus((prev) => ({ ...prev, active: !prev.active }))
        }
        return true
      } catch (error) {
        console.error("Erro ao alterar monitoramento:", error)
        return false
      }
    }

    return {
      status,
      loadStatus,
      toggleMonitoring,
    }
  }

  return {
    isConnected,
    isLoading,
    checkConnection,
    useUsers,
    useLogs,
    useMonitoring,
  }
}
