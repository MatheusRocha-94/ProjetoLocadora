const elementos = {
  cidade: document.getElementById('selectCidade'),
  atualizar: document.getElementById('botaoAtualizar'),
  status: document.getElementById('statusDashboard'),
  saidas: document.getElementById('kpiSaidas'),
  entradas: document.getElementById('kpiEntradas'),
  saldo: document.getElementById('kpiSaldo'),
  formMovimentacao: document.getElementById('formMovimentacao'),
  movCidade: document.getElementById('movCidade'),
  movModelo: document.getElementById('movModelo'),
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
        const carWidth = Math.min(width * 1.1, 26);
        const carHeight = 10;
        const carX = x - carWidth / 2;
        const carY = y - carHeight - 3;

        ctx.save();
        ctx.fillStyle = dataset.backgroundColor;
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

  elementos.movModelo.innerHTML = dados.modelos
    .map((modelo) => `<option value="${modelo.id}">${modelo.nome}</option>`)
    .join('');
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
    await carregarDadosDoBackend();
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
    const resposta = await fetch(`api/dashboard.php?cidade=${cidade}`, {
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

elementos.cidade.addEventListener('change', carregarDadosDoBackend);
elementos.atualizar.addEventListener('click', carregarDadosDoBackend);
elementos.formMovimentacao.addEventListener('submit', cadastrarMovimentacao);

Promise.all([carregarModelos(), carregarDadosDoBackend()]).catch((erro) => {
  elementos.statusMovimentacao.dataset.status = 'erro';
  elementos.statusMovimentacao.textContent = erro.message;
});
