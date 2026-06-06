# WhatsApp Bubble Button — FAB + chat de FAQ (template reutilizável)

Componente reutilizável da Almeida Escala Digital: o **botão circular de WhatsApp (FAB)** + o **chat que abre acima dele** (preview de FAQ) + o **teaser** ("Olá, como posso ajudar?") que aparece após 10s. Extraído do projeto **Arilton Silva Advocacia** (referência viva e funcional) para virar peça de catálogo.

> Este arquivo é companheiro do `landing-patterns.md` (§10 e §12, que descrevem o FAB e a conversão por WhatsApp) e do `design.md` de cada cliente. As mecânicas aqui são "produto" da agência: copie, ajuste só os tokens/conteúdo, não reescreva do zero.

---

## 0. Resumo executivo (leia primeiro)

1. **FAB verde por default.** O fundo do FAB é `#25D366` (verde WhatsApp). Esse é o padrão da agência (`landing-patterns.md` §10/§12). Cada cliente pode sobrescrever via token `--wa-accent` (o Arilton, por exemplo, roda o FAB em `--ink` por direção minimalista — ver §9).
2. **Chat é desktop-only.** O balão e o teaser têm `hidden md:block` e abrem no **hover** do FAB. No mobile não há chat: o FAB verde + a sticky bar levam direto ao `wa.me`. (Touch não tem hover; o mobile já tem rota direta de conversão.)
3. **Perguntas vêm do FAQ.** O chat lê o `#faqList` da página (`summary span` + `.faq-a p`) como fonte única. Se a página não tiver FAQ, cai para um fallback inline (`data-faqs` JSON no widget).
4. **Teaser após 10s.** Conta **a partir de quando o FAB fica visível** (que acontece ao rolar além de ~55% da hero), não do load. Delay ajustável via `data-teaser-delay`.
5. **Dispensa só até o reload.** Fechar o chat/teaser dispensa em memória; numa nova visita/recarga o teaser volta após 10s. Sem `localStorage`.
6. **Tokens `--wa-*` híbridos.** Todo CSS usa `var(--wa-x, var(--token-do-projeto, default))`: drop-in puro com defaults embutidos, mas herda a paleta do cliente quando os tokens existem.
7. **Nunca GSAP em transform do FAB.** O CSS controla 100% do transform (`translateY(120%)` no estado oculto). GSAP `yoyo:true/repeat:-1` capturaria esse valor inicial e travaria o FAB deslocado. Regra crítica do `landing-patterns.md`.

---

## 1. Anatomia (3 peças + 1 dependência)

| Peça | Id | Papel |
|---|---|---|
| **FAB** | `#whatsappFab` | Âncora redonda fixa → `wa.me`. Aparece desktop + mobile. Fundo verde por default. |
| **Widget (chat)** | `#waWidget` | Painel branco acima do FAB. Desktop-only. Abre no hover do FAB / clique no teaser. |
| **Teaser** | `#waTeaser` | Balão de descanso "Olá, como posso ajudar?". Aparece após 10s. Desktop-only. |
| **Dependência: FAQ** | `#faqList` | Seção de FAQ da página. Fonte das perguntas/respostas do chat. |

Mensagens (duas distintas, não confundir):
- **Teaser** (descanso, fora do chat): texto fixo no HTML do `#waTeaserOpen` ("Olá, como posso ajudar?").
- **Boas-vindas** (primeira bolha quando o chat abre): sorteada entre `data-msg1/2/3` do `#waWidget`.

---

## 2. Comportamento (spec)

### FAB
- Redondo, `position:fixed`, glyph branco (SVG embutido, ver `.wa-ico`).
- Visibilidade controlada pela lógica de sticky bar (`landing-patterns.md` §10): ganha `.is-visible` quando `scrollY > hero.offsetHeight * 0.55`. Some quando o menu mobile abre (`body.menu-open`).
- Posicionamento simétrico: desktop `right = bottom`; mobile `bottom = altura_sticky_bar + right` (folga até o topo da sticky bar, não da tela).
- Clique = vai para o `wa.me` (é um `<a>`). No desktop, **hover** abre o chat (sem navegar).

