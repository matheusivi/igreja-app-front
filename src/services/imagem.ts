import { PixelRatio } from 'react-native';

/**
 * Monta a URL do Cloudinary pedindo exatamente o tamanho que a tela vai usar.
 *
 * ═══ O PROBLEMA QUE ISTO RESOLVE ═══
 * Guardamos a foto em 1080px para o card de aniversário ficar nítido. Mas o
 * avatar da lista tem 44pt: baixar 1080px para desenhar 132 é jogar fora
 * banda da congregação — e no 4G do pátio da igreja isso se sente.
 *
 * O Cloudinary redimensiona na entrega, então dá para guardar UMA vez em alta
 * e servir CADA lugar no tamanho certo. É por isso que o teto do upload subiu
 * sem que o custo de tráfego subisse junto.
 *
 * ═══ POR QUE MULTIPLICAR PELA DENSIDADE ═══
 * O `<Image>` do React Native não negocia resolução como o `srcset` da web:
 * ele baixa o que a URL manda. Um card de 353 PONTOS num iPhone ocupa 1059
 * PIXELS reais — pedir 353 devolveria uma imagem ampliada 3x, que é o mesmo
 * borrão de antes por outro caminho.
 *
 * ═══ AS TRANSFORMAÇÕES ═══
 *   `w_` / `h_`  tamanho pedido, já em pixel físico
 *   `c_fill`     preenche o quadro cortando o excedente (mesmo efeito do
 *                `resizeMode="cover"`, só que feito no servidor)
 *   `g_auto`     escolhe O QUE manter no corte. Numa foto quadrada entrando
 *                num quadro 3:2, é a diferença entre cortar o rosto e centrar
 *                nele. Vale mais que qualquer ajuste que eu faria na tela.
 *   `q_auto`     qualidade decidida por análise do conteúdo, em vez de um
 *                número fixo que ora desperdiça, ora estraga
 *   `f_auto`     entrega WebP/AVIF quando o aparelho aceita — mesma imagem,
 *                bem menos bytes
 *
 * ═══ SEGURANÇA ═══
 * URL que não é do Cloudinary volta intacta. Assim a função pode ser aplicada
 * em qualquer lugar sem antes perguntar de onde veio a imagem.
 */

type Opcoes = {
  /** Largura do quadro em PONTOS (o mesmo número que vai no `style`). */
  largura: number;
  /** Altura em pontos. Sem ela, o Cloudinary mantém a proporção original. */
  altura?: number;
};

const MARCA_CLOUDINARY = '/image/upload/';

export function urlImagem(url: string | null | undefined, opcoes: Opcoes): string | undefined {
  if (!url) return undefined;

  const posicao = url.indexOf(MARCA_CLOUDINARY);
  if (posicao === -1) return url;

  // Teto de 3: acima disso o ganho é invisível e o arquivo dobra de tamanho.
  const densidade = Math.min(PixelRatio.get(), 3);
  const largura = Math.round(opcoes.largura * densidade);
  const altura = opcoes.altura ? Math.round(opcoes.altura * densidade) : null;

  const partes = [
    `w_${largura}`,
    altura ? `h_${altura}` : null,
    'c_fill',
    'g_auto',
    'q_auto',
    'f_auto',
  ].filter(Boolean);

  const inicio = url.slice(0, posicao + MARCA_CLOUDINARY.length);
  const fim = url.slice(posicao + MARCA_CLOUDINARY.length);
  return `${inicio}${partes.join(',')}/${fim}`;
}
