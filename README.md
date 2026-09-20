# Tríduo Pascal

O texto das celebrações do Tríduo Pascal (Quinta-feira Santa, Sexta-feira Santa e Vigília Pascal)
em latim e português, **um elemento da celebração por página**, na ordem em que acontece —
com as partituras e os áudios de ensaio do coral.

No ar: **https://gereneto.github.io/triduo-pascal/**

## Como funciona

Site estático puro: HTML, CSS e um arquivo de JavaScript. Sem build, sem dependências.

```
index.html          página única; carrega os dados
css/estilo.css      toda a aparência (tema claro e escuro)
js/app.js           roteador e renderização
dados/quinta.js     os elementos de cada celebração (texto, rubricas, partituras, cantos)
dados/sexta.js
dados/vigilia.js
dados/audios.js     cantos com áudio: tom, primeira nota, versos
img/                recortes das partituras do livreto
audio/              mp3 de ensaio: inteira.mp3 e um arquivo por verso (estrofe-verso.mp3)
```

Rotas com `#`: `#/quinta`, `#/quinta/12`, `#/cantos`. Setas ← → do teclado ou deslizar o dedo
passam ao elemento anterior/seguinte; o botão **LA·PT** alterna latim, português ou os dois;
o site lembra onde você parou.

## De onde vem o conteúdo

Tudo em `dados/`, `img/` e `audio/` é **gerado** pela pasta de trabalho (fora deste repositório):

```
python ensaio/site_dados.py    # livreto (PDF) → dados/*.js + img/
python ensaio/gerar.py         # partituras GABC → audio/ + dados/audios.js
```

Não edite esses arquivos à mão: corrija na origem e gere de novo.

## Publicar uma alteração

```bash
git add -A
git commit -m "o que mudou"
git push
```

O GitHub Pages republica sozinho depois do push.

## Ver antes de publicar

```bash
python -m http.server 4173
```

E abrir http://localhost:4173
