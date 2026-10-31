# Arquitetura

Visão das decisões técnicas, dos contratos e das limitações da solução. Setup, cenários e comandos estão no
[README](README.md).

## Visão geral

```
src/
  app/          bootstrap do React, router, QueryClient e o shell (header, rodapé, barra inferior)
  routes/       rotas file-based (TanStack Router); só composição e guards
  features/     uma pasta por domínio: api.ts, queries.ts, hooks e componentes
                (auth, catalog, cart, checkout, account, favorites, realtime, home, newsletter)
  components/   UI compartilhada (layout, campos, imagem, estados) e shadcn/ui em components/ui
  contracts/    schemas Zod compartilhados entre cliente e mocks (fonte única dos tipos)
  i18n/         locale, mensagens de validação e de erro em pt-BR
  lib/          utilitários sem React (http, eth, nft, redes, carteiras)
  mocks/        backend simulado: handlers MSW, domínio, banco em localStorage, Socket.IO
e2e/            Playwright: specs, helpers e baselines visuais
```

- **Contratos primeiro.** Cada resposta REST é validada com Zod em `request()` (`lib/http.ts`), e cada evento
  Socket.IO é validado ao chegar. Os handlers MSW usam os mesmos schemas para validar entradas, então cliente e
  "backend" não divergem.
- **Mocks sem atalhos no app.** Componentes, hooks e o cliente Axios não conhecem os mocks: falam HTTP e
  Socket.IO. O domínio dos mocks (`mocks/domain`) é puro e testado; os handlers só traduzem HTTP.
- **Rotas finas.** Rotas fazem composição, `head`, guards e prefetch; a lógica vive nas features.
- **Dependências numa direção só:** `app` e `routes` usam `features`, que usam `components`, `lib` e
  `contracts`. A UI compartilhada não conhece nenhuma feature.

## Contratos REST

Base `VITE_API_URL` (`/api`). Erros seguem `{ code, message, fieldErrors? }`: o `code` é estável e a UI o
traduz (`i18n/api-errors.ts`); `message` é só para logs; `fieldErrors` traz **chaves** de validação
(`password.tooShort`), traduzidas em `i18n/field-errors.ts`.

| Método e rota                                                                                               | Descrição                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /auth/session`                                                                                         | Sessão atual ou `null` para visitante.                                                                                                          |
| `POST /auth/login` · `POST /auth/register` · `POST /auth/logout`                                            | Sessão por cookie.                                                                                                                              |
| `GET /nfts`                                                                                                 | Catálogo paginado: `q`, `view` (`all`/`new`/`trending`), `categories[]`, `networks[]`, `minPrice`, `maxPrice`, `onlyAvailable`, `sort`, `page`. |
| `GET /nfts/facets`                                                                                          | Contagens por coleção e rede e faixa de preço, para a sidebar.                                                                                  |
| `GET /nfts/featured` · `GET /nfts/:id` · `GET /nfts/:id/reviews`                                            | Destaques, detalhe e avaliações.                                                                                                                |
| `GET /favorites` · `PUT/DELETE /favorites/:nftId`                                                           | Favoritos do usuário.                                                                                                                           |
| `GET /cart` · `POST /cart/items` · `PATCH/DELETE /cart/items/:nftId/:editionId` · `PUT/DELETE /cart/coupon` | Carrinho; toda resposta devolve o carrinho inteiro.                                                                                             |
| `GET/PUT/DELETE /wallet-connection`                                                                         | Conexão simulada de carteira e rede.                                                                                                            |
| `POST /quotes`                                                                                              | Cotação: snapshot de preços que trava o pedido.                                                                                                 |
| `POST /orders` (header `Idempotency-Key`) · `GET /orders` · `GET /orders/:id`                               | Pedidos.                                                                                                                                        |
| `GET/PATCH /profile` · `PUT /profile/avatar` · `PUT /profile/password`                                      | Perfil.                                                                                                                                         |
| `GET /wallets` · `PUT /wallets/:role`                                                                       | Carteiras principal e secundária.                                                                                                               |
| `POST /newsletter`                                                                                          | Inscrição (validada, não persistida).                                                                                                           |

Valores em ETH trafegam como **strings decimais** e são calculados com `bigint` em wei (`lib/eth.ts`), sem
erro de ponto flutuante. A exibição segue o locale pt-BR ("1,19 ETH").

## Eventos (Socket.IO)

Caminho `/realtime`, transporte WebSocket. Todo evento tem identidade, recurso e versão:

```ts
{ eventId, type, resource: { type, id }, version, occurredAt, data }
```

| Evento          | Destinatário        | Efeito no cliente                                                                                                                                         |
| --------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`   | todos               | Atualiza preço e estoque no catálogo, detalhe e destaques; se o NFT está no carrinho, recarrega o carrinho e avisa ("mudou de preço ou disponibilidade"). |
| `order.updated` | só o dono do pedido | Atualiza o pedido (confirmado ou recusado); confirmado recarrega o carrinho.                                                                              |

