
//  CONFIGURAÇÕES

const TAMANHO = 10;
const LETRAS = ["", "A","B","C","D","E","F","G","H","I","J"];

const NAVIOS = [
  { id: 1, tamanho: 5 },
  { id: 2, tamanho: 4 },
  { id: 3, tamanho: 3 },
  { id: 4, tamanho: 3 },
  { id: 5, tamanho: 2 }
];

const ia = {
  modo: "busca", 
  alvos: [] 
};


let turnoAtual = "jogador";


//   FÁBRICA DE ESTADO

function criarEstadoTabuleiro() {
  return {
    dados: Array.from({ length: TAMANHO }, () =>
      Array.from({ length: TAMANHO }, () => ({
        navio: null,
        atingido: false
      }))
    ),
    estadoNavios: {},
    encerrado: false
  };
}

function inicializarEstadoNavios(estado) {
  NAVIOS.forEach(navio => {
    estado.estadoNavios[navio.id] = {
      tamanho: navio.tamanho,
      acertos: 0,
      afundado: false
    };
  });
}

//   NAVIOS

function podeColocarNavio(estado, linha, coluna, tamanho, direcao) {
  for (let i = 0; i < tamanho; i++) {
    const l = direcao === "horizontal" ? linha : linha + i;
    const c = direcao === "horizontal" ? coluna + i : coluna;

    if (l >= TAMANHO || c >= TAMANHO) return false;
    if (estado.dados[l][c].navio !== null) return false;
  }
  return true;
}

function colocarNavio(estado, linha, coluna, navio) {
  const direcao = Math.random() < 0.5 ? "horizontal" : "vertical";

  if (!podeColocarNavio(estado, linha, coluna, navio.tamanho, direcao)) {
    return false;
  }

  for (let i = 0; i < navio.tamanho; i++) {
    const l = direcao === "horizontal" ? linha : linha + i;
    const c = direcao === "horizontal" ? coluna + i : coluna;

    estado.dados[l][c].navio = navio.id;
  }

  return true;
}

function gerarNavios(estado) {
  NAVIOS.forEach(navio => {
    let colocado = false;

    while (!colocado) {
      const linha = Math.floor(Math.random() * TAMANHO);
      const coluna = Math.floor(Math.random() * TAMANHO);
      colocado = colocarNavio(estado, linha, coluna, navio);
    }
  });
}


 //  TABULEIRO VISUAL

function criarTabuleiroVisual(containerId, clicavel, estado) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  for (let linha = 0; linha <= TAMANHO; linha++) {
    for (let coluna = 0; coluna <= TAMANHO; coluna++) {
      const celula = document.createElement("div");
      celula.classList.add("celula");

      if (linha === 0 && coluna === 0) {
        celula.classList.add("label");
      }
      else if (linha === 0) {
        celula.classList.add("label");
        celula.textContent = LETRAS[coluna];
      }
      else if (coluna === 0) {
        celula.classList.add("label");
        celula.textContent = linha;
      }
      else {
        celula.dataset.linha = linha - 1;
        celula.dataset.coluna = coluna - 1;

        if (clicavel) {
          celula.addEventListener("click", () => {
            dispararNoEstado(estado, celula, "jogador");
          });
        }
      }

      container.appendChild(celula);
    }
  }
}


 //  JOGO

function verificarVitoria(estado) {
  return Object.values(estado.estadoNavios)
    .every(navio => navio.afundado);
}

function dispararNoEstado(estado, elemento, atacante) {
  if (estado.encerrado) return;
  if (turnoAtual !== atacante) return;

  const linha = Number(elemento.dataset.linha);
  const coluna = Number(elemento.dataset.coluna);
  const celula = estado.dados[linha][coluna];

  if (celula.atingido) return;

  celula.atingido = true;
  let acertou = false;

  if (celula.navio) {
    elemento.classList.add("acerto");
    acertou = true;

    const navio = estado.estadoNavios[celula.navio];
    navio.acertos++;

    if (navio.acertos === navio.tamanho) {
    navio.afundado = true;
    marcarNavioAfundado(estado, celula.navio, "tabuleiro-inimigo");
    }


    if (verificarVitoria(estado)) {
      estado.encerrado = true;
      mostrarVitoria(atacante);
      return;
    }
  } else {
    elemento.classList.add("erro");
  }

  if (!acertou) {
  trocarTurno();
} else if (atacante === "inimigo") {
  setTimeout(turnoInimigo, 800);
}

}


function trocarTurno() {
  turnoAtual = turnoAtual === "jogador" ? "inimigo" : "jogador";
  atualizarIndicadorTurno();

  if (turnoAtual === "inimigo") {
    setTimeout(turnoInimigo, 800);
  }
}

