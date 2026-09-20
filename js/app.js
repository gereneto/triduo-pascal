/* ---------------------------------------------------------------
   Tríduo Pascal — aplicação de leitura
   Um elemento da celebração por página, navegando de um ao outro.

   Rotas (usam # para funcionar em qualquer hospedagem estática):
     #/                     capa
     #/<celebracao>         índice da celebração (quinta, sexta, vigilia)
     #/<celebracao>/<n>     um elemento
     #/cantos               todos os cantos, com os áudios de ensaio
   --------------------------------------------------------------- */

(function () {
  'use strict';

  var celebracoes = [];

  /* API usada pelos arquivos de dados (carregados depois deste script) */
  window.TRIDUO = {
    celebracao: function (c) { celebracoes.push(c); }
  };

  var CHAVE_TEMA = 'triduo:tema';
  var CHAVE_LINGUA = 'triduo:lingua';
  var CHAVE_POS = 'triduo:ultimaLeitura';
  var LINGUAS = ['ambas', 'la', 'pt'];
  var ROTULO_LINGUA = { ambas: 'LA·PT', la: 'LA', pt: 'PT' };

  /* ----------------------------- utilidades ----------------------------- */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function guardar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* modo privado */ }
  }
  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }

  function achar(id) {
    for (var i = 0; i < celebracoes.length; i++) if (celebracoes[i].id === id) return celebracoes[i];
    return null;
  }

  function audioDe(chave) {
    return (window.AUDIOS || {})[chave] || null;
  }

  /* Sequência linear de todos os elementos do Tríduo, para o "seguinte" */
  function sequencia() {
    var seq = [];
    celebracoes.forEach(function (c) {
      c.elementos.forEach(function (e) { seq.push({ cel: c, el: e }); });
    });
    return seq;
  }

  /* ----------------------------- blocos ----------------------------- */

  function paragrafos(lista) {
    return lista.map(function (h) { return '<p>' + h + '</p>'; }).join('');
  }

  function bloco(b) {
    if (b.t === 'img') {
      return '<figure class="partitura"><img loading="lazy" src="' + b.src + '" width="' + b.w +
        '" height="' + b.h + '" alt="Partitura"></figure>';
    }
    if (b.t === 'rub') return '<div class="bloco rubrica estreito">' + paragrafos(b.h) + '</div>';
    if (b.t === 'txt') return '<div class="bloco estreito">' + paragrafos(b.h) + '</div>';
    if (b.t === 'par') {
      var soUm = !b.la.length || !b.pt.length;
      return '<div class="bloco par' + (soUm ? ' so-um estreito' : '') + '">' +
        '<div class="la' + (soUm ? ' unica' : '') + '" lang="la">' + paragrafos(b.la) + '</div>' +
        '<div class="pt' + (soUm ? ' unica' : '') + '">' + paragrafos(b.pt) + '</div></div>';
    }
    return '';
  }

  function tomEmPalavras(a) {
    var t = a.tons.map(function (x) { return (x > 0 ? '+' : '') + x; }).join(', ');
    var origem = { '2024': 'tom de 2024', calc: 'tom calculado pela tessitura', grupo: 'tom do canto com que faz par' }[a.origem] || '';
    return '1ª nota ' + a.primeira + ' · final ' + a.final + ' · ' + t + ' semitons · ' + origem;
  }

  function caixaDeCanto(chave) {
    var a = audioDe(chave);
    if (!a) return '';
    var html = '<section class="canto estreito"><h3>Áudio de ensaio</h3>' +
      '<p class="nome">' + esc(a.titulo) + '</p>' +
      '<p class="tom">' + esc(tomEmPalavras(a)) + (a.obs ? ' · ' + esc(a.obs) : '') + '</p>' +
      '<audio controls preload="none" src="' + a.pasta + '/inteira.mp3"></audio>';
    if (a.versos.length > 1) {
      html += '<details open><summary>Verso por verso (' + a.versos.length + ')</summary><ol class="versos">';
      a.versos.forEach(function (v) {
        html += '<li><button type="button" data-som="' + a.pasta + '/' + v.e + '-' + v.v + '.mp3">' +
          '<span class="sinal">▶</span><span class="numero">' + v.e + '-' + v.v + '</span>' +
          '<span class="letra" lang="la">' + esc(v.texto) + '</span></button></li>';
      });
      html += '</ol><label class="repetir"><input type="checkbox" class="em-laco"> repetir o verso até eu parar</label></details>';
    }
    return html + '</section>';
  }

  /* ----------------------------- páginas ----------------------------- */

  function paginaCapa() {
    var html = '<div class="folha capa">' +
      '<h1>Tríduo Pascal</h1>' +
      '<p class="subtitulo">Latim e português · texto, partituras e ensaio</p>' +
      '<blockquote class="epigrafe">Nos autem gloriári opórtet in cruce Dómini nostri Iesu Christi.' +
      '<cite>Antífona de entrada da Quinta-feira Santa</cite></blockquote>' +
      '</div><div class="folha">';

    var ult = retomada();
    if (ult) {
      html += '<a class="retomar" href="#/' + ult.rota + '">' +
        '<span class="rot">Continuar de onde parei</span>' +
        '<span class="alvo">' + esc(ult.rotulo) + '</span></a>';
    }

    html += '<p class="secao-titulo">Celebrações</p>';
    celebracoes.forEach(function (c) {
      var cantos = c.elementos.reduce(function (n, e) { return n + e.cantos.length; }, 0);
      html += '<a class="cartao" href="#/' + c.id + '">' +
        '<p class="autor">' + esc(c.dia) + '</p>' +
        '<h2>' + esc(c.titulo) + '</h2>' +
        '<p class="meta">' + c.elementos.length + ' elementos · ' + cantos + ' cantos com áudio</p></a>';
    });

    html += '<p class="secao-titulo">Coral</p>' +
      '<a class="cartao" href="#/cantos"><p class="autor">Ensaio</p><h2>Todos os cantos</h2>' +
      '<p>A melodia inteira e verso por verso, no tom do coral.</p></a>' +
      '<div class="ornamento">✠</div></div>';
    return { html: html, titulo: 'Tríduo Pascal', trilha: [] };
  }

  function paginaCelebracao(id) {
    var c = achar(id);
    if (!c) return paginaErro();

    var html = '<div class="folha"><div class="cabeca">' +
      '<p class="ordinal">' + esc(c.dia) + '</p>' +
      '<h1>' + esc(c.titulo) + '</h1>' +
      '<p class="sob">' + c.elementos.length + ' elementos, na ordem da celebração</p></div>' +
      '<div class="acoes"><a href="#/' + c.id + '/1">Começar do início →</a></div>';

    var parte = null;
    c.elementos.forEach(function (e) {
      if (e.parte !== parte) {
        if (parte !== null) html += '</ol>';
        html += '<p class="secao-titulo">' + esc(e.parte || 'Abertura') + '</p><ol class="itens">';
        parte = e.parte;
      }
      var nomes = e.cantos.map(function (k) { var a = audioDe(k); return a ? a.titulo : ''; }).filter(Boolean);
      html += '<li><a href="#/' + c.id + '/' + e.n + '">' +
        '<span class="num">' + e.n + '</span>' +
        '<span class="nome">' + esc(e.titulo) +
        (nomes.length && nomes.join(', ') !== e.titulo ? '<small>' + esc(nomes.join(' · ')) + '</small>' : '') + '</span>' +
        '<span class="nota">' + (e.cantos.length ? '♪' : '') + '</span></a></li>';
    });
    html += '</ol></div>';

    return { html: html, titulo: c.titulo + ' — Tríduo Pascal', trilha: [{ rotulo: c.dia, href: '#/' + c.id }] };
  }

  function paginaElemento(id, n) {
    var c = achar(id);
    if (!c) return paginaErro();
    var e = c.elementos[n - 1];
    if (!e) return paginaErro();

    var largo = e.blocos.some(function (b) { return b.t === 'par' && b.la.length && b.pt.length; });
    var html = '<article class="' + (largo ? 'folha-larga' : 'folha') + ' elemento">' +
      '<div class="el-cab estreito"><a href="#/' + c.id + '">' + esc(e.parte || c.dia) + '</a>' +
      '<span>' + e.n + ' de ' + c.elementos.length + '</span></div>' +
      '<div class="estreito"><h1>' + esc(e.titulo) + '</h1>' +
      (e.ref ? '<p class="ref">' + esc(e.ref) + '</p>' : '') + '</div>';

    /* a caixa de áudio entra logo depois da primeira partitura do canto; se não houver, no começo */
    var caixas = e.cantos.map(caixaDeCanto).join('');
    var posta = false;
    e.blocos.forEach(function (b, i) {
      html += bloco(b);
      var seguinteEhImagem = e.blocos[i + 1] && e.blocos[i + 1].t === 'img';
      if (!posta && caixas && b.t === 'img' && !seguinteEhImagem) { html += caixas; posta = true; }
    });
    if (!posta) html += caixas;

    var seq = sequencia();
    var pos = -1;
    for (var i = 0; i < seq.length; i++) if (seq[i].cel === c && seq[i].el === e) pos = i;
    var ant = pos > 0 ? seq[pos - 1] : null;
    var pro = pos < seq.length - 1 ? seq[pos + 1] : null;

    function rotulo(x) { return (x.cel === c ? '' : x.cel.dia + ' · ') + x.el.titulo; }

    html += '<nav class="navegacao">';
    html += ant
      ? '<a href="#/' + ant.cel.id + '/' + ant.el.n + '"><span class="rotulo">‹ Anterior</span>' + esc(rotulo(ant)) + '</a>'
      : '<a href="#/' + c.id + '"><span class="rotulo">‹ Anterior</span>Índice</a>';
    html += pro
      ? '<a class="dir" href="#/' + pro.cel.id + '/' + pro.el.n + '"><span class="rotulo">Seguinte ›</span>' + esc(rotulo(pro)) + '</a>'
      : '<a class="dir" href="#/"><span class="rotulo">Fim do Tríduo</span>Voltar à capa</a>';
    html += '</nav><p class="dica-teclado">Use as setas ← → do teclado, ou deslize o dedo.</p></article>';

    return {
      html: html,
      titulo: e.titulo + ' — ' + c.dia,
      trilha: [{ rotulo: c.dia, href: '#/' + c.id }, { rotulo: e.titulo, href: null }],
      progresso: e.n / c.elementos.length,
      memoria: { rota: c.id + '/' + e.n, rotulo: c.dia + ' · ' + e.titulo }
    };
  }

  function paginaCantos() {
    var html = '<div class="folha"><div class="cabeca"><p class="ordinal">Coral</p>' +
      '<h1>Cantos para ensaiar</h1>' +
      '<p class="sob">Melodias sintetizadas a partir das partituras, no tom do coral (faixa Sol2–Dó4)</p></div>';
    celebracoes.forEach(function (c) {
      html += '<p class="secao-titulo">' + esc(c.dia) + '</p><ol class="itens">';
      c.elementos.forEach(function (e) {
        e.cantos.forEach(function (k) {
          var a = audioDe(k);
          if (!a) return;
          html += '<li><a href="#/' + c.id + '/' + e.n + '"><span class="num">' + e.n + '</span>' +
            '<span class="nome">' + esc(a.titulo) + '<small>' + esc(e.titulo) + ' · 1ª nota ' + esc(a.primeira) +
            '</small></span><span class="nota">♪</span></a></li>';
        });
      });
      html += '</ol>';
    });
    html += '</div>';
    return { html: html, titulo: 'Cantos — Tríduo Pascal', trilha: [{ rotulo: 'Cantos', href: '#/cantos' }] };
  }

  function paginaErro() {
    return {
      html: '<div class="folha capa"><h1>Página não encontrada</h1>' +
        '<p class="subtitulo">O texto pedido não existe</p>' +
        '<p><a href="#/">Voltar à capa</a></p></div>',
      titulo: 'Não encontrado — Tríduo Pascal',
      trilha: []
    };
  }

  /* ----------------------------- memória de leitura ----------------------------- */

  function retomada() {
    var bruto = ler(CHAVE_POS);
    if (!bruto) return null;
    try {
      var o = JSON.parse(bruto);
      return (o && o.rota && o.rotulo) ? o : null;
    } catch (e) { return null; }
  }

  /* ----------------------------- roteador ----------------------------- */

  function partes() {
    var h = location.hash.replace(/^#\/?/, '');
    return h.split('/').filter(function (x) { return x !== ''; }).map(decodeURIComponent);
  }

  function despachar() {
    pararSom();
    var p = partes();
    var pag;

    if (p.length === 0) pag = paginaCapa();
    else if (p[0] === 'cantos') pag = paginaCantos();
    else if (p[1]) pag = paginaElemento(p[0], parseInt(p[1], 10));
    else pag = paginaCelebracao(p[0]);

    var app = document.getElementById('app');
    app.innerHTML = pag.html;
    document.title = pag.titulo;

    var trilha = document.getElementById('trilha');
    trilha.innerHTML = (pag.trilha || []).map(function (t, i) {
      var sep = i ? '<span class="sep">/</span>' : '';
      return sep + (t.href ? '<a href="' + t.href + '">' + esc(t.rotulo) + '</a>' : esc(t.rotulo));
    }).join('');

    var barra = document.getElementById('progresso');
    if (typeof pag.progresso === 'number') {
      barra.hidden = false;
      barra.firstElementChild.style.width = Math.round(pag.progresso * 100) + '%';
    } else {
      barra.hidden = true;
      barra.firstElementChild.style.width = '0%';
    }

    if (pag.memoria) guardar(CHAVE_POS, JSON.stringify(pag.memoria));

    window.scrollTo(0, 0);
    if (pag.memoria) app.focus({ preventScroll: true });
  }

  /* ----------------------------- som: um verso por vez ----------------------------- */

  var som = new Audio();
  var botaoAtivo = null;

  function pararSom() {
    som.pause();
    if (botaoAtivo) {
      botaoAtivo.classList.remove('tocando');
      botaoAtivo.querySelector('.sinal').textContent = '▶';
      botaoAtivo = null;
    }
  }

  som.addEventListener('ended', function () {
    var laco = botaoAtivo && botaoAtivo.closest('.canto').querySelector('.em-laco');
    if (laco && laco.checked) { som.currentTime = 0; som.play(); } else pararSom();
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-som]') : null;
    if (!b) return;
    var mesmo = b === botaoAtivo;
    pararSom();
    if (mesmo) return;
    document.querySelectorAll('audio').forEach(function (a) { a.pause(); });
    botaoAtivo = b;
    b.classList.add('tocando');
    b.querySelector('.sinal').textContent = '■';
    som.src = b.getAttribute('data-som');
    som.play();
  });

  document.addEventListener('play', function (e) {
    if (e.target !== som) pararSom();
  }, true);

  /* ----------------------------- teclado e toque ----------------------------- */

  function irPara(direcao) {
    var links = document.querySelectorAll('.navegacao a');
    if (!links.length) return;
    var alvo = direcao < 0 ? links[0] : links[links.length - 1];
    if (alvo && alvo.getAttribute('href')) location.hash = alvo.getAttribute('href').slice(1);
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var alvo = e.target.tagName;
    if (alvo === 'INPUT' || alvo === 'TEXTAREA' || alvo === 'AUDIO') return;
    if (e.key === 'ArrowLeft') irPara(-1);
    if (e.key === 'ArrowRight') irPara(1);
  });

  var toqueX = null, toqueY = null;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || (e.target.closest && e.target.closest('audio'))) { toqueX = null; return; }
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (toqueX === null) return;
    var dx = e.changedTouches[0].clientX - toqueX;
    var dy = e.changedTouches[0].clientY - toqueY;
    toqueX = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) irPara(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ----------------------------- tema e língua ----------------------------- */

  function aplicarTema(t) {
    if (t) document.documentElement.setAttribute('data-tema', t);
    else document.documentElement.removeAttribute('data-tema');
  }

  function alternarTema() {
    var atual = document.documentElement.getAttribute('data-tema');
    var escuroDoSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var novo;
    if (!atual) novo = escuroDoSistema ? 'claro' : 'escuro';
    else novo = atual === 'escuro' ? 'claro' : 'escuro';
    aplicarTema(novo);
    guardar(CHAVE_TEMA, novo);
  }

  function aplicarLingua(l) {
    if (LINGUAS.indexOf(l) < 0) l = 'ambas';
    document.documentElement.setAttribute('data-lingua', l);
    var botao = document.getElementById('lingua');
    if (botao) botao.textContent = ROTULO_LINGUA[l];
    return l;
  }

  function alternarLingua() {
    var atual = document.documentElement.getAttribute('data-lingua') || 'ambas';
    var novo = LINGUAS[(LINGUAS.indexOf(atual) + 1) % LINGUAS.length];
    guardar(CHAVE_LINGUA, aplicarLingua(novo));
  }

  /* ----------------------------- arranque ----------------------------- */

  aplicarTema(ler(CHAVE_TEMA));

  document.addEventListener('DOMContentLoaded', function () {
    aplicarTema(ler(CHAVE_TEMA));
    aplicarLingua(ler(CHAVE_LINGUA));
    document.getElementById('tema').addEventListener('click', alternarTema);
    document.getElementById('lingua').addEventListener('click', alternarLingua);
    window.addEventListener('hashchange', despachar);
    despachar();
  });
})();