## Sessão

- Cookie `session` (`SameSite=Lax`, expira com a sessão; padrão de 2 h, 60 s no cenário `short-session`).
  Em um backend real ele seria `HttpOnly`; no mock o WebSocket é interceptado na página e lê `document.cookie`
  para autenticar o socket.
- A sessão é resolvida no **loader** da rota raiz, em paralelo com os dados da rota; os guards
  (`_authenticated`, login, cadastro) aguardam a mesma query em cache.
- Login e cadastro são um modal sobre a página atual, como no Figma, controlado pelo parâmetro global
  `?auth=login|register` (validado na rota raiz e carregado sob demanda). Fechar remove o parâmetro sem trocar de
  página nem de rolagem; o catálogo ignora esses parâmetros na chave da query. Guards levam a
  `/?auth=login&redirect=…`, e `/login` e `/register` continuam como links diretos que abrem o modal.
- Um 401 de qualquer requisição (`onUnauthorized` no cliente HTTP) limpa os dados privados e leva ao login com
  `redirect` e `reason=expired`; depois do login o usuário volta à página onde estava. O rascunho do checkout
  fica no `sessionStorage` e sobrevive a esse ciclo.
- Sessões expiradas não são apagadas no servidor simulado: respondem `SESSION_EXPIRED`, o que deixa o fluxo
  determinístico nos testes.

## Carrinho

- O servidor é a fonte da verdade. Visitantes recebem um carrinho ligado ao cookie `cart_id`; no login ele é
  **mesclado** ao carrinho do usuário (quantidades somadas até o estoque e o limite por pedido; o cupom do visitante vale se o usuário não tiver um).
- Cada linha traz preço, estoque e limite atuais; a UI bloqueia o checkout quando uma linha excede o estoque.
- Toda mutação devolve o carrinho inteiro, que substitui o cache (sem merge parcial no cliente).

## Estratégia de cache (TanStack Query)

| Dado                                                       | Chave                                       | Política                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Sessão                                                     | `['session']`                               | `staleTime: Infinity`; substituída explicitamente em login/logout.                                                                  |
| Catálogo, destaques, facetas, detalhe, avaliações          | `['nfts', ...]`                             | `staleTime` 30 s; listas com `keepPreviousData` e uma chave por filtro, então respostas atrasadas nunca sobrescrevem a busca atual. |
| Privados (carrinho, favoritos, perfil, carteiras, pedidos) | `['user', userId, ...]` ou `['guest', ...]` | Removidos por inteiro a cada troca de sessão: nenhum dado de um usuário aparece para outro.                                         |
| Cotação                                                    | `['user', userId, 'quote', network]`        | `staleTime: Infinity`, sem refetch por foco: só muda por troca de rede ou "Atualizar total".                                        |

- **Retry:** só falhas transitórias (rede, timeout, 5xx), até 2 vezes. 4xx não é repetido. Mutações não têm retry,
  exceto a criação de pedido, que é segura graças à chave de idempotência.
- **Otimismo:** apenas em favoritos, com rollback e aviso se o servidor falhar.
- **URL como estado:** filtros, ordenação, aba e página vivem na URL (validados por Zod com fallback), então
  histórico, compartilhamento e refresh funcionam.

## Checkout e pedidos

- O checkout cria uma **cotação** ao abrir e a exibe como total. Se o carrinho mudar (evento em tempo real,
  cupom), a cotação fica desatualizada: a confirmação é bloqueada até "Atualizar total".
- "Confirmar compra" conecta a carteira (se necessário) e envia o pedido com `Idempotency-Key` única por
  cotação. Repetir a mesma chave devolve o mesmo pedido; mesma chave com outro corpo responde
  `IDEMPOTENCY_CONFLICT`.
- A conexão da carteira é simulada no servidor: pode ser recusada (cenário `wallet-rejected`) ou cair a
  qualquer momento (`__mocks.disconnectWallets()`). Um pedido com a carteira desconectada responde
  `WALLET_DISCONNECTED`; o cliente esquece a conexão em cache e a próxima confirmação conecta de novo.
