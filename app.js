let listaDrivers = [];

document.addEventListener("DOMContentLoaded", carregar);

async function carregar() {

    try {

        const drivers = await buscarDrivers();
        const agencias = await buscarAgencias();
        const rotas = await buscarRotas();

        listaDrivers = drivers;

        console.log("Drivers:", drivers);
        console.log("Agencias:", agencias);
        console.log("Rotas:", rotas);

        preencherMotoristas(drivers);

        const selectAgencia =
            document.getElementById("agencia");

        selectAgencia.innerHTML = `
            <option value="">
                Selecione uma agência
            </option>
        `;

        agencias.forEach(a => {

            selectAgencia.innerHTML += `
                <option value="${a.agencia}">
                    ${a.agencia}
                </option>
            `;

        });

        renderizarRotas(rotas);

    } catch (erro) {

        console.error(
            "Erro ao carregar:",
            erro
        );

        alert(
            "Erro ao carregar dados da API."
        );

    }

}

function preencherMotoristas(drivers) {

    const lista =
        document.getElementById("motoristas");

    if (!lista) return;

    lista.innerHTML = drivers
        .map(driver =>
            `<option value="${driver.nome}">`
        )
        .join("");

}


function renderizarRotas(rotas) {
    const divRotas = document.getElementById("rotas");
    if (!divRotas) return;

    const listaRotas = rotas || [];

    const contador = document.getElementById("contadorRotas");

    if (contador) {
        contador.textContent =
            `${listaRotas.length} ${listaRotas.length === 1 ? "rota" : "rotas"}`;
    }

    divRotas.innerHTML = "";

    if (listaRotas.length === 0) {
        divRotas.innerHTML = `
            <div class="card">
                <h3>Nenhuma rota disponível</h3>
            </div>
        `;
        return;
    }

    let html = "";

    listaRotas.forEach(rota => {
        html += `
            <div class="card">
                <h3>${rota.bairro || "-"}</h3>

                <p>
                    <strong>Cidade:</strong>
                    ${rota.cidade || "-"}
                </p>

                <p>
                    <strong>Gaiola:</strong>
                    ${rota.gaiola || "-"}
                </p>

                <button
                    onclick='pegarRota(${JSON.stringify(rota)})'
                >
                    Pegar rota
                </button>
            </div>
        `;
    });

    divRotas.innerHTML = html;
}


