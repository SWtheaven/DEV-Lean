# HANDOFF — MONETIZAÇÃO-002 — LucronomIA Confirma

**Governança:** LucronomIA Lean  
**Origem:** Comercial / Mercado  
**DEV:** DEV-Lean  
**Status final:** `MONETIZAÇÃO-002 — READY FOR SALES`  
**Data de homologação:** 2026-08-23

---

## 1. Oferta comercial vigente

| Pacote | Preço | Créditos |
| --- | ---: | ---: |
| 5 confirmações | R$9,90 | +5 |
| 20 confirmações | R$24,90 | +20 |
| 50 confirmações | R$49,90 | +50 |

Regras:

- pagamento único;
- sem mensalidade;
- créditos cumulativos;
- créditos não expiram;
- cada nova confirmação finalizada consome `-1` crédito;
- prévia, edição, checkout, retorno do pagamento, reabertura, novo download e novo compartilhamento não consomem crédito.

Promessa oficial:

> **Combinou pelo WhatsApp? Organize e confirme em 30 segundos.**

---

## 2. Arquitetura homologada

Frontend público:

```text
https://swtheaven.github.io/DEV-Lean/confirma/
```

Backend:

```text
Supabase Edge Function: confirma
Supabase PostgreSQL: wallets + orders + ledger + confirmations + events
Mercado Pago: checkout + webhook
```

Fonte de verdade do saldo: **PostgreSQL no Supabase**.

O browser guarda somente o segredo de acesso da wallet; saldo não é determinado por `localStorage`.

---

## 3. Segurança e idempotência

### Pagamento

Créditos só são adicionados após:

1. webhook Mercado Pago;
2. validação de assinatura `x-signature`;
3. consulta server-side do pagamento;
4. `status = approved`;
5. moeda BRL;
6. valor compatível com o pacote server-side;
7. `external_reference` vinculado ao order interno;
8. aplicação transacional no PostgreSQL.

Proteções:

```text
provider_payment_id UNIQUE
ledger source UNIQUE
SELECT ... FOR UPDATE
aplicação idempotente
```

### Confirmação

O débito acontece somente no endpoint de finalização.

Proteções:

```text
(wallet_id, client_confirmation_id) UNIQUE
lock da wallet
função SQL transacional
retry da mesma confirmação = consumed false
```

---

## 4. Pagamento real homologado

Teste financeiro real executado com:

```text
PACKAGE_5
R$9,90
```

Resultado confirmado diretamente no backend:

```text
pagamento approved
→ +5 créditos
→ saldo 5
→ 1 confirmação finalizada
→ -1 crédito
→ saldo 4
```

O ledger registrou exatamente:

```text
+5 purchase
-1 confirmation
```

Não houve duplicação de créditos.

A wallet real permaneceu com:

```text
saldo = 4
approved_orders = 1
confirmations = 1
```

---

## 5. PDF final — V2 aprovado

O PDF V2 foi aprovado após redesign funcional.

Características:

- A4;
- hierarquia visual profissional;
- serviço acordado em destaque;
- prestador e cliente em blocos separados;
- valor, forma de pagamento e prazo agrupados;
- entrada/sinal, detalhes e observações com hierarquia própria;
- referência da confirmação;
- data de geração;
- paginação;
- disclaimer jurídico limitado;
- suporte a documentos longos em múltiplas páginas;
- sem transformar o produto em orçamento ou contrato.

QA:

- cenário normal: 1 página;
- cenário longo: 2 páginas;
- sem clipping;
- sem sobreposição;
- sem caracteres quebrados.

---

## 6. Formulário final

A experiência de preenchimento foi endurecida para reduzir erro e digitação:

- valor com prefixo `R$` e normalização automática para BRL;
- data por calendário nativo;
- data exibida no documento em `dd/mm/aaaa`;
- forma de pagamento em seleção controlada:
  - Dinheiro;
  - Pix;
  - Cartão de crédito;
  - Cartão de débito.

---

## 7. Persistência do resumo gratuito durante checkout

Problema identificado no teste:

> o resumo criado antes da compra era perdido ao sair para o Mercado Pago.

Correção implementada:

```text
prévia criada
→ rascunho salvo localmente
→ checkout Mercado Pago
→ pagamento aprovado
→ retorno ao Confirma
→ usuário escolhe:
   [Continuar com este resumo]
   [Fazer um novo resumo]
```

Regra crítica preservada:

> **nenhuma dessas etapas consome crédito.**

O crédito só é debitado quando o usuário clicar em:

> **Finalizar confirmação**

---

## 8. WhatsApp + PDF

O botão final passou a ser:

> **Enviar resumo + PDF**

Em dispositivos com Web Share API compatível:

```text
mensagem de resumo
+
PDF V2
→ mesma ação de compartilhamento
→ usuário escolhe WhatsApp
```

Fallback para navegadores sem compartilhamento de arquivos:

```text
PDF baixado automaticamente
+
WhatsApp aberto com a mensagem pronta
+
instrução para anexar o PDF baixado
```

A V0 não adiciona WhatsApp Business API, cobrança adicional ou infraestrutura externa para essa função.

---

## 9. Suporte

Canal público de suporte:

```text
lucronomiaofc@gmail.com
```

Há botão `Suporte` no cabeçalho e link de suporte no rodapé.

---

## 10. Hardening adicional de checkout

Durante o teste real foram observados cliques repetidos no CTA de compra, criando orders `pending` extras sem cobrança ou crédito duplicado.

Correção:

- primeiro clique bloqueia novos cliques temporariamente;
- CTA muda para `Abrindo pagamento…`;
- demais botões de pacote ficam temporariamente desabilitados;
- falha de abertura reabilita os botões;
- proteção financeira server-side permanece independente desse bloqueio de UX.

---

## 11. QA de publicação final

Validado no site público:

```text
HTML                         HTTP 200
sales-hardening.js           HTTP 200
botão de suporte             OK
persistência do rascunho     OK
Web Share com PDF            OK no código publicado
bloqueio de checkout         OK no código publicado
```

A extensão PostgreSQL `http`, usada somente para verificar o deploy a partir da infraestrutura, foi removida após o QA.

A wallet irrestrita criada exclusivamente para QA foi completamente removida antes da promoção para venda.

---

## 12. Custos atuais

```text
GitHub Pages: R$0
Supabase: free tier / R$0 incremental no estado atual
IA: R$0
```

Mercado Pago mantém apenas as tarifas transacionais aplicáveis às vendas.

---

# DEV UPDATE — IMPLEMENTAÇÃO CONCLUÍDA

## Estado final

```text
FRONTEND PÚBLICO             ✅
CHECKOUT MERCADO PAGO        ✅
WEBHOOK REAL                 ✅
PAGAMENTO REAL R$9,90        ✅
CRÉDITO +5                   ✅
CONSUMO -1                   ✅
SALDO FINAL 4                ✅
IDEMPOTÊNCIA                 ✅
PDF V2                       ✅ APROVADO
FORMULÁRIO OTIMIZADO         ✅
RASCUNHO PÓS-CHECKOUT        ✅
SUPORTE                      ✅
WHATSAPP + PDF               ✅ / fallback documentado
WALLET QA IRRESTRITA         ✅ REMOVIDA
CUSTO INCREMENTAL            R$0
```

## Gate final

> **MONETIZAÇÃO-002 — READY FOR SALES**

A partir deste ponto, mudanças adicionais devem ser tratadas como evolução pós-lançamento e priorizadas por evidência de uso/venda, sem reabrir o escopo da V0 sem nova decisão de governança.
