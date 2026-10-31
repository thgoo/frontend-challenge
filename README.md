# Kurio — marketplace de NFTs

Solução do [desafio de frontend](CHALLENGE.md): catálogo, detalhe, carrinho, checkout com carteira, conta e
tempo real, sobre um backend simulado com MSW (REST + Socket.IO). Decisões, contratos e limitações estão em
[ARCHITECTURE.md](ARCHITECTURE.md).

- **Demo:** _(publicação pendente)_
- **Stack:** Vite 8, React 19, TypeScript 6, TanStack Router e Query, Axios, Zod 4, React Hook Form,
  Tailwind 4 + shadcn/ui, MSW 2 + `@mswjs/socket.io-binding`, socket.io-client, Playwright e Lighthouse CI.

## Requisitos e setup

- Node.js 22 ou superior (desenvolvido com Node 26) e npm.

```bash
npm install
npx playwright install chromium   # navegador dos testes E2E e da auditoria Lighthouse
npm run dev                       # http://localhost:5173, com os mocks ativos
```

## Variáveis de ambiente

Ficam em `.env` (sem segredos, versionado):

| Variável            | Padrão | Efeito                                                                              |
| ------------------- | ------ | ----------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` | Liga a camada MSW (REST e Socket.IO) no dev, no preview e no build de demonstração. |
| `VITE_API_URL`      | `/api` | Base das chamadas REST.                                                             |

## Credenciais fictícias

| Usuário | E-mail              | Senha         | Observação                           |
| ------- | ------------------- | ------------- | ------------------------------------ |
| Alice   | `alice@example.com` | `Password123` | Tem carteira principal e secundária. |
| Bob     | `bob@example.com`   | `Password123` | Sem carteiras.                       |

Cupons: `WELCOME10` (10%), `COLLECTOR25` (25%) e `SUMMER20` (expirado).

## Cenários dos mocks

Acrescente `?scenario=<nome>` a qualquer URL: o cenário é trocado e os dados voltam ao estado inicial. `?reset`
restaura os dados do cenário atual. O cenário fica salvo no `localStorage` entre recargas.

| Cenário             | O que simula                                                                           |
| ------------------- | -------------------------------------------------------------------------------------- |
| `default`           | Catálogo completo, dois usuários e latência realista (150–350 ms).                     |
| `empty`             | Catálogo vazio.                                                                        |
| `slow`              | Todas as requisições levam ~2,5 s (skeletons).                                         |
| `variable-latency`  | Latência entre 50 ms e 2 s: respostas fora de ordem.                                   |
| `flaky`             | As três primeiras requisições do catálogo falham com 503 e depois a API se recupera.   |
| `offline`           | Toda requisição falha na rede.                                                         |
| `server-error`      | Toda requisição responde 500.                                                          |
| `favorites-failure` | Favoritar falha com 500 (rollback otimista).                                           |
| `short-session`     | Sessões expiram em 60 s.                                                               |
| `payment-declined`  | A carteira recusa o pagamento após a liquidação.                                       |
| `slow-payment`      | O pagamento fica pendente por 20 s.                                                    |
| `order-timeout`     | O pedido é criado, mas a resposta não chega; a nova tentativa recupera o mesmo pedido. |
| `price-change`      | O preço de um item sobe logo antes do primeiro pedido.                                 |
| `sold-out`          | Um item esgota logo antes do primeiro pedido.                                          |
| `wallet-rejected`   | A carteira recusa toda conexão.                                                        |

No console do navegador, `window.__mocks` controla o backend simulado (o mesmo usado pelos testes):

```js
__mocks.scenarios; // lista de cenários
__mocks.reset('slow'); // troca de cenário e reinicia os dados
__mocks.expireSessions(); // expira todas as sessões
__mocks.disconnectWallets(); // a extensão da carteira desconecta o site
__mocks.updateEdition('nft_002', 'ed_002_1', { priceEth: '9.99' }); // muda preço: REST + evento nft.updated
__mocks.updateEdition('nft_002', 'ed_002_1', { available: 0 }); // esgota a edição
__mocks.sockets.setOnline(false); // derruba o Socket.IO (true reconecta)
__mocks.sockets.deliveredEvents(); // eventos entregues
__mocks.sockets.redeliver('evt_0002'); // reenvia um evento (duplicado/antigo)
```

## Comandos

| Comando                                           | O que faz                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`                                     | Desenvolvimento com mocks.                                                          |
| `npm run build`                                   | Typecheck e build otimizado em `dist/`.                                             |
| `npm run preview`                                 | Serve o build (`http://localhost:4173`).                                            |
| `npm run typecheck`                               | Verificação de tipos.                                                               |
| `npm run lint` / `npm run format`                 | ESLint / Prettier.                                                                  |
| `npm test`                                        | Testes unitários (Vitest).                                                          |
| `npm run test:e2e`                                | Playwright (desktop 1440 e mobile 390, Chromium) contra o build.                    |
| `npm run test:e2e:ui` / `npm run test:e2e:report` | Modo UI / relatório HTML com traces das falhas.                                     |
| `npm run lighthouse`                              | Build + auditoria mobile e desktop (3 execuções) + `lighthouse-reports/SUMMARY.md`. |

