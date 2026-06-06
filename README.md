# Arilton Silva Advocacia — Landing Page

Landing page institucional do **Dr. Arilton de Almeida Silva** (OAB/SP 275.434), advogado com mais de 20 anos em **Direito do Trabalho**, atendimento 100% online em todo o Brasil.

Site estático de página única, focado em conversão via **WhatsApp**.

---

## 🧱 Tecnologias

- **HTML5 estático** — sem build, sem framework, sem `package.json`.
- **Tailwind CSS** via CDN com `tailwind.config` inline (no `<head>`).
- **CSS próprio** em [`assets/css/styles.css`](assets/css/styles.css).
- **JavaScript Vanilla** ([`assets/js/main.js`](assets/js/main.js) e [`assets/js/ascii-hero.js`](assets/js/ascii-hero.js)).
- **GSAP 3 + ScrollTrigger** via CDN (animações de entrada e cabeçalho).
- **Google Fonts** — Newsreader (display) + Inter (texto) + Material Symbols.

> ⚠️ **Não há etapa de build.** Os arquivos são servidos como estão.

---

## 📁 Estrutura de arquivos

```
.
├── index.html              # Página única (todo o conteúdo)
├── ascii-art.txt           # Arte ASCII do herói (carregada via fetch pelo JS)
├── assets/
│   ├── css/
│   │   └── styles.css      # Estilos próprios (mecânicas e tokens)
│   ├── js/
│   │   ├── main.js         # Header, menu, FAQ, reveals, chat WhatsApp
│   │   └── ascii-hero.js   # Render do ASCII no herói + glitch no cursor
│   └── images/
│       └── logo.png        # Emblema (Justiça) usado no rodapé
├── .gitignore
└── README.md
```

> 🔸 O `ascii-art.txt` **fica na raiz**, ao lado do `index.html` — o `ascii-hero.js` o carrega com `fetch('ascii-art.txt')` (caminho relativo). Se ele sumir ou mudar de pasta, o herói carrega sem a arte (degrada sem quebrar).

---

## 💻 Rodar localmente

Como o herói usa `fetch()` para carregar o `ascii-art.txt`, **abrir o `index.html` direto pelo `file://` não funciona** (o navegador bloqueia o fetch). É preciso servir por HTTP. Qualquer servidor estático resolve:

```bash
# Python 3 (já vem no Windows/macOS/Linux)
python -m http.server 9123

# depois abra:  http://localhost:9123
```

```bash
# Alternativas
npx serve .
php -S localhost:9123
```

---

## 📊 Tags do Google (Analytics / Tag Manager / Search Console)

O site é estático, então as tags são **coladas direto no [`index.html`](index.html)**. Escolha **um** dos caminhos de medição (GA4 **ou** GTM — não use os dois pra não duplicar eventos).

### Opção A — Google Analytics 4 (mais simples)

1. Crie a propriedade em <https://analytics.google.com> e copie o **ID de medição** (`G-XXXXXXXXXX`).
2. Cole o trecho abaixo **logo após a tag `<head>`** (linha 3 do `index.html`), o mais alto possível:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

3. Troque **os dois** `G-XXXXXXXXXX` pelo seu ID real.

### Opção B — Google Tag Manager (recomendado se for usar vários pixels)

1. Crie o contêiner em <https://tagmanager.google.com> e copie o ID (`GTM-XXXXXXX`).
2. Cole este bloco **logo após a tag `<head>`** (linha 3):

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

3. Cole este outro bloco **imediatamente após a tag `<body>`** (linha 53):

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

4. Troque **todos** os `GTM-XXXXXXX` pelo seu ID real.

### Verificação no Google Search Console

Para provar a propriedade do domínio em <https://search.google.com/search-console>:

- **Método meta tag (mais rápido):** copie a meta fornecida pelo Search Console e cole dentro do `<head>` (pode ser logo abaixo da `<meta name="description">`):

  ```html
  <meta name="google-site-verification" content="SEU_CODIGO_AQUI">
  ```

- **Método arquivo HTML:** baixe o arquivo `googleXXXXXXXX.html` que o Search Console oferece e **suba na raiz do `public_html`** (mesmo nível do `index.html`). Funciona muito bem em hospedagem estática como a Hostinger.