### Chat (desktop, `hover:hover` + `pointer:fine`)
- Abre no `pointerenter` do FAB; fecha ~260ms após o ponteiro sair do FAB **e** do painel (a menos que "pinado").
- Fica **pinado** (não fecha sozinho) quando o usuário clica numa pergunta ou abre via teaser.
- Clique fora fecha o chat (volta ao teaser).
- Botão "X" (`#waClose`) **dispensa** de vez (na sessão): some chat e teaser.
- Boas-vindas com indicador de digitação (3 pontos, ~750ms), depois os **chips** (uma pergunta por linha). Clicar num chip: vira bolha "out" (usuário), some o chip, responde com bolha "in", reexibe os chips restantes. Quando acabam, mostra a mensagem `data-end` + CTA "Falar no WhatsApp".

### Teaser (10s)
- Timer começa quando o FAB fica visível (idempotente; também rearmado em scroll). Após `data-teaser-delay` (default 10000ms), o teaser aparece — se não foi dispensado, o FAB está visível e o chat não está aberto.
- Clique no balão abre o chat (pinado). "x" do teaser dispensa de vez (sessão).

### Reduced motion
- `@media (prefers-reduced-motion:reduce)` global já zera transições/animações.
- No JS, `waReduced` pula o indicador de digitação (mostra a bolha direto).

---

## 3. Pré-requisitos

- **Seção de FAQ** com o contrato de DOM abaixo (ou o fallback inline da §6). É o padrão da agência (`landing-patterns.md` §5):
  ```html
  <div class="faq-list" id="faqList">
    <details class="faq-item">
      <summary><span>Pergunta?</span><span class="faq-mark" aria-hidden="true"></span></summary>
      <div class="faq-a"><p>Resposta.</p></div>
    </details>
    <!-- ... -->
  </div>
  ```
  O chat lê `#faqList .faq-item` → `summary span` (pergunta) + `.faq-a p` (resposta).
- **Lógica de FAB/sticky bar** (`landing-patterns.md` §10) para dar `.is-visible` ao FAB. Snippet incluído na §7 caso o projeto ainda não tenha.
- Sem dependência de GSAP para o chat (Vanilla puro). GSAP só é usado em outras animações do site.

---

## 4. Tokens (`--wa-*`) — híbrido com fallback

Nenhum token precisa ser definido para funcionar: cada `var()` tem fallback para o token do projeto e, por fim, um default embutido. Para customizar por cliente, defina só os `--wa-*` desejados no `:root` do `styles.css`.

| Token | Default embutido | Fallback de projeto | Pinta |
|---|---|---|---|
| `--wa-accent` | `#25D366` | `--whatsapp` | Fundo do FAB |
| `--wa-ink` | `#181818` | `--ink` | Texto forte, bolha "out" |
| `--wa-ink-2` | `#4A4A4A` | `--ink-2` | Texto body (chips) |
| `--wa-ink-3` | `#7C7C7C` | `--ink-3` | Texto auxiliar (fim da lista) |
| `--wa-line` | `#1f1f1f` | `--ink` | Borda do painel/teaser/close |
| `--wa-line-soft` | `#E6E6E6` | `--line` | Divisor acima do CTA |
| `--wa-chip-border` | `#D6D6D6` | `--line-strong` | Borda dos chips |
| `--wa-bubble-in` | `#F0F0F0` | — | Fundo da bolha "in" (assistente) |
| `--wa-surface` | `#ffffff` | — | Fundo do painel/bolhas/teaser |
| `--wa-ease` | `cubic-bezier(0.22,1,0.36,1)` | `--ease` | Easing das transições |

Override por cliente (opcional):
```css
/* Exemplo: cliente quer o FAB monocromatico (como o Arilton) */
:root{ --wa-accent: var(--ink, #181818); }
```