async function pegarRota(rota) {

    try {

        const nomeDigitado =
            document.getElementById(
                "buscarMotorista"
            ).value.trim();

        const agencia =
            document.getElementById(
                "agencia"
            ).value;

       if (!nomeDigitado) {
    mostrarModalAviso(
        "Motorista obrigatório",
        "Digite o nome do motorista para continuar.",
        "bi-person"
    );
    return;
}

        if (!agencia) {

            alert(
                "Selecione uma agência."
            );

            return;

        }

        const driver =
            listaDrivers.find(
                d => d.nome === nomeDigitado
            );

        if (!driver) {

            alert(
                "Selecione um motorista válido."
            );

            return;

        }

        const confirmar = await mostrarModalConfirmacao({
    motorista: driver.nome,
    agencia: agencia,
    bairro: rota.bairro,
    cidade: rota.cidade,
    gaiola: rota.gaiola
});

if (!confirmar) return;

        const dados = {

            idDriver: driver.id,
            nome: driver.nome,
            telefone: driver.telefone || "",

            agencia: agencia,

            cidade: rota.cidade,
            bairro: rota.bairro,
            gaiola: rota.gaiola

        };

        const resultado =
            await reservarRota(dados);

        if (resultado.sucesso) {

            mostrarModalSucesso();

            document.getElementById(
                "buscarMotorista"
            ).value = "";

            document.getElementById(
                "agencia"
            ).selectedIndex = 0;

            const rotasAtualizadas =
                await buscarRotas();

            renderizarRotas(
                rotasAtualizadas
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } else {

            alert(
                "❌ " +
                resultado.mensagem
            );

        }

    } catch (erro) {

        console.error(
            "Erro ao reservar rota:",
            erro
        );

        alert(
            "Erro ao reservar rota."
        );

    }

}

window.pegarRota = pegarRota;
function filtrarBairros() {

    const texto =
        document.getElementById("pesquisaBairro")
        .value
        .toLowerCase();

    const cards =
        document.querySelectorAll("#rotas .card");

    cards.forEach(card => {

        const bairro =
            card.querySelector("h3")
            ?.textContent
            .toLowerCase() || "";

        card.style.display =
            bairro.includes(texto)
                ? ""
                : "none";

    });

}

function mostrarModalSucesso() {
    const modal = document.createElement("div");

    modal.id = "modalSucesso";
    modal.innerHTML = `
        <div class="modal-sucesso">
            <div class="icone-sucesso">
                <i class="bi bi-check-lg"></i>
            </div>

            <h2>Rota reservada!</h2>

            <p>
                Sua rota foi reservada com sucesso.
            </p>

            <button id="btnFecharSucesso">
                OK, ENTENDI
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("btnFecharSucesso")
        .addEventListener("click", () => {
            modal.remove();
        });
}

function mostrarModalConfirmacao(dados) {
    return new Promise((resolve) => {
        const modal = document.createElement("div");
        modal.id = "modalConfirmacaoRota";

        modal.innerHTML = `
            <div class="confirmacao-card">
                <div class="confirmacao-icone">
                    <i class="bi bi-truck"></i>
                </div>

                <span class="confirmacao-etiqueta">
                    CONFIRMAÇÃO DE RESERVA
                </span>

                <h2>Confirmar rota?</h2>

                <p class="confirmacao-descricao">
                    Confira os dados antes de continuar.
                </p>

                <div class="confirmacao-dados">
                    <div class="confirmacao-linha">
                        <span><i class="bi bi-person"></i> Motorista</span>
                        <strong>${escaparHTML(dados.motorista)}</strong>
                    </div>

                    <div class="confirmacao-linha">
                        <span><i class="bi bi-buildings"></i> Agência</span>
                        <strong>${escaparHTML(dados.agencia)}</strong>
                    </div>

                    <div class="confirmacao-linha">
                        <span><i class="bi bi-geo-alt"></i> Bairro</span>
                        <strong>${escaparHTML(dados.bairro)}</strong>
                    </div>

                    <div class="confirmacao-linha">
                        <span><i class="bi bi-geo"></i> Cidade</span>
                        <strong>${escaparHTML(dados.cidade)}</strong>
                    </div>

                    <div class="confirmacao-linha">
                        <span><i class="bi bi-box-seam"></i> Gaiola</span>
                        <strong>${escaparHTML(dados.gaiola)}</strong>
                    </div>
                </div>

                <div class="confirmacao-acoes">
                    <button type="button" class="btn-cancelar">
                        Cancelar
                    </button>

                    <button type="button" class="btn-confirmar">
                        <i class="bi bi-check-lg"></i>
                        Confirmar reserva
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        function fechar(resultado) {
            modal.remove();
            resolve(resultado);
        }

        modal.querySelector(".btn-cancelar")
            .addEventListener("click", () => fechar(false));

        modal.querySelector(".btn-confirmar")
            .addEventListener("click", () => fechar(true));

        modal.addEventListener("click", (event) => {
            if (event.target === modal) fechar(false);
        });

        function teclaEsc(event) {
            if (event.key === "Escape") {
                fechar(false);
                document.removeEventListener("keydown", teclaEsc);
            }
        }

        document.addEventListener("keydown", teclaEsc);
    });
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function mostrarModalAviso(titulo, mensagem, icone = "bi-info-circle") {
    // Remove aviso anterior, se existir
    document.getElementById("modalAviso")?.remove();

    const modal = document.createElement("div");
    modal.id = "modalAviso";

    modal.innerHTML = `
        <div class="aviso-card" role="alertdialog"
             aria-modal="true" aria-labelledby="avisoTitulo">
            <div class="aviso-icone">
                <i class="bi ${icone}"></i>
            </div>

            <h2 id="avisoTitulo">${escaparHTML(titulo)}</h2>

            <p>${escaparHTML(mensagem)}</p>

            <button type="button" class="aviso-botao">
                Entendi
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    const botao = modal.querySelector(".aviso-botao");

    function fechar() {
        modal.remove();
    }

    botao.addEventListener("click", fechar);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) fechar();
    });

    botao.focus();
}
