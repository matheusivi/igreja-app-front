import { api } from './api';

export type Conteudo = {
  id: number;
  tipo: 'Estudo' | 'Devocional' | 'Aviso' | 'Material' | 'Apresentacao';
  titulo: string;
  formato: 'texto' | 'imagem' | 'vídeo' | 'combinacao';
  texto: string | null;
  imagemUrl: string | null;
  videoUrl: string | null;
  principal: boolean;
  dataPublicacao: string;
  autor: { id: number; nomeCompleto: string; perfil: string };
};

type ListParams = {
  tipo?: Conteudo['tipo'];
  busca?: string;
  page?: number;
  limit?: number;
  orderBy?: 'recent' | 'oldest';
};

export function makeExcerpt(texto: string | null, maxLength = 140): string {
  if (!texto) return '';
  if (texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength).replace(/\s\S*$/, '') + '…';
}

export type CreateConteudoPayload = {
  tipo: Conteudo['tipo'];
  titulo: string;
  formato: Conteudo['formato'];
  texto?: string;
  imagemUrl?: string;
  videoUrl?: string;
  principal?: boolean;
  dataValidade?: string;
};

export const contentService = {
  async list(params: ListParams = {}): Promise<Conteudo[]> {
    const { data } = await api.get('/api/conteudos', { params });
    return (data.data ?? []) as Conteudo[];
  },

  async get(id: string | number): Promise<Conteudo> {
    const { data } = await api.get(`/api/conteudos/${id}`);
    return data.data as Conteudo;
  },

  async create(payload: CreateConteudoPayload): Promise<Conteudo> {
    const { data } = await api.post('/api/conteudos', payload);
    return data.data as Conteudo;
  },

  async update(id: number, payload: Partial<CreateConteudoPayload>): Promise<Conteudo> {
    const { data } = await api.put(`/api/conteudos/${id}`, payload);
    return data.data as Conteudo;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/conteudos/${id}`);
  },
};
