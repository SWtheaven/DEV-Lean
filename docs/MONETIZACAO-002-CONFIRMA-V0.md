# HANDOFF — MONETIZAÇÃO-002 → DEV — UPDATE V0 + PREPARAÇÃO PARA TESTE REAL

**Projeto:** LucronomIA Confirma  
**Governança:** LucronomIA Lean  
**Origem:** Comercial / Mercado  
**Status:** `V0 CREDIT CORE IMPLEMENTED / PAYMENT SECRETS + REAL DEVICE QA PENDING`  
**Objetivo:** receber pagamentos corretamente, entregar créditos corretamente e consumir créditos corretamente.

---

## 1. Modelo comercial vigente

Oferta pública aprovada:

| Pacote | Preço | Valor por confirmação | Comunicação |
| --- | ---: | ---: | --- |
| **5 confirmações** | **R$9,90** | **R$1,98** | Ideal para experimentar |
| **20 confirmações** | **R$24,90** | **R$1,25** | Recomendado / melhor custo para uso frequente |
| **50 confirmações** | **R$49,90** | **R$1,00** | Menor custo por confirmação |

Regras:

- pagamento único;
- sem mensalidade;
- créditos cumulativos;
- créditos não expiram;
- publicamente usar `confirmações`, `créditos` ou `confirmações disponíveis`;
- não usar `token` na comunicação comercial;
- pacote de 20 confirmações destacado como recomendado.

Promessa oficial:

> **Combinou pelo WhatsApp? Organize e confirme em 30 segundos.**

---

## 2. Regra de consumo

Cada compra aprovada credita exatamente o pacote cadastrado no servidor:

```text
PACKAGE_5  → R$ 9,90  → +5 créditos
PACKAGE_20 → R$24,90  → +20 créditos
PACKAGE_50 → R$49,90  → +50 créditos
```

Cada nova confirmação efetivamente finalizada:

```text
-1 crédito
```

Não consome crédito ao preencher, editar, visualizar prévia, voltar, corrigir, baixar novamente, reenviar WhatsApp ou reabrir uma confirmação já finalizada.

A mesma confirmação é identificada por `client_confirmation_id` e só pode gerar um único débito.

---

## 3. Arquitetura V0 implementada

Runtime canônico:

```text
Supabase Edge Function: confirma
        ↓
Frontend mobile-first + API
        ↓
Supabase PostgreSQL
        ├── confirma_packages
        ├── confirma_wallets
        ├── confirma_orders
        ├── confirma_confirmations
        ├── confirma_credit_ledger
        └── confirma_events
```

Código canônico:

```text
supabase/functions/confirma/
├── deno.json
├── index.ts
└── public/
    ├── app.js
    ├── index.html
    └── styles.css

supabase/migrations/
└── 20260822_confirma_wallet_credits_v0.sql
```

A pasta `products/confirma/` permanece apenas como referência lógica para o produto e aponta para o runtime acima, evitando duas fontes de verdade.

### Persistência de créditos

Fonte de verdade: **PostgreSQL no Supabase**.

`localStorage` não armazena nem determina saldo. Ele guarda somente o segredo de acesso da carteira e o identificador da última confirmação para conveniência de reabertura.

A carteira usa:

- UUID interno server-side;
- segredo aleatório de 32 bytes entregue ao usuário;
- somente SHA-256 do segredo persistido no banco;
- segredo enviado à API por `x-wallet-token`;
- URL recuperável via fragmento `#wallet=...`, que não é transmitido ao servidor pelo navegador.

O link de acesso funciona como chave de recuperação da wallet. Quem possuir esse link possui acesso à carteira; por isso a interface orienta o usuário a guardá-lo e não compartilhá-lo.

---

## 4. Checkout Mercado Pago

Provider: **Mercado Pago**.

O shortlink histórico de R$9,90:

```text
https://mpago.la/1RjBkzr
```

não é mais usado como mecanismo técnico da carteira multi-pacote, pois não vincula de forma suficiente `wallet + order + package` para creditação confiável dos três pacotes.

O fluxo implementado cria a preferência de checkout server-side:

```text
wallet autenticada
↓
package_code enviado pelo cliente
↓
backend busca preço + créditos no banco
↓
cria order interno
↓
cria preferência Mercado Pago
↓
external_reference = order_id
↓
retorno + webhook vinculados ao pedido
```

O frontend nunca envia quantidade de créditos como fonte de verdade.

