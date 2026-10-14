const elementos = {
  cidade: document.getElementById('selectCidade'),
  atualizar: document.getElementById('botaoAtualizar'),
  movDataInicio: document.getElementById('movDataInicio'),
  movDataFim: document.getElementById('movDataFim'),
  status: document.getElementById('statusDashboard'),
  cadGraficoCidade: document.getElementById('cadGraficoCidade'),
  cadDataInicio: document.getElementById('cadDataInicio'),
  cadDataFim: document.getElementById('cadDataFim'),
  filtrarCadastros: document.getElementById('botaoFiltrarCadastros'),
  statusCadastros: document.getElementById('statusCadastros'),
  saidas: document.getElementById('kpiSaidas'),
  entradas: document.getElementById('kpiEntradas'),
  saldo: document.getElementById('kpiSaldo'),
  abrirCadastroCarro: document.getElementById('abrirCadastroCarro'),
  abrirMovimentacao: document.getElementById('abrirMovimentacao'),
  modalCadastroCarro: document.getElementById('modalCadastroCarro'),
  modalMovimentacao: document.getElementById('modalMovimentacao'),
  formCadastroCarro: document.getElementById('formCadastroCarro'),
  cadCidade: document.getElementById('cadCidade'),
  cadModelo: document.getElementById('cadModelo'),
  cadQuantidade: document.getElementById('cadQuantidade'),
  botaoCadastrarCarro: document.getElementById('botaoCadastrarCarro'),
  statusCadastroCarro: document.getElementById('statusCadastroCarro'),
  formMovimentacao: document.getElementById('formMovimentacao'),
  movCidade: document.getElementById('movCidade'),
  movCarro: document.getElementById('movCarro'),
  movQuantidade: document.getElementById('movQuantidade'),
  botaoCadastrar: document.getElementById('botaoCadastrar'),
  statusMovimentacao: document.getElementById('statusMovimentacao')
};

lucide.createIcons();

const koviCarShapePlugin = {
  id: 'koviCarShapePlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((bar, index) => {
        if (Number(dataset.data[index]) <= 0) return;

        const { x, y, width } = bar;
        const carWidth = Math.min(Math.max(width * 1.15, 24), 32);
        const carHeight = 13;
        const carX = x - carWidth / 2;
        const carY = y - carHeight - 6;

        ctx.save();
        ctx.fillStyle = dataset.backgroundColor;
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.moveTo(carX + 3, carY + carHeight / 2);
        ctx.lineTo(carX + 6, carY);
        ctx.lineTo(carX + carWidth - 6, carY);
        ctx.lineTo(carX + carWidth - 3, carY + carHeight / 2);
        ctx.lineTo(carX + carWidth, carY + carHeight / 2);
        ctx.lineTo(carX + carWidth, carY + carHeight - 2);
        ctx.lineTo(carX, carY + carHeight - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#181C24';
        ctx.beginPath();
        ctx.arc(carX + 5, carY + carHeight - 1, 2.2, 0, Math.PI * 2);
        ctx.arc(carX + carWidth - 5, carY + carHeight - 1, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
  }
};

const grafico = new Chart(document.getElementById('meuGrafico'), {
  type: 'bar',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Saídas (retiradas)',
        data: [],
        backgroundColor: '#FF2A6D',
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.6
      },
      {
        label: 'Entradas (devoluções)',
        data: [],
        backgroundColor: '#10B981',
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.6
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 24 } },
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { weight: 'bold' } } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: {
        grid: { color: '#2E3545' },
        ticks: { color: '#94a3b8', precision: 0 },
        beginAtZero: true
      }
    }
  },
  plugins: [koviCarShapePlugin]
});