---

## 5. HTML (colar antes de `</body>`)

Troque o `NUMERO` (`55` + DDD + número, sem espaço/hífen) e o texto pré-preenchido. As três mensagens de boas-vindas e o `data-end` são editáveis. O `data-teaser-delay` (ms) e o `data-faqs` (fallback) são opcionais.

```html
<!-- ============ WHATSAPP FAB ============ -->
<a id="whatsappFab" href="https://wa.me/5511950172265?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20iniciar%20um%20atendimento." target="_blank" rel="noopener" aria-label="Fale conosco no WhatsApp">
  <span class="wa-ico wa-ico--lg" aria-hidden="true"></span>
</a>

<!-- ============ WHATSAPP CHAT WIDGET (desktop) ============ -->
<div id="waWidget" class="wa-widget hidden md:block"
  data-teaser-delay="10000"
  data-msg1="Olá! Sou a assistente virtual do escritório. Tem alguma dúvida? Escolha um tema abaixo ou fale direto com a gente."
  data-msg2="Oi, tudo bem? Posso adiantar algumas respostas por aqui. Toque numa dúvida abaixo para começar."
  data-msg3="Olá! Veja as dúvidas mais comuns abaixo, ou fale com a gente no WhatsApp quando quiser."
  data-end="Ficou com outra dúvida? É só falar com a gente no WhatsApp."
  data-faqs='[]'>
  <div class="wa-panel">
    <div class="wa-scroll" id="waScroll">
      <div class="wa-thread" id="waThread"></div>
      <div class="wa-quick" id="waQuick" aria-label="Dúvidas frequentes"></div>
    </div>
    <a class="wa-cta" href="https://wa.me/5511950172265?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20iniciar%20um%20atendimento." target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div>
  <button type="button" class="wa-close" id="waClose" aria-label="Fechar conversa"></button>
</div>

<!-- WhatsApp teaser (convite de descanso, desktop) -->
<div id="waTeaser" class="wa-teaser hidden md:block">
  <button type="button" class="wa-teaser-bubble" id="waTeaserOpen">Olá, como posso ajudar?</button>
  <button type="button" class="wa-teaser-x" id="waTeaserClose" aria-label="Dispensar mensagem"></button>
</div>
```

`hidden md:block` depende do Tailwind. Sem Tailwind, troque por uma classe própria: `.wa-widget,.wa-teaser{display:none} @media(min-width:768px){.wa-widget,.wa-teaser{display:block}}`.

Fallback inline (página sem FAQ): preencha `data-faqs` com um array JSON. Use aspas simples no atributo (o JSON usa aspas duplas):
```html
data-faqs='[{"q":"Vocês atendem online?","a":"Sim, 100% online em todo o Brasil."},{"q":"Como funciona a primeira conversa?","a":"Você chama no WhatsApp e fazemos uma análise inicial do seu caso."}]'
```

---

## 6. CSS (colar no `styles.css`)

Comentários em ASCII puro, uma linha (acento/backtick quebram parsing sem charset). Não há dependência de `--ink`/`--line` etc.: tudo cai em default se o token do projeto não existir.

