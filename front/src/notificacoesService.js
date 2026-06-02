import axios from "axios"

const BASE_URL =
  import.meta.env.VITE_NOTIFICACOES_SERVICE_URL ||
  (import.meta.env.DEV ? "http://localhost:3006" : "/api/notificacoes")

const api = axios.create({
  baseURL: BASE_URL,
})

export const listarNotificacoes = async () => {
  const response = await api.get("/notificacoes")
  return response.data
}

export const contarNotificacoesNaoLidas = async () => {
  const response = await api.get("/notificacoes/nao-lidas/contagem")
  return response.data
}

export const marcarNotificacaoComoLida = async (id) => {
  const response = await api.patch(`/notificacoes/${id}/ler`)
  return response.data
}

export const marcarTodasNotificacoesComoLidas = async () => {
  const response = await api.patch("/notificacoes/ler-todas")
  return response.data
}
