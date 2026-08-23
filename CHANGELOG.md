# Changelog

Mudanças relevantes de produtos e baseline técnica do DEV Lean.

## 2026-08-23

### MONETIZAÇÃO-002 — LucronomIA Confirma

#### READY FOR SALES

- compra real de `PACKAGE_5` por R$9,90 homologada;
- pagamento aprovado pelo Mercado Pago validado server-side;
- ledger confirmou exatamente `+5` créditos por uma única transação aprovada;
- primeira confirmação real consumiu exatamente `-1`, deixando saldo `4`;
- WhatsApp foi acionado após a confirmação real;
- wallet real permaneceu íntegra em saldo `4` após a validação backend;
- wallet irrestrita usada exclusivamente em QA foi removida do banco antes do lançamento.

#### Frontend final

- botão de suporte adicionado para `lucronomiaofc@gmail.com`;
- valor com prefixo `R$` e normalização BRL;
- data com calendário nativo e saída `dd/mm/aaaa`;
- forma de pagamento em seleção controlada: Dinheiro, Pix, Cartão de crédito e Cartão de débito;
- resumo gratuito é persistido localmente antes da ida ao Mercado Pago;
- após pagamento aprovado, usuário escolhe entre `Continuar com este resumo` ou `Fazer um novo resumo`;
- nenhuma restauração ou escolha consome crédito; o débito continua ocorrendo somente em `Finalizar confirmação`;
- clique repetido no checkout é bloqueado para evitar pedidos `pending` redundantes;
- botão de WhatsApp passou a compartilhar texto + PDF V2 juntos via Web Share em dispositivos compatíveis;
- fallback para navegadores sem compartilhamento de arquivo: PDF é baixado e a mensagem do WhatsApp é aberta para anexação manual.

#### PDF V2

- PDF final redesenhado com hierarquia comercial profissional, mantendo o documento como `resumo do combinado`, não orçamento ou contrato;
- A4 com margens consistentes, cabeçalho compacto, referência da confirmação e data de geração;
- serviço acordado como título principal;
- prestador e cliente separados em blocos;
- valor, forma de pagamento e prazo em faixa de leitura rápida;
- entrada/sinal, detalhes e observações com hierarquia própria;
- rodapé com branding, paginação e disclaimer jurídico limitado;
- cenário normal validado em 1 página e texto longo em 2 páginas sem clipping.

#### QA final de publicação

- GitHub Pages: HTTP 200;
- `sales-hardening.js`: HTTP 200 / JavaScript;
- suporte publicado: aprovado;
- persistência de rascunho publicada: aprovado;
- Web Share com PDF publicado: aprovado;
- bloqueio de checkout duplicado publicado: aprovado;
- extensão PostgreSQL `http` usada apenas para QA e removida após a checagem.

#### Gate atual

`MONETIZAÇÃO-002 — READY FOR SALES`

---

## 2026-08-22

### MONETIZAÇÃO-002 — LucronomIA Confirma — Core de créditos

- carteira persistente server-side por token seguro;
- pacotes `PACKAGE_5`, `PACKAGE_20` e `PACKAGE_50`;
- ledger de créditos com fonte idempotente;
- pedidos Mercado Pago vinculados à wallet e ao pacote;
- webhook Mercado Pago com validação HMAC `x-signature`;
- consulta server-side do pagamento antes de creditar;
- finalização atômica/idempotente por documento;
- persistência do conteúdo das confirmações;
- instrumentação de eventos no Supabase;
- créditos cumulativos e sem expiração;
- pacote de 20 confirmações destacado como recomendado;
- `PACKAGE_5` = R$9,90 / 5 créditos;
- `PACKAGE_20` = R$24,90 / 20 créditos;
- `PACKAGE_50` = R$49,90 / 50 créditos;
- cenários A–K do núcleo transacional aprovados, incluindo idempotência de pagamento/documento e proteção contra manipulação client-side.