```css
/* ---------- WhatsApp glyph (sempre branco) ---------- */
.wa-ico{
  display:inline-block;width:1.1em;height:1.1em;flex:0 0 auto;
  background-repeat:no-repeat;background-position:center;background-size:contain;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.748-.984zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01a1.1 1.1 0 0 0-.792.372c-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z'/%3E%3C/svg%3E");
}
.wa-ico--lg{width:1.7rem;height:1.7rem}

/* ---------- FAB (verde por default) ---------- */
#whatsappFab{
  position:fixed;right:20px;bottom:84px;z-index:46;
  width:56px;height:56px;border-radius:50%;
  background:var(--wa-accent, var(--whatsapp, #25D366));
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 10px 26px rgba(0,0,0,0.3);
  transform:translateY(120%) scale(0.6);opacity:0;
  transition:transform .4s var(--wa-ease, var(--ease, cubic-bezier(0.22,1,0.36,1))),opacity .4s ease,box-shadow .3s ease;
}
#whatsappFab.is-visible{transform:translateY(0) scale(1);opacity:1}
/* Se o projeto tiver menu mobile splash, o FAB some com o menu aberto */
body.menu-open #whatsappFab.is-visible{transform:translateY(120%) scale(0.6);opacity:0}
@media (min-width:768px){
  #whatsappFab{right:36px;bottom:36px;width:68px;height:68px}
  #whatsappFab .wa-ico{width:2rem;height:2rem}
}
@media (min-width:768px) and (hover:hover){
  #whatsappFab.is-visible:hover{box-shadow:0 16px 40px rgba(0,0,0,0.45);transform:scale(1.06)}
}

/* ---------- Chat widget (desktop, abre no hover do FAB) ---------- */
.wa-widget{position:fixed;right:36px;bottom:120px;z-index:59;width:264px;transform-origin:bottom right;opacity:0;transform:scale(0.9) translateY(4px);pointer-events:none;transition:opacity .35s var(--wa-ease, var(--ease, cubic-bezier(0.22,1,0.36,1))),transform .4s var(--wa-ease, var(--ease, cubic-bezier(0.22,1,0.36,1)))}
.wa-widget.is-open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto}
.wa-panel{position:relative;background:var(--wa-surface, #fff);border:1.5px solid var(--wa-line, var(--ink, #1f1f1f));border-radius:16px;padding:14px;box-shadow:0 14px 34px rgba(0,0,0,0.16)}
.wa-panel::after{content:"";position:absolute;width:14px;height:14px;background:var(--wa-surface, #fff);border-right:1.5px solid var(--wa-line, var(--ink, #1f1f1f));border-bottom:1.5px solid var(--wa-line, var(--ink, #1f1f1f));border-bottom-right-radius:3px;bottom:-8px;right:30px;transform:rotate(45deg)}
.wa-scroll{max-height:min(58vh,400px);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#d2d2d2 transparent}
.wa-scroll::-webkit-scrollbar{width:5px}
.wa-scroll::-webkit-scrollbar-thumb{background:#d2d2d2;border-radius:5px}
.wa-thread{display:flex;flex-direction:column}
.wa-bubble{max-width:88%;padding:8px 11px;font-size:0.82rem;line-height:1.45;border-radius:13px;margin-bottom:12px;overflow-wrap:break-word;animation:waMsgIn .35s var(--wa-ease, var(--ease, cubic-bezier(0.22,1,0.36,1))) both}
.wa-bubble--in{background:var(--wa-bubble-in, #F0F0F0);color:var(--wa-ink, var(--ink, #181818));border-top-left-radius:4px;align-self:flex-start}
.wa-bubble--out{background:var(--wa-bubble-out, var(--ink, #181818));color:#fff;border-top-right-radius:4px;align-self:flex-end}
.wa-bubble--typing{padding:11px 13px}
.wa-dots{display:inline-flex;gap:4px;align-items:center}
.wa-dots span{width:6px;height:6px;border-radius:50%;background:#a8a8a8;animation:waType 1.2s infinite ease-in-out}
.wa-dots span:nth-child(2){animation-delay:.18s}
.wa-dots span:nth-child(3){animation-delay:.36s}
@keyframes waType{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
@keyframes waMsgIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.wa-quick{display:flex;flex-direction:column;gap:6px;margin-top:5px}
.wa-chip{width:100%;text-align:left;background:var(--wa-surface, #fff);border:1px solid var(--wa-chip-border, var(--line-strong, #D6D6D6));border-radius:10px;padding:8px 11px;font:inherit;font-size:0.78rem;line-height:1.35;color:var(--wa-ink-2, var(--ink-2, #4A4A4A));cursor:pointer;transition:border-color .2s ease,color .2s ease,background .2s ease}
.wa-chip:hover{border-color:var(--wa-ink, var(--ink, #181818));color:var(--wa-ink, var(--ink, #181818));background:#FAFAFA}
.wa-quick-end{font-size:0.76rem;line-height:1.45;color:var(--wa-ink-3, var(--ink-3, #7C7C7C));margin:6px 2px 0}
.wa-cta{display:block;text-align:center;margin-top:11px;padding-top:11px;border-top:1px solid var(--wa-line-soft, var(--line, #E6E6E6));font-size:0.78rem;font-weight:600;letter-spacing:0.02em;color:var(--wa-ink, var(--ink, #181818));text-decoration:none}
.wa-cta:hover{text-decoration:underline}
.wa-close{position:absolute;top:-10px;right:-10px;width:24px;height:24px;border-radius:50%;border:1.5px solid var(--wa-line, var(--ink, #1f1f1f));background:var(--wa-surface, #fff);color:var(--wa-line, var(--ink, #1f1f1f));cursor:pointer;padding:0;box-shadow:0 2px 6px rgba(0,0,0,0.14);transition:background .2s ease,color .2s ease}
.wa-close:hover{background:var(--wa-line, var(--ink, #1f1f1f));color:#fff}

/* ---------- Teaser (convite de descanso, desktop) ---------- */
.wa-teaser{position:fixed;right:36px;bottom:120px;z-index:58;opacity:0;transform:translateY(6px) scale(0.96);transform-origin:bottom right;pointer-events:none;transition:opacity .35s var(--wa-ease, var(--ease, cubic-bezier(0.22,1,0.36,1))),transform .4s var(--wa-ease, var(--ease, cubic-bezier(0.22,1,0.36,1)))}
.wa-teaser.is-shown{opacity:1;transform:none;pointer-events:auto}
.wa-teaser-bubble{position:relative;display:block;max-width:200px;background:var(--wa-surface, #fff);border:1.5px solid var(--wa-line, var(--ink, #1f1f1f));border-radius:14px;padding:10px 13px;font:inherit;font-size:0.84rem;line-height:1.35;color:var(--wa-ink, var(--ink, #181818));text-align:left;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,0.16);transition:background .2s ease}
.wa-teaser-bubble:hover{background:#FAFAFA}
.wa-teaser-bubble::after{content:"";position:absolute;width:12px;height:12px;background:var(--wa-surface, #fff);border-right:1.5px solid var(--wa-line, var(--ink, #1f1f1f));border-bottom:1.5px solid var(--wa-line, var(--ink, #1f1f1f));border-bottom-right-radius:3px;bottom:-7px;right:26px;transform:rotate(45deg)}
.wa-teaser-x{position:absolute;top:-9px;right:-9px;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--wa-line, var(--ink, #1f1f1f));background:var(--wa-surface, #fff);color:var(--wa-line, var(--ink, #1f1f1f));cursor:pointer;padding:0;box-shadow:0 2px 6px rgba(0,0,0,0.14);transition:background .2s ease,color .2s ease}
.wa-teaser-x:hover{background:var(--wa-line, var(--ink, #1f1f1f));color:#fff}
.wa-close::before,.wa-close::after,.wa-teaser-x::before,.wa-teaser-x::after{content:"";position:absolute;left:50%;top:50%;width:10px;height:1.5px;background:currentColor;border-radius:2px}
.wa-close::before,.wa-teaser-x::before{transform:translate(-50%,-50%) rotate(45deg)}
.wa-close::after,.wa-teaser-x::after{transform:translate(-50%,-50%) rotate(-45deg)}
```

