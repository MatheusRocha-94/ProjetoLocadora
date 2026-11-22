const elementos = {
  cidade: document.getElementById('selectCidade'),
  atualizar: document.getElementById('botaoAtualizar'),
  status: document.getElementById('statusDashboard'),
  saidas: document.getElementById('kpiSaidas'),
  entradas: document.getElementById('kpiEntradas'),
  saldo: document.getElementById('kpiSaldo'),
  disponiveis: document.getElementById('kpiDisponiveis'),
  manutencao: document.getElementById('kpiManutencao'),
  retidos: document.getElementById('kpiRetidos'),
  sinistro: document.getElementById('kpiSinistro'),
  formMovimentacao: document.getElementById('formMovimentacao'),
  movCidade: document.getElementById('movCidade'),
  movModelo: document.getElementById('movModelo'),
  movQuantidade: document.getElementById('movQuantidade'),
  botaoCadastrar: document.getElementById('botaoCadastrar'),
  statusMovimentacao: document.getElementById('statusMovimentacao'),
  formStatus: document.getElementById('formStatus'),
  statusModelo: document.getElementById('statusModelo'),
  statusQuantidade: document.getElementById('statusQuantidade'),
  botaoStatus: document.getElementById('botaoStatus'),
  statusSituacaoMensagem: document.getElementById('statusSituacaoMensagem'),
  botaoAbrirHistorico: document.getElementById('botaoAbrirHistorico'),
  botaoFecharHistorico: document.getElementById('botaoFecharHistorico'),
  modalHistorico: document.getElementById('modalHistorico'),
  formFiltrosHistorico: document.getElementById('formFiltrosHistorico'),
  historicoModelo: document.getElementById('historicoModelo'),
  corpoHistorico: document.getElementById('corpoHistorico'),
  statusHistorico: document.getElementById('statusHistorico'),
  historicoTotalRegistros: document.getElementById('historicoTotalRegistros'),
  historicoTotalVeiculos: document.getElementById('historicoTotalVeiculos'),
  botaoLimparHistorico: document.getElementById('botaoLimparHistorico'),
  botaoExportarHistorico: document.getElementById('botaoExportarHistorico')
};

let registrosHistorico = [];

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
  elementos.disponiveis.textContent = dados.disponiveis ?? 0;
  elementos.manutencao.textContent = dados.manutencao ?? 0;
  elementos.retidos.textContent = dados.retidos ?? 0;
  elementos.sinistro.textContent = dados.sinistro ?? 0;

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
  elementos.statusModelo.innerHTML = elementos.movModelo.innerHTML;
  elementos.historicoModelo.innerHTML = '<option value="">Todos os modelos</option>' + elementos.movModelo.innerHTML;
}

function escaparHtml(valor) {
  const elemento = document.createElement('div');
  elemento.textContent = valor ?? '';
  return elemento.innerHTML;
}

function descricaoOperacao(registro) {
  const tipos = {
    retirada: 'Retirada', devolucao: 'Devolução', manutencao: 'Manutenção',
    retido: 'Retido', sinistro: 'Sinistro'
  };
  const tipo = tipos[registro.tipo] || registro.tipo;
  return registro.operacao === 'liberacao' ? `Liberação — ${tipo}` : tipo;
}

function classeOperacao(registro) {
  if (registro.operacao === 'liberacao') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  return {
    retirada: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    devolucao: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    manutencao: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    retido: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    sinistro: 'bg-red-500/10 text-red-400 border-red-500/20'
  }[registro.tipo] || 'bg-slate-500/10 text-slate-300 border-slate-500/20';
}

function renderizarHistorico(dados) {
  registrosHistorico = dados.registros || [];
  elementos.historicoTotalRegistros.textContent = dados.totalRegistros ?? 0;
  elementos.historicoTotalVeiculos.textContent = dados.totalVeiculos ?? 0;
  elementos.botaoExportarHistorico.disabled = registrosHistorico.length === 0;

  if (!registrosHistorico.length) {
    elementos.corpoHistorico.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>';
    return;
  }

  elementos.corpoHistorico.innerHTML = registrosHistorico.map((registro) => {
    const data = new Date(registro.data.replace(' ', 'T')).toLocaleString('pt-BR');
    return `<tr class="hover:bg-white/[0.02]">
      <td class="whitespace-nowrap p-3 text-slate-300">${escaparHtml(data)}</td>
      <td class="whitespace-nowrap p-3 text-white">${escaparHtml(registro.cidade)} (${escaparHtml(registro.uf)})</td>
      <td class="p-3 text-slate-300">${escaparHtml(registro.modelo)}</td>
      <td class="p-3"><span class="inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${classeOperacao(registro)}">${escaparHtml(descricaoOperacao(registro))}</span></td>
      <td class="p-3 text-right font-bold text-white">${registro.quantidade}</td>
      <td class="max-w-xs p-3 text-slate-400">${escaparHtml(registro.observacao || '—')}</td>
    </tr>`;
  }).join('');
}