- O servidor revalida a cotação contra preços e estoque atuais (`QUOTE_OUTDATED`), reserva o estoque e cria o
  pedido como `pending`. A liquidação ocorre após alguns segundos (agendada e também verificada a cada leitura,
  o que a torna resistente a refresh): `confirmed` remove do carrinho só o que foi comprado; `declined` devolve
  o estoque e mantém o carrinho. Estados confirmados e recusados são terminais.
- Enquanto houver pedido pendente, o checkout mostra o acompanhamento em vez de permitir outra compra.

## Reconciliação REST ↔ Socket.IO

1. **Filtro de eventos** (`realtime/event-gate.ts`): descarta `eventId` repetidos e eventos com versão menor ou
   igual à última vista do recurso. Duplicados não reaplicam efeitos (nem avisos).
2. **Comparação com o cache** (`realtime/cache-sync.ts`): o dado em cache pode já ser mais novo que o evento
   (veio de um refetch), então a versão é comparada de novo antes de aplicar.
3. **Reconexão:** ao reconectar, todas as queries ativas são invalidadas e recarregadas via REST. Eventos
   perdidos durante a queda são recuperados assim.
4. **Isolamento por sessão:** um socket por sessão; trocar de usuário fecha o socket e abre outro com o novo
   cookie. No servidor simulado, a sessão é revalidada a cada entrega, então logout ou expiração silenciam
   eventos privados mesmo com o socket aberto.
5. **Ciclo de vida:** listeners são removidos e o socket desconectado quando o efeito é desmontado.

## Transporte e limitações dos mocks

- **Caminho `/realtime`:** o handler WebSocket do MSW remove `/socket.io/` da URL antes do match; capturar a
  raiz também capturaria o socket de HMR do Vite.
- **Bootstrap em duas fases:** `main.tsx` inicia o MSW e só então importa o app, porque o `engine.io-client`
  captura `globalThis.WebSocket` ao ser avaliado. A camada de tempo real é ainda carregada sob demanda após o
  primeiro render.
- **Heartbeat manual:** o `@mswjs/socket.io-binding` anuncia `pingInterval` de 25 s mas não envia pings; o mock
  envia o ping do Engine.IO, senão o cliente cai em ~30 s.
- **Recusa de conexão:** o mock dispara `error` antes de `close`; com só `close`, o Socket.IO esperaria o timeout
  de 20 s para tentar reconectar.
- **Só WebSocket:** o MSW não intercepta long-polling como Socket.IO.
- **Fechamento síncrono:** ao derrubar o socket, o mock remove a conexão antes de fechar (o fechamento é
  assíncrono) para não entregar eventos a um socket fechando.
- **Primeira conexão:** eventos publicados antes do primeiro connect não são reprocessados (só reconexões
  disparam a reconciliação). A janela é de milissegundos; os testes aguardam o socket via
  `__mocks.sockets.connectionCount()`.
- **Persistência:** o banco simulado vive no `localStorage` (versão de schema; dados antigos são descartados).
  Cada aba tem seu próprio service worker controlando a mesma origem.
- **Worker reiniciado:** em aba de fundo o navegador espaça o keepalive do MSW e encerra o service worker ocioso;
  ao reiniciar, ele esquece quais abas ativaram os mocks e deixa as requisições irem para a rede. Ao voltar para
  a aba, `src/mocks/browser.ts` reenvia `MOCK_ACTIVATE` e só então libera o refetch on focus do TanStack Query
  (via `focusManager`).

## Internacionalização

UI em pt-BR, sem biblioteca: só um idioma justifica não carregar uma lib (bundle e performance), mantendo o
caminho aberto:

- `lang="pt-BR"` no documento, `Intl` para números, datas e plurais (zero no plural, como no uso brasileiro).
- Contratos trafegam **chaves** de validação e **códigos** de erro; a tradução acontece num único ponto da UI.
  Um segundo idioma seria um novo dicionário e a troca do `LOCALE`.
- O separador decimal vem do locale; voltar ao ponto ("1.19 ETH") é uma troca de configuração.

## Acessibilidade

- Skip link, foco visível (cor de destaque com contraste 8,5:1), `h1` por página e landmarks nomeados.
- Diálogos e drawers do Radix (foco preso e devolvido ao fechar), menu operável por teclado, abas com setas.
- Campos com rótulo, dica e erro associados (`aria-describedby`, `aria-invalid`); foco no primeiro campo
  inválido. Telas com placeholder no Figma mantêm rótulos acessíveis.
- Mudanças em tempo real e resultados de mutações são anunciados (toasts, `role="status"`/`alert`).
- O vermelho de erro do Figma (`#ed1b2e`) tem 4,0–4,4:1 sobre os fundos escuros: texto de erro usa o Coral do
  próprio Figma (`#f0805f`, 7,3:1) e o vermelho fica para ícones.