> 💡 Depois de medir, marque os links de WhatsApp como evento de conversão no GA4/GTM — todos os CTAs apontam para `https://wa.me/5511950172265`.

---

## 🚀 Deploy na Hostinger

O site é estático: **deploy = subir os arquivos para a pasta `public_html`**. Sem Node, sem build, sem comando de deploy.

### O que subir

Suba para a **raiz do `public_html`**, preservando a estrutura:

```
public_html/
├── index.html
├── ascii-art.txt
└── assets/
    ├── css/styles.css
    ├── js/main.js
    ├── js/ascii-hero.js
    └── images/logo.png
```

> ⚠️ Mantenha o `ascii-art.txt` **no mesmo nível** do `index.html` e a pasta `assets/` com a mesma estrutura — os caminhos no HTML são relativos.

### Método 1 — Gerenciador de Arquivos (hPanel)

1. Entre no **hPanel** → **Sites** → selecione o domínio → **Gerenciador de Arquivos**.
2. Abra a pasta **`public_html`** (se houver arquivos de exemplo como `default.php`, apague-os).
3. Clique em **Enviar arquivos** e suba o `index.html`, o `ascii-art.txt` e a pasta `assets/` inteira (dá para arrastar a pasta, ou subir um `.zip` e usar **Extrair**).
4. Confirme que a árvore ficou igual ao bloco acima.

### Método 2 — FTP (FileZilla)

1. No hPanel: **Arquivos** → **Contas FTP** → copie **host, usuário e senha** (ou crie uma conta FTP).
2. No FileZilla, conecte com esses dados (porta 21).
3. Entre em **`public_html`** e envie `index.html`, `ascii-art.txt` e `assets/`.

### Método 3 — Deploy via Git (se o plano oferecer)

Alguns planos da Hostinger têm **hPanel → Avançado → Git**. É possível conectar este repositório (`https://github.com/Copyzin/Arilton-ADV.git`) e fazer deploy/pull para o `public_html`. Como não há build, o conteúdo do repo já é o conteúdo final do site.

### Domínio e HTTPS

1. Aponte o domínio para a Hostinger (se registrado em outro lugar, ajuste os **nameservers** ou um registro **A** para o IP do hPanel).
2. No hPanel: **Segurança → SSL** → garanta o certificado ativo no domínio.
3. Ative **Forçar HTTPS** para redirecionar `http → https`.

### Conferência pós-deploy (checklist)

- [ ] A página abre no domínio com HTTPS (cadeado).
- [ ] O **herói em ASCII** aparece (sinal de que o `ascii-art.txt` subiu certo).
- [ ] Os botões **"Fale conosco"** abrem o WhatsApp `(11) 95017-2265`.
- [ ] No mobile: **FAB** e **barra fixa** de WhatsApp aparecem; menu hambúrguer abre.
- [ ] Rodapé com o crédito **Almeida Escala Digital**.

---

## 🔄 Manutenção — cache busting (IMPORTANTE)

Sempre que **alterar o CSS ou o JS**, incremente o `?v=N` no `index.html`. Sem isso, o navegador do visitante continua servindo a versão antiga do cache.

No `index.html`:

```html
<link rel="stylesheet" href="assets/css/styles.css?v=16">   <!-- vire ?v=17, 18... -->
<script src="assets/js/main.js?v=7" defer></script>          <!-- idem -->
<script src="assets/js/ascii-hero.js?v=4" defer></script>    <!-- idem -->
```

Depois de subir, teste numa **aba anônima** ou com **Ctrl + Shift + R** (hard refresh) para confirmar que pegou a versão nova.

---

## 📞 Contato (cliente)

- **WhatsApp:** [(11) 95017-2265](https://wa.me/5511950172265)
- **E-mail:** arilton11@yahoo.com.br
- **Instagram:** [@ariltonalmeidaadvogado](https://www.instagram.com/ariltonalmeidaadvogado/)
- **Atendimento:** 100% online, em todo o Brasil.

---

Site desenvolvido por **[Almeida Escala Digital](https://almeidaescaladigital.com/)**. Todos os direitos reservados.
