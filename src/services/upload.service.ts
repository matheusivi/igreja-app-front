import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { api } from './api';

export type PastaUpload = 'perfis' | 'eventos' | 'conteudos' | 'familias';

export type ImagemEnviada = {
  url: string;
  publicId: string;
};

/**
 * Largura máxima depois da compressão.
 *
 * Uma foto de celular moderno sai com ~4000px e 4 MB. Nenhuma tela do app
 * mostra imagem maior que a largura do aparelho, então guardar o original só
 * queima cota do Cloudinary e deixa o upload lento no 4G da igreja.
 * 1080px cobre até capa de evento em tela cheia com folga.
 */
const LARGURA_MAXIMA = 1080;

/** Avatares são exibidos em no máximo 96px — 400px já é retina de sobra. */
const LARGURA_MAXIMA_PERFIL = 400;

function larguraAlvo(pasta: PastaUpload): number {
  return pasta === 'perfis' ? LARGURA_MAXIMA_PERFIL : LARGURA_MAXIMA;
}

/**
 * Distinguir "cancelou" de "sem permissão" é o que permite reagir certo a cada
 * caso: cancelar é normal e não merece aviso; permissão negada precisa de uma
 * mensagem com caminho de saída, senão o botão simplesmente não faz nada.
 */
export type ResultadoSelecao =
  | { status: 'ok'; uri: string }
  | { status: 'cancelado' }
  | { status: 'sem-permissao'; origem: 'camera' | 'galeria' };

function daPrimeiraFoto(
  resultado: ImagePicker.ImagePickerResult,
): ResultadoSelecao {
  const asset = resultado.canceled ? undefined : resultado.assets?.[0];
  return asset ? { status: 'ok', uri: asset.uri } : { status: 'cancelado' };
}

/**
 * Abre a galeria.
 *
 * A permissão é pedida mas NÃO bloqueia o fluxo: no iOS o seletor roda fora do
 * app (PHPicker) e a pessoa escolhe a foto sem o app nunca ganhar acesso à
 * biblioteca. O Android moderno funciona igual. Pedir antes serve só para o
 * sistema não interromper o fluxo depois da escolha.
 */
export async function escolherDaGaleria(
  quadrado = false,
): Promise<ResultadoSelecao> {
  await ImagePicker.requestMediaLibraryPermissionsAsync();

  try {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: quadrado ? [1, 1] : [16, 9],
      quality: 1,
    });
    return daPrimeiraFoto(resultado);
  } catch {
    // Android antigo ainda exige a permissão de leitura para abrir a galeria.
    return { status: 'sem-permissao', origem: 'galeria' };
  }
}

/**
 * Abre a câmera. Aqui a permissão é obrigatória de verdade — sem ela o sistema
 * não deixa nem abrir.
 */
export async function tirarFoto(quadrado = false): Promise<ResultadoSelecao> {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissao.granted) return { status: 'sem-permissao', origem: 'camera' };

  const resultado = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: quadrado ? [1, 1] : [16, 9],
    quality: 1,
  });

  return daPrimeiraFoto(resultado);
}

/**
 * Redimensiona e comprime antes de subir.
 *
 * Feito no aparelho de propósito: economiza banda do usuário, deixa o upload
 * bem mais rápido e evita que o servidor tenha que lidar com arquivo grande.
 */
async function comprimir(uri: string, largura: number): Promise<string> {
  const contexto = ImageManipulator.manipulate(uri);
  contexto.resize({ width: largura });

  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({
    compress: 0.75,
    format: SaveFormat.JPEG,
  });

  return salva.uri;
}

/**
 * Comprime e envia a imagem para o backend, que repassa ao Cloudinary.
 */
export async function enviarImagem(
  uri: string,
  pasta: PastaUpload,
): Promise<ImagemEnviada> {
  const uriComprimida = await comprimir(uri, larguraAlvo(pasta));

  const form = new FormData();
  form.append('imagem', {
    uri: uriComprimida,
    name: `${pasta}-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('pasta', pasta);

  const { data } = await api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Upload em rede lenta passa fácil dos 10s padrão do cliente.
    timeout: 60000,
  });

  return data.data as ImagemEnviada;
}