- Skeletons e spinners respeitam `prefers-reduced-motion`; o carrossel não tem autoplay.
- Sem overflow horizontal de 320 a 1440 px (testado); painéis fixos no mobile são baixos para não esconder conteúdo
  com zoom, e os toasts ficam no topo para não cobrir ações.

## Testes

- **Playwright** (desktop 1440 e mobile 390, Chromium), contra o build de produção. Cada teste reinicia um
  cenário; latência, falhas, tempo de liquidação e eventos são controlados pelos cenários e por
  `window.__mocks`. Relatório HTML e traces das falhas (`retain-on-failure`).
- **Regressão visual:** home, detalhe, carrinho e pagamento, nos dois viewports, com dados determinísticos,
  fontes e imagens carregadas e animações desligadas. As baselines são do Chromium em Linux (`*-linux.png`);
  em outro sistema, regenere com `--update-snapshots`.
- **Relógio controlado:** os mocks rodam na página, então `page.clock` controla liquidação de pagamentos e
  expiração de sessão. Os testes avançam o tempo em vez de esperar (pagamento lento de 20 s, sessão de 60 s).
- **Timeout do pedido:** usa o timeout nativo de 10 s do XHR, que o relógio falso do Playwright não controla;
  esse teste realmente espera (`test.slow()`).
- **Responsividade:** todas as telas são verificadas sem overflow horizontal em 320 (zoom de 400%), 768, 1024
  e 1152 px (1440 com zoom de 125%).
- **Unitários (Vitest):** domínio dos mocks, contratos, ETH, i18n e frescor da cotação.

## Performance

Medianas de 3 execuções por página e perfil ([SUMMARY](lighthouse-reports/SUMMARY.md)):

| Perfil  | Página  | Performance | Accessibility | Best Practices | SEO | LCP    | TBT    | CLS |
| ------- | ------- | ----------- | ------------- | -------------- | --- | ------ | ------ | --- |
| Desktop | Início  | 98          | 100           | 100            | 100 | 1,10 s | 0 ms   | 0   |
| Desktop | Detalhe | 98          | 100           | 100            | 100 | 1,07 s | 0 ms   | 0   |
| Mobile  | Início  | 84          | 100           | 100            | 100 | 3,95 s | 119 ms | 0   |
| Mobile  | Detalhe | 83          | 100           | 100            | 100 | 3,89 s | 177 ms | 0   |

Desktop atinge todas as metas. No mobile, só Performance fica abaixo de 90, e a causa é a camada de mocks no
caminho crítico, que um backend real não teria:

- o chunk do MSW e dos mocks (~170 KB gzip) precisa ser baixado e o service worker registrado e ativado antes
  do app, por causa da interceptação do WebSocket;
- cada requisição simulada tem 150–350 ms de latência proposital no cenário padrão;
- sob o perfil mobile (4G lento simulado e CPU 4× mais lenta), essa cadeia empurra o FCP para ~2,3 s e o LCP
  (a imagem do primeiro card ou a principal do detalhe) para ~3,9 s.

O que já foi feito: imagens AVIF/WebP com `srcset`/`sizes` (8–48 KB), `fetchpriority` na imagem de LCP e
lazy-loading no resto, fonte servida localmente (o navegador baixa só o subset latin, ~33 KB), CSS carregado em paralelo ao MSW, rotas com code
splitting, sessão resolvida em paralelo aos dados da rota e camada de tempo real carregada após o primeiro
render. Baixar o app em paralelo ao MSW foi testado e piorou a pontuação (disputa de banda na simulação), por
isso foi revertido. A auditoria roda o build completo, com mocks, imagens e fontes reais.

## Diferenças em relação ao Figma

O visual segue o Figma, com as medidas conferidas tela a tela em 1440 e 390 px. O que ficou diferente foi de
propósito, e o motivo de cada caso está abaixo.

### O Figma pede algo que o contrato não tem

A regra foi não mostrar campo que não é salvo em lugar nenhum. Quem preenche um campo espera que ele valha
alguma coisa.

- **Checkout:** ficam nome de exibição, e-mail, rede e observação. ENS, nome do perfil, código de indicação,
  tipo de carteira e "Usar outra carteira?" saíram.
- **Checkout no mobile:** o Figma não mostra o formulário do comprador, mas ele continua lá, igual ao desktop.
  Os dados são obrigatórios no pedido, e um erro de validação sem o campo na tela não teria como ser corrigido.