> `--wa-bubble-out` não está na §4 porque não tem default próprio aqui: cai direto em `var(--ink, #181818)`. Defina-o se quiser a bolha do usuário em outra cor (ex.: verde estilo WhatsApp `--wa-bubble-out:#25D366` — confira contraste do texto branco, AA).

---

## 7. JS (colar dentro do IIFE do `main.js`)

Duas adições sobre o código original do Arilton: `data-teaser-delay` configurável e fallback `data-faqs`. O resto é fiel.

### 7a. Visibilidade do FAB (padrão landing-patterns §10 — reuse o existente se já houver)

```js
/* ---------- Sticky bar + WhatsApp FAB (visibilidade) ---------- */
/* Sem GSAP no transform do FAB: o CSS controla (evita o bug de captura do translateY(120%)) */
var stickyBar = document.getElementById('mobileStickyBar');
var fab = document.getElementById('whatsappFab');
var heroEl = document.querySelector('[data-hero], #hero, .hero');
function onStickyScroll() {
  var trigger = heroEl ? heroEl.offsetHeight * 0.55 : 320;
  var show = window.scrollY > trigger;
  if (stickyBar) stickyBar.classList.toggle('is-visible', show);
  if (fab) fab.classList.toggle('is-visible', show);
}
window.addEventListener('scroll', onStickyScroll, { passive: true });
onStickyScroll();
```