async function carregarHistorico() {
  elementos.statusHistorico.dataset.status = 'carregando';
  elementos.statusHistorico.textContent = 'Carregando histórico…';
  elementos.corpoHistorico.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400">Consultando dados…</td></tr>';
  const parametros = new URLSearchParams();
  new FormData(elementos.formFiltrosHistorico).forEach((valor, chave) => {
    if (valor) parametros.set(chave, valor);
  });

  try {
    const resposta = await fetch(`api/historico.php?${parametros}`, { headers: { Accept: 'application/json' } });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar o histórico.');
    renderizarHistorico(dados);
    elementos.statusHistorico.dataset.status = 'sucesso';
    elementos.statusHistorico.textContent = dados.totalRegistros >= dados.limite
      ? `Exibindo os ${dados.limite} registros mais recentes.` : 'Consulta concluída.';
  } catch (erro) {
    registrosHistorico = [];
    elementos.botaoExportarHistorico.disabled = true;
    elementos.corpoHistorico.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-red-400">Falha ao carregar os dados.</td></tr>';
    elementos.statusHistorico.dataset.status = 'erro';
    elementos.statusHistorico.textContent = erro.message;
  }
}

function abrirHistorico() {
  elementos.modalHistorico.classList.remove('hidden');
  elementos.modalHistorico.classList.add('flex');
  document.body.classList.add('overflow-hidden');
  carregarHistorico();
  elementos.botaoFecharHistorico.focus();
}

function fecharHistorico() {
  elementos.modalHistorico.classList.add('hidden');
  elementos.modalHistorico.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  elementos.botaoAbrirHistorico.focus();
}

function exportarHistorico() {
  if (!registrosHistorico.length) return;
  const campos = ['Data', 'Cidade', 'UF', 'Modelo', 'Operação', 'Quantidade', 'Observação'];
  const formatar = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`;
  const linhas = registrosHistorico.map((registro) => [
    registro.data, registro.cidade, registro.uf, registro.modelo,
    descricaoOperacao(registro), registro.quantidade, registro.observacao || ''
  ].map(formatar).join(';'));
  const blob = new Blob(['\uFEFF' + [campos.join(';'), ...linhas].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `historico-frota-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function cadastrarStatus(evento) {
  evento.preventDefault();
  elementos.botaoStatus.disabled = true;
  elementos.statusSituacaoMensagem.dataset.status = 'carregando';
  elementos.statusSituacaoMensagem.textContent = 'Registrando situação…';
  const corpo = Object.fromEntries(new FormData(elementos.formStatus).entries());
  corpo.quantidade = Number(corpo.quantidade);

  try {
    const resposta = await fetch('api/status-veiculos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo)
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível registrar a situação.');
    elementos.statusSituacaoMensagem.dataset.status = 'sucesso';
    elementos.statusSituacaoMensagem.textContent = dados.mensagem;
    elementos.statusQuantidade.value = '1';
    elementos.cidade.value = corpo.cidade;
    await carregarDadosDoBackend();
  } catch (erro) {
    elementos.statusSituacaoMensagem.dataset.status = 'erro';
    elementos.statusSituacaoMensagem.textContent = erro.message;
  } finally {
    elementos.botaoStatus.disabled = false;
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
elementos.formStatus.addEventListener('submit', cadastrarStatus);
elementos.botaoAbrirHistorico.addEventListener('click', abrirHistorico);
elementos.botaoFecharHistorico.addEventListener('click', fecharHistorico);
elementos.formFiltrosHistorico.addEventListener('submit', (evento) => { evento.preventDefault(); carregarHistorico(); });
elementos.botaoLimparHistorico.addEventListener('click', () => { elementos.formFiltrosHistorico.reset(); carregarHistorico(); });
elementos.botaoExportarHistorico.addEventListener('click', exportarHistorico);
elementos.modalHistorico.addEventListener('click', (evento) => { if (evento.target === elementos.modalHistorico) fecharHistorico(); });
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !elementos.modalHistorico.classList.contains('hidden')) fecharHistorico();
});

Promise.all([carregarModelos(), carregarDadosDoBackend()]).catch((erro) => {
  elementos.statusMovimentacao.dataset.status = 'erro';
  elementos.statusMovimentacao.textContent = erro.message;
});
