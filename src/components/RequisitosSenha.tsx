import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * As regras da senha, marcadas em tempo real enquanto a pessoa digita.
 *
 * ═══ POR QUE A LISTA APARECE ANTES DO ERRO ═══
 * O cadastro validava as três regras em silêncio: o botão simplesmente ficava
 * desabilitado, sem dizer por quê. Quem testou o app travou aí — digitou uma
 * senha, o botão não acendeu, e não havia nada na tela explicando o que
 * faltava.
 *
 * Mostrar a lista DESDE o começo, com os itens acendendo conforme são
 * cumpridos, troca "adivinhe o que eu quero" por "faltam duas". É a diferença
 * entre uma regra e uma instrução.
 *
 * ═══ POR QUE É UM COMPONENTE, E NÃO CÓPIA EM CADA TELA ═══
 * Cadastro e redefinição de senha exigem exatamente as mesmas regras. Mantê-
 * las em dois lugares é como elas divergem — e divergir aqui significa uma
 * tela aceitar uma senha que a outra recusa.
 */

/** O piso de caracteres. O servidor exige o mesmo — ver `auth.validation.ts`. */
export const MINIMO_CARACTERES = 8;

export type ForcaSenha = {
  tamanho: boolean;
  maiuscula: boolean;
  numero: boolean;
};

/**
 * Avalia a senha contra as três regras.
 *
 * Exportada junto com o componente de propósito: a tela precisa dos mesmos
 * valores para decidir se habilita o botão, e recalculá-los à mão lá seria a
 * porta para a lista dizer uma coisa e o botão fazer outra.
 */
export function avaliarSenha(senha: string): ForcaSenha {
  return {
    tamanho: senha.length >= MINIMO_CARACTERES,
    maiuscula: /[A-Z]/.test(senha),
    numero: /[0-9]/.test(senha),
  };
}

/** `true` quando as três regras passam. */
export function senhaValida(forca: ForcaSenha): boolean {
  return forca.tamanho && forca.maiuscula && forca.numero;
}

export function RequisitosSenha({ senha }: { senha: string }) {
  const forca = avaliarSenha(senha);

  return (
    <View className="gap-1">
      <ItemRequisito ok={forca.tamanho} rotulo={`Mínimo de ${MINIMO_CARACTERES} caracteres`} />
      <ItemRequisito ok={forca.maiuscula} rotulo="Pelo menos uma letra maiúscula" />
      <ItemRequisito ok={forca.numero} rotulo="Pelo menos um número" />
    </View>
  );
}

/**
 * Uma linha de requisito, com o ponto que vira visto quando cumprida.
 *
 * Exportado porque a tela de redefinir senha precisa acrescentar uma regra
 * própria — "as senhas devem ser iguais" — logo abaixo das três daqui. Sem
 * isto, aquela linha ficaria com marcador e cor diferentes das vizinhas, e a
 * lista pareceria dois grupos sem relação.
 */
export function ItemRequisito({ ok, rotulo }: { ok: boolean; rotulo: string }) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-center gap-2"
      // Um leitor de tela anuncia "concluído"/"pendente" em vez de descrever o
      // ícone. Sem isto, a lista inteira vira três círculos sem significado.
      accessibilityRole="text"
      accessibilityLabel={`${rotulo}: ${ok ? 'cumprido' : 'pendente'}`}
    >
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={ok ? colors.success : colors.outline}
      />
      <Text
        className="font-sans text-sm"
        style={{ color: ok ? colors.success : colors.inkMuted }}
      >
        {rotulo}
      </Text>
    </View>
  );
}