### 7b. Chat de FAQ + teaser

```js
/* ---------- WhatsApp mini-FAQ chat (desktop: hover na FAB + auto-peek 1x) ---------- */
var waWidget = document.getElementById('waWidget');
var waFab = document.getElementById('whatsappFab');
if (waWidget) {
  var waThread = document.getElementById('waThread');
  var waQuick = document.getElementById('waQuick');
  var waScroll = document.getElementById('waScroll');
  var waMsgs = [waWidget.dataset.msg1, waWidget.dataset.msg2, waWidget.dataset.msg3].filter(Boolean);
  var waWelcome = waMsgs.length ? waMsgs[Math.floor(Math.random() * waMsgs.length)] : 'Ola! Como posso ajudar?';
  var waReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* perguntas/respostas vem do proprio FAQ (fonte unica) */
  var waFaqs = [];
  Array.prototype.forEach.call(document.querySelectorAll('#faqList .faq-item'), function (it) {
    var q = it.querySelector('summary span');
    var a = it.querySelector('.faq-a p');
    if (q && a) waFaqs.push({ q: q.textContent.trim(), a: a.textContent.trim(), used: false });
  });
  /* fallback inline: se a pagina nao tem FAQ, le data-faqs (JSON) do widget */
  if (waFaqs.length === 0 && waWidget.dataset.faqs) {
    try {
      JSON.parse(waWidget.dataset.faqs).forEach(function (f) {
        if (f && f.q && f.a) waFaqs.push({ q: String(f.q), a: String(f.a), used: false });
      });
    } catch (e) { /* data-faqs invalido: ignora, chat degrada para saudacao + CTA */ }
  }

  function waScrollBottom() { if (waScroll) waScroll.scrollTop = waScroll.scrollHeight; }
  function waScrollToEl(el) {
    if (!waScroll || !el) return;
    var top = el.getBoundingClientRect().top - waScroll.getBoundingClientRect().top + waScroll.scrollTop;
    waScroll.scrollTop = Math.max(0, top - 8);
  }
  function waBubble(side, text) {
    var b = document.createElement('div');
    b.className = 'wa-bubble wa-bubble--' + side;
    b.textContent = text;
    if (waThread) waThread.appendChild(b);
    waScrollBottom();
    return b;
  }
  function waTypingBubble() {
    var b = document.createElement('div');
    b.className = 'wa-bubble wa-bubble--in wa-bubble--typing';
    b.innerHTML = '<span class="wa-dots"><span></span><span></span><span></span></span>';
    if (waThread) waThread.appendChild(b);
    waScrollBottom();
    return b;
  }
  function waSay(text, cb) {
    if (waReduced) { waBubble('in', text); if (cb) cb(); return; }
    var t = waTypingBubble();
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); waBubble('in', text); if (cb) cb(); }, 750);
  }
  function waRenderChips() {
    if (!waQuick) return;
    waQuick.innerHTML = '';
    var remaining = 0;
    waFaqs.forEach(function (f) {
      if (f.used) return;
      remaining++;
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'wa-chip';
      c.textContent = f.q;
      c.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        waPinned = true;
        f.used = true;
        var qb = waBubble('out', f.q);
        waQuick.innerHTML = '';
        waSay(f.a, function () { waRenderChips(); waScrollToEl(qb); });
      });
      waQuick.appendChild(c);
    });
    if (remaining === 0) {
      var p = document.createElement('p');
      p.className = 'wa-quick-end';
      p.textContent = waWidget.dataset.end || 'Fale com a gente no WhatsApp.';
      waQuick.appendChild(p);
    }
    waScrollBottom();
  }

  var waBuilt = false;
  function waBuildChat() { if (waBuilt) return; waBuilt = true; waSay(waWelcome, waRenderChips); }

  var waTeaser = document.getElementById('waTeaser');
  var waTeaserOpen = document.getElementById('waTeaserOpen');
  var waTeaserClose = document.getElementById('waTeaserClose');
  var waCanHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var waOverFab = false, waOverPanel = false, waCloseT = null, waDismissed = false, waPinned = false, waReady = false, waTimerStarted = false;
  var WA_TEASER_DELAY = parseInt(waWidget.dataset.teaserDelay, 10) || 10000;

  function waFabVisible() { return !waFab || waFab.classList.contains('is-visible'); }
  function waChatOpen() { return waWidget.classList.contains('is-open'); }
  function waSyncTeaser() {
    if (!waTeaser) return;
    if (waReady && !waDismissed && waFabVisible() && !waChatOpen()) waTeaser.classList.add('is-shown');
    else waTeaser.classList.remove('is-shown');
  }
  function waHideTeaser() { if (waTeaser) waTeaser.classList.remove('is-shown'); }
  function waStartTimer() {
    if (waTimerStarted || waDismissed || !waFabVisible()) return;
    waTimerStarted = true;
    setTimeout(function () { waReady = true; waSyncTeaser(); }, WA_TEASER_DELAY);
  }
  function waOpen() {
    if (waDismissed || !waFabVisible()) return;
    waReady = true;
    waHideTeaser();
    waWidget.classList.add('is-open');
    waBuildChat();
  }
  function waBackToTeaser() {
    waWidget.classList.remove('is-open');
    waPinned = false;
    waSyncTeaser();
  }
  function waDismiss() {
    waDismissed = true; waPinned = false;
    waWidget.classList.remove('is-open');
    waHideTeaser();
  }
  function waScheduleClose() {
    clearTimeout(waCloseT);
    waCloseT = setTimeout(function () {
      if (!waOverFab && !waOverPanel && !waPinned) waBackToTeaser();
    }, 260);
  }

  var waCloseBtn = document.getElementById('waClose');
  if (waCloseBtn) waCloseBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waDismiss(); });
  if (waTeaserOpen) waTeaserOpen.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waPinned = true; waOpen(); });
  if (waTeaserClose) waTeaserClose.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waDismiss(); });

  if (waCanHover) {
    if (waFab) {
      waFab.addEventListener('pointerenter', function () { waOverFab = true; clearTimeout(waCloseT); waOpen(); });
      waFab.addEventListener('pointerleave', function () { waOverFab = false; waScheduleClose(); });
    }
    waWidget.addEventListener('pointerenter', function () { waOverPanel = true; clearTimeout(waCloseT); });
    waWidget.addEventListener('pointerleave', function () { waOverPanel = false; waScheduleClose(); });
    document.addEventListener('click', function (e) {
      if (!waChatOpen()) return;
      if (waWidget.contains(e.target) || (waFab && waFab.contains(e.target)) || (waTeaser && waTeaser.contains(e.target))) return;
      waBackToTeaser();
    });
  }

  window.addEventListener('scroll', function () { waStartTimer(); waSyncTeaser(); }, { passive: true });
  waStartTimer();
  waSyncTeaser();
}
```