Para regenerar as baselines visuais: `npx playwright test e2e/visual.spec.ts --update-snapshots`.

## Reproduzindo os fluxos de falha

| Fluxo                            | Como reproduzir                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Carregamento lento e skeletons   | `/?scenario=slow`, depois navegue para o detalhe ou o carrinho.                                                       |
| Falha e nova tentativa           | `/?scenario=offline` (erro na abertura); `__mocks.reset('default')` e "Tentar novamente".                             |
| Falhas transitórias              | `/?scenario=flaky`: o catálogo se recupera sozinho com retry.                                                         |
| Respostas fora de ordem          | `/?scenario=variable-latency` e troque filtros rapidamente: vale sempre a última busca.                               |
| Rollback otimista                | `/?scenario=favorites-failure`, entre e favorite um NFT.                                                              |
| Sessão expirada                  | Entre, rode `__mocks.expireSessions()` e salve o perfil: você volta ao login e, depois, à mesma página.               |
| Preço/estoque durante o checkout | Item no carrinho, abra o pagamento e rode `__mocks.updateEdition(...)`: o total fica bloqueado até "Atualizar total". |
| Mudança no momento da compra     | `?scenario=price-change` ou `?scenario=sold-out` e confirme a compra.                                                 |
| Pagamento recusado               | `?scenario=payment-declined` e confirme a compra.                                                                     |
| Timeout com idempotência         | `?scenario=order-timeout`: após ~10 s a nova tentativa recupera o mesmo pedido.                                       |
| Queda do Socket.IO               | Pedido pendente (`?scenario=slow-payment`), `__mocks.sockets.setOnline(false)`, depois `true`.                        |
| Carteira recusada                | `?scenario=wallet-rejected` e confirme a compra.                                                                      |
| Carteira desconectada            | Após uma compra (a carteira fica conectada), abra outro pagamento, rode `__mocks.disconnectWallets()` e confirme.     |
| Cadastro com conflito            | Cadastre `alice@example.com` ou o usuário `bob`.                                                                      |
| Cupom inválido/expirado          | `NOPE` ou `SUMMER20` no carrinho.                                                                                     |

## Testes e auditoria

- **E2E:** 82 casos por viewport (desktop 1440 e mobile 390; alguns só valem para um deles), cobrindo os 12
  fluxos do desafio, a regressão visual de início, detalhe, carrinho e pagamento
  (`e2e/visual.spec.ts-snapshots`) e a ausência de overflow horizontal em 320, 768, 1024 e 1152 px. Cada
  teste parte de um cenário reiniciado; REST passa pelos handlers MSW e o tempo real pelo `socket.io-client`.
- **Unitários:** domínio dos mocks (catálogo, carrinho, pedidos), contratos, ETH em `bigint`, i18n e frescor da cotação.
- **Lighthouse:** relatórios HTML/JSON em `lighthouse-reports/`, medianas em
  [`lighthouse-reports/SUMMARY.md`](lighthouse-reports/SUMMARY.md) e análise em ARCHITECTURE.md.