- **Escolha da carteira:** a lista mostra as carteiras do usuário (apelido, endereço e provedor), e não só os
  provedores (MetaMask, WalletConnect, Coinbase). O pedido precisa de uma carteira cadastrada. Uma lista de
  provedores ao lado seria um segundo jeito de escolher a mesma coisa.
- **Perfil:** sem "Remover" no avatar (não há endpoint), sem ENS e sem apelido da carteira. A bio fica, porque
  está no contrato. Salvar os dados e trocar a senha são ações separadas, cada uma com sua validação.
- **Carteiras:** o formulário tem apelido, endereço e tipo. Os outros campos do Figma (nome de exibição, rede,
  ENS, e-mail, "Igual à carteira principal") não existem no contrato.
- **Cadastro:** não tem campo de nome, como no Figma. O nome de exibição começa igual ao usuário e pode ser
  trocado no perfil.

### O Figma não cobre

- **Navegação:** "Criadores" e "Aprenda" não têm página e levam às seções da home. "Mercado" fica ativo nas
  telas de compra. Itens do rodapé sem página aparecem como texto, e não como link quebrado.
- **Mobile e tablet:** o Figma só tem 414 e 1440 px. Abaixo de `lg`, header e rodapé dão lugar à barra
  inferior. O coração abre os favoritos (página nova), o botão central abre as carteiras, e "Sair" fica no menu
  do perfil.
- **Catálogo:** "Somente disponíveis" e "Limpar filtros" foram adicionados. As redes são Ethereum, Polygon,
  Arbitrum e Base, no lugar de Solana, porque as carteiras são EVM (endereços 0x). O selo "Raro" é um campo do
  NFT, escolhido nos dados, e não calculado.
- **Detalhe:** "N de M disponíveis" abaixo das edições e um aviso quando o carrinho já tem o máximo por pedido.
  No mobile, a barra de compra mostra o total da quantidade escolhida, e não só o preço unitário.
- **Carrinho:** um item esgotado mostra um aviso e bloqueia o checkout. A linha de desconto aparece sempre; com
  cupom, mostra o código e a opção de remover.
- **Ícones:** os do Figma (Iconly) ficam em `components/icons.tsx`, gerados a partir dos vetores do arquivo.
  Onde o Figma não desenha um ícone (mostrar senha, fechar, alertas, + e −), o Lucide cobre com traço
  parecido.
- **Recibo:** é uma página própria, e não um modal sobre o checkout, para poder ser aberto pelo link do pedido.

### Acessibilidade e uso

- Os pontos do carrossel não estão iguais: o ativo fica destacado e os outros com 60% de opacidade. No Figma
  os três são iguais, e não dá para saber qual slide está na tela. Os pontos do carrossel e da galeria mobile
  também ficam 24 px um do outro (no Figma, 16 e 14 px), para que cada um seja um alvo de toque de 24×24 px.
- Campos que no Figma só têm placeholder ganharam rótulo para leitor de tela. A contagem de resultados do
  catálogo também existe só para leitor de tela.
- No mobile, o resumo do carrinho fica no fluxo da página, e não preso ao rodapé. Com zoom, um painel fixo de
  ~340 px cobriria a lista. Pelo mesmo motivo, os toasts aparecem no topo.
- A borda dos campos segue o Figma (`#3f2319`), mesmo com pouco contraste. O campo continua fácil de
  reconhecer pelo fundo e pelo placeholder.

### Inconsistências do próprio Figma

- Os cards do blog têm 282 px. Com os 268 px do Figma, sobravam 56 px vazios no fim da linha.
- O seletor de ordenação é um pouco mais largo, porque no Figma a seta fica por cima do texto.
- Na barra inferior do mobile, o espaço entre os ícones é igual em toda a barra. O Figma usa 4 px entre os dois
  primeiros e 16 px no resto.
- Cada card do Figma tem a imagem num tamanho diferente (há até uma vertical, de 190×243). Aqui todos usam um
  quadro quadrado, com a imagem recortada.
- No detalhe, "Contrato" e "Direitos autorais" estavam com os conteúdos trocados.

## Limitações

- Login social, recuperação de senha e conteúdo editorial (blog, links institucionais) não têm backend: os
  botões informam que não estão disponíveis na demonstração.
- Um pedido por vez: enquanto houver pedido pendente, o checkout fica bloqueado.
- A cotação usa a rede de pagamento escolhida no checkout; a rede de cunhagem do NFT é só um atributo de
  catálogo.
- Em WSL, o `chrome-launcher` do Lighthouse cria perfis temporários com caminho estilo Windows na raiz do
  projeto (ignorados no git).
