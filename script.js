"use strict";

/* ==========================================================================
   Seu Porquinho Digital
   Este arquivo é usado pelas duas páginas (index.html e gastos.html).
   Cada bloco só roda se os elementos da sua página existirem.

   Os dados ficam salvos no navegador (localStorage) em uma única chave,
   com este formato:
   {
     usuario: "Maria",
     saldoCentavos: 150000,                       // R$ 1.500,00
     gastos: [{ id: "abc1", descricao: "Lanche", centavos: 1250 }]
   }
   Valores em dinheiro são guardados em CENTAVOS (números inteiros) para
   evitar erros de arredondamento do JavaScript (ex.: 0.1 + 0.2).
   ========================================================================== */

const CHAVE_ESTADO = "porquinhoDigital";

const formatadorReal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});


// ---------- Funções de apoio ----------

// Converte centavos (inteiro) em texto, ex.: 150000 -> "R$ 1.500,00"
function formatarCentavos(centavos) {
    return formatadorReal.format(centavos / 100);
}

// Converte o valor digitado em reais para centavos, ex.: "12.50" -> 1250
function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

// Lê os dados salvos. Retorna null se não houver nada (ou se estiverem inválidos).
function lerEstado() {
    try {
        const bruto = localStorage.getItem(CHAVE_ESTADO);
        if (!bruto) return null;

        const estado = JSON.parse(bruto);
        const valido =
            estado &&
            typeof estado.usuario === "string" &&
            Number.isInteger(estado.saldoCentavos) &&
            Array.isArray(estado.gastos);

        return valido ? estado : null;
    } catch (erro) {
        return null;
    }
}

// Salva os dados. Retorna false se o navegador não permitir (ex.: modo restrito).
function salvarEstado(estado) {
    try {
        localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
        return true;
    } catch (erro) {
        return false;
    }
}


// ---------- PÁGINA INICIAL ----------

const formulario = document.getElementById("dadosIniciaisForm");

if (formulario) {

    const campoNome = document.getElementById("nome");
    const campoDinheiro = document.getElementById("dinheiro");

    // Limpa a mensagem de erro personalizada assim que a pessoa volta a digitar
    campoNome.addEventListener("input", function() {
        campoNome.setCustomValidity("");
    });

    formulario.addEventListener("submit", function(event) {

        event.preventDefault();

        const usuario = campoNome.value.trim();
        const saldoCentavos = reaisParaCentavos(campoDinheiro.value);

        // O "required" aceita só espaços, então conferimos aqui também
        if (usuario === "") {
            campoNome.setCustomValidity("Digite seu nome.");
            campoNome.reportValidity();
            return;
        }

        // Começa um controle novo: guarda os dados e zera os gastos
        const salvou = salvarEstado({
            usuario: usuario,
            saldoCentavos: saldoCentavos,
            gastos: []
        });

        if (!salvou) {
            alert("Não foi possível salvar seus dados neste navegador. Verifique se o armazenamento local está liberado.");
            return;
        }

        // Vai para a página de gastos
        window.location.href = "gastos.html";
    });

}


// ---------- PÁGINA DE GASTOS ----------

const formularioGastos = document.getElementById("gastoForm");

if (formularioGastos) {

    const estado = lerEstado();

    if (!estado) {
        // Abriu esta página sem ter preenchido o início: volta para lá
        window.location.replace("index.html");
    } else {
        iniciarPaginaDeGastos(estado);
    }
}

