/**
 * Espelho da lista de profissões do servidor.
 *
 * ═══ POR QUE DUPLICADA ═══
 * O app precisa da lista para MONTAR o seletor, e o servidor precisa dela
 * para VALIDAR o que chega. Buscar por endpoint resolveria a duplicação, mas
 * ao custo de uma requisição antes de o formulário poder ser aberto — para um
 * dado que muda uma ou duas vezes por ano.
 *
 * O risco real da duplicação é o servidor aceitar uma chave que o app não
 * sabe escrever. `rotuloProfissao` cobre isso: chave desconhecida volta como
 * veio, em vez de sumir da tela.
 *
 * Ao acrescentar uma profissão, mexa nos DOIS arquivos —
 * `backend/src/domain/profissoes.ts` e este.
 */

export type Profissao = { chave: string; nome: string };

export type CategoriaProfissao = {
  chave: string;
  nome: string;
  profissoes: Profissao[];
};

export const CATEGORIAS_PROFISSAO: CategoriaProfissao[] = [
  {
    chave: 'construcao',
    nome: 'Construção e reformas',
    profissoes: [
      { chave: 'pedreiro', nome: 'Pedreiro' },
      { chave: 'pintor', nome: 'Pintor' },
      { chave: 'eletricista', nome: 'Eletricista' },
      { chave: 'encanador', nome: 'Encanador' },
      { chave: 'marceneiro', nome: 'Marceneiro' },
      { chave: 'serralheiro', nome: 'Serralheiro' },
      { chave: 'gesseiro', nome: 'Gesseiro' },
      { chave: 'vidraceiro', nome: 'Vidraceiro' },
      { chave: 'arquiteto', nome: 'Arquiteto' },
      { chave: 'engenheiro', nome: 'Engenheiro' },
    ],
  },
  {
    chave: 'casa',
    nome: 'Casa e cuidados',
    profissoes: [
      { chave: 'diarista', nome: 'Diarista' },
      { chave: 'jardineiro', nome: 'Jardineiro' },
      { chave: 'costureira', nome: 'Costureira' },
      { chave: 'cuidador', nome: 'Cuidador de idosos' },
      { chave: 'baba', nome: 'Babá' },
      { chave: 'piscineiro', nome: 'Piscineiro' },
    ],
  },
  {
    chave: 'alimentacao',
    nome: 'Alimentação',
    profissoes: [
      { chave: 'cozinheiro', nome: 'Cozinheiro' },
      { chave: 'confeiteiro', nome: 'Confeiteiro' },
      { chave: 'salgadeiro', nome: 'Salgadeiro' },
      { chave: 'padeiro', nome: 'Padeiro' },
      { chave: 'acougueiro', nome: 'Açougueiro' },
    ],
  },
  {
    chave: 'beleza',
    nome: 'Beleza e bem-estar',
    profissoes: [
      { chave: 'cabeleireiro', nome: 'Cabeleireiro' },
      { chave: 'barbeiro', nome: 'Barbeiro' },
      { chave: 'manicure', nome: 'Manicure' },
      { chave: 'esteticista', nome: 'Esteticista' },
      { chave: 'maquiador', nome: 'Maquiador' },
      { chave: 'massagista', nome: 'Massagista' },
      { chave: 'personal', nome: 'Personal trainer' },
    ],
  },
  {
    chave: 'saude',
    nome: 'Saúde',
    profissoes: [
      { chave: 'medico', nome: 'Médico' },
      { chave: 'enfermeiro', nome: 'Enfermeiro' },
      { chave: 'dentista', nome: 'Dentista' },
      { chave: 'fisioterapeuta', nome: 'Fisioterapeuta' },
      { chave: 'psicologo', nome: 'Psicólogo' },
      { chave: 'nutricionista', nome: 'Nutricionista' },
      { chave: 'farmaceutico', nome: 'Farmacêutico' },
      { chave: 'veterinario', nome: 'Veterinário' },
    ],
  },
  {
    chave: 'educacao',
    nome: 'Educação',
    profissoes: [
      { chave: 'professor', nome: 'Professor' },
      { chave: 'pedagogo', nome: 'Pedagogo' },
      { chave: 'professor_particular', nome: 'Professor particular' },
      { chave: 'professor_musica', nome: 'Professor de música' },
      { chave: 'tradutor', nome: 'Tradutor' },
    ],
  },
  {
    chave: 'transporte',
    nome: 'Transporte e veículos',
    profissoes: [
      { chave: 'motorista', nome: 'Motorista' },
      { chave: 'mototaxista', nome: 'Mototaxista' },
      { chave: 'fretes', nome: 'Fretes e mudanças' },
      { chave: 'mecanico', nome: 'Mecânico' },
      { chave: 'funileiro', nome: 'Funileiro' },
      { chave: 'borracheiro', nome: 'Borracheiro' },
      { chave: 'lavagem_veiculos', nome: 'Lavagem de veículos' },
    ],
  },
  {
    chave: 'tecnologia',
    nome: 'Tecnologia e comunicação',
    profissoes: [
      { chave: 'desenvolvedor', nome: 'Desenvolvedor' },
      { chave: 'tecnico_informatica', nome: 'Técnico de informática' },
      { chave: 'designer', nome: 'Designer' },
      { chave: 'social_media', nome: 'Social media' },
      { chave: 'fotografo', nome: 'Fotógrafo' },
      { chave: 'videomaker', nome: 'Videomaker' },
      { chave: 'tecnico_som', nome: 'Técnico de som' },
    ],
  },
  {
    chave: 'negocios',
    nome: 'Negócios e serviços',
    profissoes: [
      { chave: 'contador', nome: 'Contador' },
      { chave: 'advogado', nome: 'Advogado' },
      { chave: 'corretor_imoveis', nome: 'Corretor de imóveis' },
      { chave: 'corretor_seguros', nome: 'Corretor de seguros' },
      { chave: 'vendedor', nome: 'Vendedor' },
      { chave: 'administrador', nome: 'Administrador' },
      { chave: 'seguranca', nome: 'Segurança' },
      { chave: 'artesao', nome: 'Artesão' },
      { chave: 'musico', nome: 'Músico' },
      { chave: 'eletronica', nome: 'Consertos em geral' },
    ],
  },
  {
    chave: 'outros',
    nome: 'Outros',
    profissoes: [{ chave: 'outro', nome: 'Outro' }],
  },
];

const POR_CHAVE = new Map(
  CATEGORIAS_PROFISSAO.flatMap((c) => c.profissoes).map((p) => [p.chave, p.nome]),
);

/**
 * O nome legível de uma chave.
 *
 * Chave desconhecida volta como veio. Isso cobre dois casos reais: um
 * servidor mais novo que já conhece uma profissão que este app ainda não, e
 * texto antigo que a migração não converteu. Nos dois, mostrar algo é melhor
 * que a linha aparecer vazia sem explicação.
 */
export function rotuloProfissao(chave: string | null | undefined): string | null {
  if (!chave) return null;
  return POR_CHAVE.get(chave) ?? chave;
}

/** A categoria a que uma profissão pertence — usada para agrupar o seletor. */
export function categoriaDaProfissao(chave: string | null | undefined) {
  if (!chave) return null;
  return (
    CATEGORIAS_PROFISSAO.find((c) => c.profissoes.some((p) => p.chave === chave)) ?? null
  );
}