function turnoInimigo() {
  if (jogador.encerrado) return;

  let linha, coluna;

  
  if (ia.modo === "ataque" && ia.alvos.length > 0) {
    const alvo = ia.alvos.shift();
    linha = alvo.l;
    coluna = alvo.c;
  }

  else {
    ia.modo = "busca";

    do {
      linha = Math.floor(Math.random() * TAMANHO);
      coluna = Math.floor(Math.random() * TAMANHO);
    } while (jogador.dados[linha][coluna].atingido);
  }

  const tabuleiroJogador = document.getElementById("tabuleiro-jogador");
  const celulaDOM = [...tabuleiroJogador.querySelectorAll(".celula")]
    .find(c =>
      c.dataset.linha == linha &&
      c.dataset.coluna == coluna
    );

  const resultado = dispararIA(jogador, celulaDOM);

  if (resultado === "acerto") {
    ia.modo = "ataque";
    ia.alvos.push(...obterVizinhos(linha, coluna));
  }
}

function dispararIA(estado, elemento) {
  if (estado.encerrado) return;

  const linha = Number(elemento.dataset.linha);
  const coluna = Number(elemento.dataset.coluna);
  const celula = estado.dados[linha][coluna];

  celula.atingido = true;

  if (celula.navio) {
    elemento.classList.add("acerto");

    const navio = estado.estadoNavios[celula.navio];
    navio.acertos++;

    if (navio.acertos === navio.tamanho) {
    navio.afundado = true;
      ia.modo = "busca";
      ia.alvos = [];
      marcarNavioAfundado(estado, celula.navio, "tabuleiro-jogador");
    }

    if (verificarVitoria(estado)) {
      estado.encerrado = true;
      mostrarVitoria("inimigo");
      return "fim";
    }

    setTimeout(turnoInimigo, 700);
    return "acerto";
  }

  elemento.classList.add("erro");
  trocarTurno();
  return "erro";
}


function obterVizinhos(linha, coluna) {
  return [
    { l: linha - 1, c: coluna },
    { l: linha + 1, c: coluna },
    { l: linha, c: coluna - 1 },
    { l: linha, c: coluna + 1 }
  ].filter(pos =>
    pos.l >= 0 &&
    pos.l < TAMANHO &&
    pos.c >= 0 &&
    pos.c < TAMANHO &&
    !jogador.dados[pos.l][pos.c].atingido
  );
}


  // UI  

function mostrarVitoria(vencedor) {
  const msg = document.createElement("div");
  msg.id = "mensagem-vitoria";

  msg.textContent = 
    vencedor === "jogador"
      ? "Vitória! Todos os navios inimigos foram afundados."
      : "Derrota! Todos os seus navios foram afundados.";

  document.body.appendChild(msg);
}

function atualizarIndicadorTurno() {
  const indicador = document.getElementById("turno-indicador");

  if (turnoAtual === "jogador") {
    indicador.textContent = "Sua vez";
    indicador.className = "turno jogador";
  } else {
    indicador.textContent = "Vez do inimigo";
    indicador.className = "turno inimigo";
  }
}

function reiniciarJogo() {
  const msg = document.getElementById("mensagem-vitoria");
  if (msg) msg.remove();

  turnoAtual = "jogador";
  atualizarIndicadorTurno();

  ia.modo = "busca";
  ia.alvos = [];

  Object.assign(jogador, criarEstadoTabuleiro());
  Object.assign(inimigo, criarEstadoTabuleiro());

  inicializarEstadoNavios(jogador);
  inicializarEstadoNavios(inimigo);

  gerarNavios(jogador);
  gerarNavios(inimigo);

  criarTabuleiroVisual("tabuleiro-jogador", false, jogador);
  criarTabuleiroVisual("tabuleiro-inimigo", true, inimigo);
}

function marcarNavioAfundado(estado, navioId, containerId) {
  const container = document.getElementById(containerId);

  container.querySelectorAll(".celula").forEach(celulaDOM => {
    const l = celulaDOM.dataset.linha;
    const c = celulaDOM.dataset.coluna;

    if (l !== undefined) {
      const celula = estado.dados[l][c];

      if (celula.navio === navioId) {
        celulaDOM.classList.remove("acerto");
        celulaDOM.classList.add("afundado");
      }
    }
  });
}





 //  INICIALIZAÇÃO

const jogador = criarEstadoTabuleiro();
const inimigo = criarEstadoTabuleiro();


inicializarEstadoNavios(jogador);
inicializarEstadoNavios(inimigo);

gerarNavios(jogador);
gerarNavios(inimigo);

criarTabuleiroVisual("tabuleiro-jogador", false, jogador);
criarTabuleiroVisual("tabuleiro-inimigo", true, inimigo);
atualizarIndicadorTurno();

document
  .getElementById("btn-reiniciar")
  .addEventListener("click", reiniciarJogo);