### Configuração server-side necessária

A Edge Function espera:

```text
MP_ACCESS_TOKEN
MP_WEBHOOK_SECRET
```

Esses secrets **não estão configurados no runtime neste momento** e não devem ser versionados no GitHub nem enviados ao frontend.

---

## 5. Confirmação confiável de pagamento

Retorno do navegador **não** credita saldo.

Crédito só ocorre após:

1. Webhook Mercado Pago recebido;
2. validação HMAC da assinatura `x-signature` usando `MP_WEBHOOK_SECRET`;
3. consulta server-side do pagamento na API do Mercado Pago usando `MP_ACCESS_TOKEN`;
4. confirmação de `status = approved`;
5. confirmação de moeda `BRL`;
6. confirmação de valor igual ao preço esperado do pedido;
7. confirmação de `external_reference = order_id`;
8. função SQL transacional `confirma_apply_approved_payment` aplicar o pacote cadastrado.

Portanto:

```text
clique no checkout ≠ pagamento aprovado
retorno do checkout ≠ pagamento aprovado
pagamento approved validado no servidor = créditos
```

---

## 6. Proteção contra duplicidade

### Pagamento

- `provider_payment_id` é único;
- ledger possui unicidade `(source_type, source_id)`;
- order é bloqueada com `SELECT ... FOR UPDATE` durante aplicação;
- reprocessar o mesmo pagamento aprovado retorna `applied = false`;
- saldo não é incrementado novamente.

### Confirmação

- unicidade `(wallet_id, client_confirmation_id)`;
- wallet é bloqueada durante consumo;
- retry/double click/refresh da mesma confirmação retorna `consumed = false`;
- saldo não é decrementado novamente.

---

## 7. PDF e WhatsApp

Após uma confirmação ser finalizada:

- conteúdo é persistido server-side;
- PDF é gerado client-side como arquivo `.pdf` baixável;
- nome: `combinado-cliente-data.pdf`;
- reabrir a última confirmação consulta o documento persistido;
- novo download não chama endpoint de consumo;
- WhatsApp reutiliza a confirmação já finalizada;
- reenviar não consome crédito.

Mensagem-base:

> Olá, [cliente]. Organizei o que combinamos sobre [serviço] para ficar tudo claro para nós dois.
>
> Valor: [valor]  
> Forma de pagamento: [forma]  
> Data/prazo: [data]
>
> Segue o resumo do combinado.

---

## 8. Instrumentação

Eventos previstos/implementados:

- `landing_view`;
- `form_start`;
- `preview_generated`;
- `buy_click`;
- `payment_started`;
- `payment_approved`;
- `credits_added`;
- `confirmation_finalized`;
- `pdf_generated`;
- `whatsapp_click`.

Eventos de pagamento aprovado e créditos adicionados são emitidos pelo backend, não pelo frontend.

---

# DEV UPDATE — IMPLEMENTAÇÃO CONCLUÍDA

## Commit / HEAD técnico

Commit principal do hardening de recuperação de wallet + PDF direto:

```text
74796b078ffdf3767a621bce50dcf7fd01e4778b
```

O HEAD documental posterior será o commit que contém esta própria atualização do handoff.

## URL da V0

Runtime Supabase Edge Function:

```text
https://jxuazdoflabqerkccevi.supabase.co/functions/v1/confirma/
```

Edge Function `confirma`: **ACTIVE — version 2**.

## Checkout

Arquitetura: preferência Mercado Pago criada dinamicamente no backend por pacote.

Pacotes mapeados no servidor:

```text
PACKAGE_5  = 5 créditos / 990 centavos
PACKAGE_20 = 20 créditos / 2490 centavos
PACKAGE_50 = 50 créditos / 4990 centavos
```

Bloqueio atual: `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` ainda não configurados como secrets de runtime.

## Persistência dos créditos

- Supabase PostgreSQL;
- `confirma_wallets.balance` como saldo materializado;
- `confirma_credit_ledger` como trilha de créditos/débitos;
- token aleatório por wallet, com apenas hash persistido;
- link seguro por fragmento para recuperação entre sessões/dispositivos.

## Confirmação de pagamento

- webhook Mercado Pago;
- HMAC `x-signature`;
- consulta da transação na API Mercado Pago;
- validação de status, BRL, valor e `external_reference`;
- créditos aplicados somente pela função SQL server-side.

## Proteção contra duplicidade

Pagamento:

```text
provider_payment_id UNIQUE
+ ledger source UNIQUE
+ SELECT FOR UPDATE
+ função idempotente
```

Documento:

```text
(wallet_id, client_confirmation_id) UNIQUE
+ lock da wallet
+ função idempotente
```

## Resultado dos testes A–K

Os testes abaixo foram executados transacionalmente no PostgreSQL e revertidos ao final para não poluir dados de produção.

| Cenário | Resultado | Evidência técnica |
| --- | --- | --- |
| **A — sem crédito** | ✅ PASS | saldo 0 bloqueia finalização com `INSUFFICIENT_CREDITS` |
| **B — pagamento 5** | ✅ PASS | 0 → 5; `credits_added=5`, `applied=true` |
| **C — primeiro uso** | ✅ PASS | 5 → 4; `consumed=true` |
| **D — mesmo documento novamente** | ✅ PASS no núcleo de consumo | retry do mesmo `client_confirmation_id`: saldo permanece 4, `consumed=false`; download real ainda requer dispositivo |
| **E — segundo documento** | ✅ PASS | 4 → 3; novo id consome 1 |
| **F — refresh/retry** | ✅ PASS | pagamento repetido não recarrega; documento repetido não debita |
| **G — saldo zerado** | ✅ PASS | nova finalização bloqueada |
| **H — pacote 20** | ✅ PASS | pacote server-side adiciona +20 |
| **I — pacote 50** | ✅ PASS | 0 → 50 |
| **J — cumulatividade** | ✅ PASS | saldo 3 + pacote 20 = 23 |
| **K — manipulação** | ✅ PASS | PACKAGE_5 aplica +5; quantidade de créditos não é aceita do frontend |

Durante o primeiro ciclo de QA foi detectado um conflito de nome `balance` em PL/pgSQL. A função foi corrigida e todos os cenários acima foram repetidos com sucesso após a correção.

## Custo atual de infraestrutura

```text
Supabase existente / free tier: R$0 incremental no estado atual
GitHub: R$0
IA: R$0
```

Mercado Pago terá somente os custos transacionais aplicáveis às vendas; não foi adicionada mensalidade de infraestrutura por esta implementação.

## Limitações conhecidas / bloqueios para teste real

1. **MP_ACCESS_TOKEN ausente no runtime.**
2. **MP_WEBHOOK_SECRET ausente no runtime.**
3. O ambiente desta sessão não conseguiu executar smoke HTTP externo contra a URL Supabase, embora a Edge Function esteja reportada como `ACTIVE version 2` pela plataforma.
4. PDF precisa ser baixado/aberto em dispositivo real.
5. WhatsApp precisa ser aberto/preenchido em dispositivo real.
6. Compra real R$9,90 ainda não foi executada.
7. Os pacotes de R$24,90 e R$49,90 ainda não foram exercitados contra o gateway real; o núcleo server-side A–K está validado.

## Status DEV

```text
CREDIT/WALLET CORE              ✅ IMPLEMENTADO
PACOTES 5 / 20 / 50            ✅ IMPLEMENTADOS
PERSISTÊNCIA SERVER-SIDE        ✅ IMPLEMENTADA
CONSUMO ATÔMICO                 ✅ IMPLEMENTADO
IDEMPOTÊNCIA PAGAMENTO          ✅ IMPLEMENTADA
IDEMPOTÊNCIA DOCUMENTO          ✅ IMPLEMENTADA
EDGE FUNCTION                   ✅ ACTIVE V2
PDF DIRETO                      ✅ IMPLEMENTADO / DEVICE QA PENDENTE
WHATSAPP                        ✅ IMPLEMENTADO / DEVICE QA PENDENTE
MP ACCESS TOKEN                 ⛔ PENDENTE
MP WEBHOOK SECRET               ⛔ PENDENTE
PAGAMENTO REAL                  ⛔ PENDENTE
```

### Gate

**MONETIZAÇÃO-002 ainda NÃO recebe `READY FOR REAL PURCHASE TEST`.**

Próximo gate técnico:

> configurar `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` de forma segura no Supabase, validar checkout/webhook reais e executar smoke em dispositivo.

Somente depois disso:

> **MONETIZAÇÃO-002 — READY FOR REAL PURCHASE TEST**

E somente após a compra deliberada de R$9,90 comprovar `+5 → uso 1 → saldo 4 → fechar/reabrir → saldo 4`, PDF e WhatsApp reais:

> **READY FOR SALES**