function iniciarPaginaDeGastos(estado) {

    const campoGasto = document.getElementById("gasto");
    const campoValor = document.getElementById("valor");
    const mensagem = document.getElementById("mensagemGasto");
    const lista = document.getElementById("listaGastos");
    const alertaOrcamento = document.getElementById("alertaOrcamento");
    const saldoAtualTela = document.getElementById("saldoAtual");
    const botaoLimpar = document.getElementById("limparGastos");

    // Cards do topo que não mudam
    document.getElementById("nomeUsuario").textContent = estado.usuario;
    document.getElementById("saldoInicial").textContent = formatarCentavos(estado.saldoCentavos);

    function mostrarMensagem(texto) {
        mensagem.textContent = texto;
        mensagem.hidden = false;
    }

    function esconderMensagem() {
        mensagem.hidden = true;
    }

    // Soma todos os gastos cadastrados (em centavos)
    function calcularTotalGastos() {
        let total = 0;

        for (let i = 0; i < estado.gastos.length; i++) {
            total += estado.gastos[i].centavos;
        }

        return total;
    }

    // Redesenha a lista de gastos na tela
    function mostrarGastos() {

        lista.innerHTML = "";

        if (estado.gastos.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "vazio";
            vazio.textContent = "Nenhum gasto cadastrado.";
            lista.appendChild(vazio);
            return;
        }

        const ul = document.createElement("ul");
        ul.className = "gastos";

        estado.gastos.forEach(function(gasto) {

            const item = document.createElement("li");
            item.className = "gasto-item";

            const descricao = document.createElement("span");
            descricao.textContent = gasto.descricao;

            const valor = document.createElement("strong");
            valor.textContent = formatarCentavos(gasto.centavos);

            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "botao-remover";
            remover.textContent = "Remover";
            remover.setAttribute("aria-label", "Remover gasto " + gasto.descricao);
            remover.addEventListener("click", function() {
                removerGasto(gasto.id);
            });

            item.append(descricao, valor, remover);
            ul.appendChild(item);
        });

        lista.appendChild(ul);
    }

    // Atualiza saldo, alerta, lista e botão "Limpar" de uma vez
    function atualizarTela() {

        const saldoAtual = estado.saldoCentavos - calcularTotalGastos();

        saldoAtualTela.textContent = formatarCentavos(saldoAtual);
        saldoAtualTela.classList.toggle("negativo", saldoAtual < 0);

        // ALERTA VERMELHO
        if (saldoAtual < 0) {
            alertaOrcamento.textContent =
                "⚠️ Você ultrapassou seu orçamento em " + formatarCentavos(-saldoAtual) + "!";
            alertaOrcamento.hidden = false;
        } else {
            alertaOrcamento.hidden = true;
        }

        botaoLimpar.disabled = estado.gastos.length === 0;

        mostrarGastos();
    }

    // Salva e atualiza; avisa se o navegador não deixou salvar
    function salvarEAtualizar() {
        if (!salvarEstado(estado)) {
            mostrarMensagem("Não foi possível salvar neste navegador. Seus gastos continuam na tela, mas serão perdidos ao recarregar a página.");
        }
        atualizarTela();
    }

    function removerGasto(id) {
        estado.gastos = estado.gastos.filter(function(gasto) {
            return gasto.id !== id;
        });
        salvarEAtualizar();
    }

    // CADASTRAR GASTO
    formularioGastos.addEventListener("submit", function(event) {

        event.preventDefault();
        esconderMensagem();

        const descricaoGasto = campoGasto.value.trim();
        const centavosGasto = reaisParaCentavos(campoValor.value);

        if (descricaoGasto === "") {
            mostrarMensagem("Digite o nome do gasto.");
            campoGasto.focus();
            return;
        }

        if (!Number.isInteger(centavosGasto) || centavosGasto <= 0) {
            mostrarMensagem("Digite um valor maior que zero.");
            campoValor.focus();
            return;
        }

        // Adiciona o novo gasto na lista
        estado.gastos.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            descricao: descricaoGasto,
            centavos: centavosGasto
        });

        salvarEAtualizar();

        // Deixa o formulário pronto para o próximo gasto
        formularioGastos.reset();
        campoGasto.focus();
    });

    // BOTÃO LIMPAR
    botaoLimpar.addEventListener("click", function() {

        if (!confirm("Apagar todos os gastos cadastrados?")) {
            return;
        }

        esconderMensagem();

        // Apaga todos os gastos e volta o saldo atual para o saldo inicial
        estado.gastos = [];
        salvarEAtualizar();
    });

    atualizarTela();
}