---

## 8. Integração — passo a passo

1. Cole o **HTML** (§5) antes de `</body>`, ajustando o número `wa.me` (todos os pontos) e o texto pré-preenchido.
2. Cole o **CSS** (§6) no `styles.css`. Se quiser customizar cor, defina `--wa-*` no `:root` (§4).
3. Cole o **JS** (§7b) dentro do IIFE do `main.js`. Garanta que a visibilidade do FAB (§7a) existe (reuse o bloco da sticky bar se já houver).
4. Confirme que a página tem `#faqList` no contrato esperado (§3). Sem FAQ, preencha `data-faqs` (§5).
5. **Bump do `?v=N`** no `index.html` para `styles.css` e `main.js` (cache busting — regra crítica).
6. Sirva por HTTP (`python -m http.server 9123`) e teste:
   - Desktop ≥768px: role além de ~55% da hero → FAB verde sobe; após 10s aparece o teaser; hover no FAB abre o chat; clicar numa pergunta responde e some o chip; "X" dispensa.
   - Mobile <768px: FAB verde + sticky bar; **sem** chat/teaser; tocar no FAB vai pro WhatsApp.
   - `prefers-reduced-motion`: sem indicador de digitação, bolhas aparecem direto.

---

## 9. Customização por cliente

- **Cor do FAB:** default verde. Para monocromático (como o Arilton), `:root{ --wa-accent: var(--ink, #181818); }`.
- **Mensagens:** edite `data-msg1/2/3` (boas-vindas, sorteadas), `data-end` (fim das perguntas) e o texto do `#waTeaserOpen` (teaser).
- **Delay do teaser:** `data-teaser-delay` em ms (default 10000).
- **Número/CTA:** atualize os dois `wa.me` (FAB e CTA do painel).
- **Visual do chat:** sobrescreva os `--wa-*` (§4) para alinhar com a paleta do cliente.