const graficoCadastros = new Chart(document.getElementById('graficoCadastros'), {
  type: 'bar',
  data: { labels: [], datasets: [{
    label: 'Carros cadastrados', data: [], backgroundColor: '#10B981',
    borderRadius: { topLeft: 4, topRight: 4 }, barPercentage: 0.55
  }] },
  options: {
    responsive: true, maintainAspectRatio: false, layout: { padding: { top: 24 } },
    plugins: { legend: { labels: { color: '#94a3b8', font: { weight: 'bold' } } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#2E3545' }, ticks: { color: '#94a3b8', precision: 0 }, beginAtZero: true }
    }
  },
  plugins: [koviCarShapePlugin]
});

function dataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

const hoje = new Date();
const seisDiasAtras = new Date(hoje);
seisDiasAtras.setDate(hoje.getDate() - 6);
[elementos.movDataFim, elementos.cadDataFim].forEach((campo) => { campo.value = dataLocal(hoje); });
[elementos.movDataInicio, elementos.cadDataInicio].forEach((campo) => { campo.value = dataLocal(seisDiasAtras); });

function definirCarregamento(ativo) {
  elementos.atualizar.disabled = ativo;
  elementos.cidade.disabled = ativo;
  elementos.status.dataset.status = ativo ? 'carregando' : '';
  elementos.status.textContent = ativo ? 'Atualizando dados…' : '';
}

function atualizarDashboard(dados) {
  elementos.saidas.textContent = dados.totalSaidas ?? 0;
  elementos.entradas.textContent = dados.totalEntradas ?? 0;
  elementos.saldo.textContent = dados.saldoPatio ?? 0;

  grafico.data.labels = dados.grafico?.labels ?? [];
  grafico.data.datasets[0].data = dados.grafico?.saidas ?? [];
  grafico.data.datasets[1].data = dados.grafico?.entradas ?? [];
  grafico.update();
}

async function carregarModelos() {
  const resposta = await fetch('api/modelos.php', { headers: { Accept: 'application/json' } });
  const dados = await resposta.json();

  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar os modelos.');

  elementos.cadModelo.replaceChildren();
  dados.modelos.forEach((modelo) => {
    const opcao = document.createElement('option');
    opcao.value = modelo.id;
    opcao.textContent = modelo.nome;
    elementos.cadModelo.appendChild(opcao);
  });
}

const rotulos = {
  zero_km: 'Zero km', seminovo: 'Seminovo', ate_30: 'até 30 km',
  ate_50000: 'até 50 mil km', acima_100000: 'acima de 100 mil km',
  hatch: 'Hatch', sedan: 'Sedan', suv: 'SUV'
};

async function carregarCarros() {
  elementos.movCarro.disabled = true;
  elementos.movCarro.replaceChildren(new Option('Carregando carros…', ''));
  try {
    const cidade = encodeURIComponent(elementos.movCidade.value);
    const resposta = await fetch(`api/carros.php?cidade=${cidade}`, { headers: { Accept: 'application/json' } });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar os carros.');

    elementos.movCarro.replaceChildren();
    if (!dados.carros.length) {
      elementos.movCarro.appendChild(new Option('Nenhum carro cadastrado nessa região', ''));
      return;
    }
    dados.carros.forEach((carro) => {
      const descricao = `${carro.modelo} · ${rotulos[carro.condicao]} · ${rotulos[carro.faixaKm]} · ${rotulos[carro.categoria]} · saldo ${carro.saldo}`;
      elementos.movCarro.appendChild(new Option(descricao, carro.id));
    });
  } finally {
    elementos.movCarro.disabled = false;
  }
}

async function cadastrarCarros(evento) {
  evento.preventDefault();
  elementos.botaoCadastrarCarro.disabled = true;
  elementos.statusCadastroCarro.dataset.status = 'carregando';
  elementos.statusCadastroCarro.textContent = 'Cadastrando carros…';
  const corpo = Object.fromEntries(new FormData(elementos.formCadastroCarro).entries());
  corpo.modeloId = Number(corpo.modeloId);
  corpo.quantidade = Number(corpo.quantidade);

  try {
    const resposta = await fetch('api/carros.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo)
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível cadastrar os carros.');
    elementos.statusCadastroCarro.dataset.status = 'sucesso';
    elementos.statusCadastroCarro.textContent = dados.mensagem;
    elementos.cadQuantidade.value = '1';
    elementos.cidade.value = corpo.cidade;
    elementos.cadGraficoCidade.value = corpo.cidade;
    await Promise.all([carregarDadosDoBackend(), carregarCadastros()]);
  } catch (erro) {
    elementos.statusCadastroCarro.dataset.status = 'erro';
    elementos.statusCadastroCarro.textContent = erro.message;
  } finally {
    elementos.botaoCadastrarCarro.disabled = false;
  }
}

async function cadastrarMovimentacao(evento) {
  evento.preventDefault();
  elementos.botaoCadastrar.disabled = true;
  elementos.statusMovimentacao.dataset.status = 'carregando';
  elementos.statusMovimentacao.textContent = 'Registrando movimentação…';

  const corpo = Object.fromEntries(new FormData(elementos.formMovimentacao).entries());
  corpo.quantidade = Number(corpo.quantidade);

  try {
    const resposta = await fetch('api/movimentacoes.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo)
    });
    const dados = await resposta.json();

    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível registrar a movimentação.');

    elementos.statusMovimentacao.dataset.status = 'sucesso';
    elementos.statusMovimentacao.textContent = dados.mensagem;
    elementos.movQuantidade.value = '1';
    elementos.cidade.value = corpo.cidade;
    await Promise.all([carregarDadosDoBackend(), carregarCarros()]);
  } catch (erro) {
    elementos.statusMovimentacao.dataset.status = 'erro';
    elementos.statusMovimentacao.textContent = erro.message;
  } finally {
    elementos.botaoCadastrar.disabled = false;
  }
}

async function carregarDadosDoBackend() {
  definirCarregamento(true);

  try {
    const cidade = encodeURIComponent(elementos.cidade.value);
    const parametros = new URLSearchParams({
      cidade: elementos.cidade.value,
      inicio: elementos.movDataInicio.value,
      fim: elementos.movDataFim.value
    });
    const resposta = await fetch(`api/dashboard.php?${parametros}`, {
      headers: { Accept: 'application/json' }
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Não foi possível consultar o dashboard.');
    }

    atualizarDashboard(dados);
    elementos.status.dataset.status = 'sucesso';
    elementos.status.textContent = `Atualizado em ${new Date().toLocaleTimeString('pt-BR')}.`;
  } catch (erro) {
    console.error('Falha na integração:', erro);
    elementos.status.dataset.status = 'erro';
    elementos.status.textContent = erro.message;
  } finally {
    elementos.atualizar.disabled = false;
    elementos.cidade.disabled = false;
  }
}

async function carregarCadastros() {
  elementos.filtrarCadastros.disabled = true;
  elementos.statusCadastros.dataset.status = 'carregando';
  elementos.statusCadastros.textContent = 'Atualizando dados…';
  try {
    const parametros = new URLSearchParams({
      cidade: elementos.cadGraficoCidade.value,
      inicio: elementos.cadDataInicio.value,
      fim: elementos.cadDataFim.value
    });
    const resposta = await fetch(`api/cadastros.php?${parametros}`, { headers: { Accept: 'application/json' } });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível consultar os cadastros.');
    graficoCadastros.data.labels = dados.grafico?.labels ?? [];
    graficoCadastros.data.datasets[0].data = dados.grafico?.quantidades ?? [];
    graficoCadastros.update();
    elementos.statusCadastros.dataset.status = 'sucesso';
    elementos.statusCadastros.textContent = `Atualizado em ${new Date().toLocaleTimeString('pt-BR')}.`;
  } catch (erro) {
    elementos.statusCadastros.dataset.status = 'erro';
    elementos.statusCadastros.textContent = erro.message;
  } finally {
    elementos.filtrarCadastros.disabled = false;
  }
}

elementos.atualizar.addEventListener('click', carregarDadosDoBackend);
elementos.filtrarCadastros.addEventListener('click', carregarCadastros);
elementos.formCadastroCarro.addEventListener('submit', cadastrarCarros);
elementos.formMovimentacao.addEventListener('submit', cadastrarMovimentacao);
elementos.movCidade.addEventListener('change', carregarCarros);
elementos.abrirCadastroCarro.addEventListener('click', () => {
  elementos.cadCidade.value = elementos.cidade.value;
  elementos.statusCadastroCarro.textContent = '';
  elementos.modalCadastroCarro.showModal();
});
elementos.abrirMovimentacao.addEventListener('click', async () => {
  elementos.movCidade.value = elementos.cidade.value;
  elementos.statusMovimentacao.textContent = '';
  elementos.modalMovimentacao.showModal();
  try { await carregarCarros(); } catch (erro) {
    elementos.statusMovimentacao.dataset.status = 'erro';
    elementos.statusMovimentacao.textContent = erro.message;
  }
});
document.querySelectorAll('[data-fechar-modal]').forEach((botao) => {
  botao.addEventListener('click', () => botao.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach((modal) => {
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) modal.close();
  });
});

Promise.all([carregarModelos(), carregarDadosDoBackend(), carregarCadastros()]).catch((erro) => {
  elementos.statusMovimentacao.dataset.status = 'erro';
  elementos.statusMovimentacao.textContent = erro.message;
});
