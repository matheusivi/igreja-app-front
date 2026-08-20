# Publicar e atualizar o app

Este arquivo existe porque `eas.json` e `app.json` são JSON e não aceitam
comentário. É o roteiro de tudo que envolve build e atualização.

---

## Identidade do app

| Campo | Valor | Pode mudar depois? |
|---|---|---|
| `android.package` / `ios.bundleIdentifier` | `br.com.ibvi.app` | **Não.** Depois de publicado é permanente. Mudar = app novo, instalado do zero, sem os usuários antigos. |
| `name` | `IBVI Church` | Sim, a qualquer momento. É o que aparece embaixo do ícone — o Android mostra cerca de 11 caracteres e corta o resto, então na tela inicial deve sair como `IBVI Chur…`. Se incomodar, encurte para `IBVI`. |
| `slug` | `ibvi-church` | Antes do primeiro `eas init`, sim. Depois amarra o projeto na conta EAS. |
| `version` | `1.0.0` | Sim, e é você quem controla. Ver "runtimeVersion" abaixo. |

O título completo da loja ("Igreja Batista... IBVI Nova Andradina") é escrito no
Google Play Console, não aqui. São coisas separadas.

---

## Os dois canais

| Canal | Perfil de build | Formato | Para quem |
|---|---|---|---|
| `teste` | `development`, `teste` | APK | Você e quem você mandar o link. Instala fora da loja. |
| `producao` | `producao` | AAB | A congregação, via Play Store. |

Um build carrega o canal gravado dentro dele. Um APK do perfil `teste` só recebe
atualização publicada em `teste` — nunca vai puxar o que está em `producao`, e
vice-versa. É essa separação que deixa você testar sem risco.

---

## Primeira vez (uma vez só)

```bash
npm install -g eas-cli
eas login
eas init            # cria o projeto na conta EAS e grava o projectId no app.json
eas update:configure # grava updates.url no app.json
```

Depois disso o `app.json` ganha `extra.eas.projectId` e `updates.url`.
**Não apague esses dois** — sem eles o app não sabe onde procurar atualização.

---

## Gerar o APK de teste

```bash
eas build --platform android --profile teste
```

Sai um link. Abre no celular Android, instala. Serve em qualquer aparelho —
o seu, o de quem estiver na igreja, não precisa estar na mesma rede.

## Gerar o AAB da loja

```bash
eas build --platform android --profile producao
```

O `versionCode` (o número interno que a Play Store exige que sempre suba) é
incrementado sozinho pelo EAS, por causa de `autoIncrement: true` e
`appVersionSource: "remote"`. Você não precisa mexer nele nunca.

---

## Atualizar sem passar pela loja (OTA)

```bash
eas update --channel teste     --message "descrição do que mudou"
eas update --channel producao  --message "descrição do que mudou"
```

Sempre nesta ordem: publica em `teste`, confere no seu Android, só então
`producao`.

O app baixa a atualização em segundo plano na abertura e aplica **na abertura
seguinte**. Isso é de propósito (`fallbackToCacheTimeout: 0`): ninguém fica
olhando tela branca no 4G da igreja esperando download.

### Se der ruim

```bash
eas update:rollback --channel producao
```

Republica a versão anterior. Vale ter isso à mão *antes* de precisar.

---

## O que OTA NÃO consegue atualizar

Isto é a única armadilha real do método. OTA troca o JavaScript. Não troca o
código nativo.

Precisa de **build novo e envio para a loja** quando você:

- instala ou remove qualquer pacote com parte nativa (`expo-*`, `react-native-*`)
- muda a versão do Expo SDK
- muda ícone, splash, permissões, nome do pacote
- muda qualquer coisa em `plugins` do `app.json`

Resolve OTA quando você:

- muda texto, cor, layout, lógica de tela
- **acrescenta o plano de leitura do ano seguinte**
- acrescenta versículos do dia
- corrige um bug de JavaScript

### Como o app se protege disso

`runtimeVersion` está na política `appVersion`, ou seja, vale o `version` do
`app.json` (`1.0.0`). Uma atualização OTA só é entregue a builds com o **mesmo**
runtimeVersion.

A regra prática, e ela é a que evita o app quebrar na mão das pessoas:

> Mexeu em nativo → **suba o `version`** no `app.json` (1.0.0 → 1.1.0) e gere
> build novo.
> Mexeu só em JS → **não mexa no `version`** e publique com `eas update`.

Subir o `version` ao mudar nativo é o que impede um bundle novo de cair num app
antigo que não tem o código nativo correspondente — que é a forma clássica de
derrubar um app em produção.

---

## Publicar em fases (recomendado para a congregação)

Na Play Store, e também no `eas update`, dá para liberar para uma fatia dos
aparelhos primeiro. Se algo passar batido no teste, atinge poucos.

```
5%  →  espera um dia  →  25%  →  espera um dia  →  100%
```