> Nota de consistência: o `design.md` do Arilton descreve o FAB como verde, mas a implementação atual do site roda em `--ink` (decisão minimalista). O **default deste template é verde** (padrão da agência). Trocar o site do Arilton para verde NÃO faz parte deste template — exige editar o `styles.css` do projeto e bumpar o `?v=N`.

---

## 10. Gotchas

1. **GSAP nunca em transform do FAB.** `yoyo:true/repeat:-1` captura o `translateY(120%)` inicial e trava o FAB deslocado. CSS controla 100% do transform.
2. **Comentários CSS em ASCII puro, uma linha.** Acento/em-dash/backtick podem quebrar o parser silenciosamente (descartam as regras seguintes).
3. **`data-faqs` usa aspas simples no atributo.** O JSON interno usa aspas duplas; inverter quebra o parse (e o `try/catch` só faz o chat degradar pra saudação + CTA).
4. **Chat é hover-only (desktop).** Não há trigger de toque — é intencional. No mobile o FAB navega direto.
5. **Teaser depende do FAB visível.** Se a hero for muito curta ou o FAB não receber `.is-visible`, o teaser nunca dispara. Confira o §7a (trigger de scroll).
6. **Duas mensagens diferentes.** Teaser (HTML, fixo) ≠ boas-vindas do chat (`data-msg*`, sorteadas). Não confunda na hora de editar a copy.
7. **`bottom:120px` do widget/teaser** pressupõe FAB no `bottom:36px` com 68px no desktop. Se mudar o tamanho/posição do FAB, ajuste o `bottom` do widget e do teaser juntos.

---

## 11. Origem

Extraído de **Arilton Silva Advocacia**:
- HTML: `index.html` (bloco FAB + `#waWidget` + `#waTeaser`)
- CSS: `assets/css/styles.css` (`.wa-ico`, `#whatsappFab`, `.wa-*`)
- JS: `assets/js/main.js` (bloco "WhatsApp mini-FAQ chat")

Mudanças do template vs. original: FAB **verde por default** (original do Arilton em `--ink`), tokens **`--wa-*` com fallback**, `data-teaser-delay` configurável e **fallback `data-faqs`** para páginas sem FAQ.
