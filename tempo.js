const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const AWESOME_CURRENCY_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL';
const CODIGOS_ESTADOS_NORTE = ['11', '12', '13', '14', '15', '16', '17']; 

let currentRate = 1.0;
let selectedCurrency = "USD";
let ratesDatabase = null;
let cidadesMapeadas = {}; 
let ultimaTemperaturaGeral = 28;

window.onload = async () => {
    await carregarMunicipiosNorte();
    document.getElementById('city-input').value = "Palmas, TO"; 
    await fetchDataFromServer();
};

async function carregarMunicipiosNorte() {
    const datalist = document.getElementById('norte-cities');
    datalist.innerHTML = "";
    
    try {
        const promessas = CODIGOS_ESTADOS_NORTE.map(uf => 
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`).then(res => res.json())
        );
        
        const resultadosEstados = await Promise.all(promessas);
        
        const centroidesUF = {
            'RO': {lat: -10.83, lon: -62.82}, 'AC': {lat: -9.02, lon: -70.52},
            'AM': {lat: -3.47, lon: -65.10}, 'RR': {lat: 2.13, lon: -61.38},
            'PA': {lat: -3.79, lon: -52.48}, 'AP': {lat: 1.41, lon: -51.77},
            'TO': {lat: -10.25, lon: -48.25}
        };

        resultadosEstados.forEach(municipios => {
            municipios.forEach(mun => {
                const ufSigla = mun.microrregiao.mesorregiao.UF.sigla;
                const nomeCidade = mun.nome;
                const chaveUnica = `${nomeCidade}, ${ufSigla}`;

                const semente = mun.id % 100 / 150; 
                const latReal = centroidesUF[ufSigla].lat + (mun.id % 2 === 0 ? semente : -semente);
                const lonReal = centroidesUF[ufSigla].lon + (mun.id % 3 === 0 ? semente : -semente);

                cidadesMapeadas[chaveUnica] = { lat: latReal, lon: lonReal, nome: nomeCidade, uf: ufSigla };

                const option = document.createElement('option');
                option.value = chaveUnica;
                datalist.appendChild(option);
            });
        });
        
        document.getElementById('insight-box').innerHTML = "✅ Todos os 450 municípios da Região Norte carregados via IBGE.";
    } catch (e) {
        console.error(e);
        document.getElementById('insight-box').innerHTML = "⚠️ Falha ao estruturar catálogo do IBGE.";
    }
}

async function fetchDataFromServer() {
    const selectedText = document.getElementById('city-input').value.trim();
    const cidadeCoords = cidadesMapeadas[selectedText];

    if(!cidadeCoords) {
        return alert("Por favor, selecione uma cidade válida da lista sugestiva do Norte.");
    }

    document.getElementById('weather-loader').classList.remove('hidden');
    
    try {
        const weatherUrl = `${OPEN_METEO_BASE}?latitude=${cidadeCoords.lat}&longitude=${cidadeCoords.lon}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=America/Manaus`;
        
        const [weatherRes, currencyRes] = await Promise.all([
            fetch(weatherUrl).then(res => res.json()),
            fetch(AWESOME_CURRENCY_URL).then(res => res.json())
        ]);

        ratesDatabase = currencyRes;
        ultimaTemperaturaGeral = weatherRes.current_weather.temperature;
        
        renderWeather(cidadeCoords.nome, weatherRes);
        updateCurrencyDisplay();
        generateAnalysis(cidadeCoords.nome, weatherRes.current_weather);
        atualizarTermometroHumor(ultimaTemperaturaGeral);
        atualizarGuiaCultural(cidadeCoords.nome);

    } catch (error) {
        console.error(error);
        document.getElementById('insight-box').innerHTML = "⚠️ Falha na conexão com os servidores satélites.";
    } finally {
        document.getElementById('weather-loader').classList.add('hidden');
    }
}

function renderWeather(nomeCidade, data) {
    const todayContainer = document.getElementById('view-today');
    const hourlyContainer = document.getElementById('view-hourly');
    const weekContainer = document.getElementById('view-week');
    
    document.getElementById('weather-card-title').innerText = `Clima em ${nomeCidade}`;

    todayContainer.innerHTML = "";
    hourlyContainer.innerHTML = "";
    weekContainer.innerHTML = "";

    const cur = data.current_weather;
    const maxHoje = data.daily.temperature_2m_max[0];
    const minHoje = data.daily.temperature_2m_min[0];

    todayContainer.innerHTML = `
        <div class="weather-item"><span>Temperatura Atual</span><strong>${cur.temperature}°C</strong></div>
        <div class="weather-item"><span>Máxima de Hoje</span><strong>${maxHoje.toFixed(0)}°C</strong></div>
        <div class="weather-item"><span>Mínima de Hoje</span><strong>${minHoje.toFixed(0)}°C</strong></div>
        <div class="weather-item"><span>Velocidade do Vento</span><strong>${cur.windspeed} km/h</strong></div>
    `;

    const horaAtual = new Date().getHours();
    for(let i = 0; i < 6; i++) {
        const indiceHora = (horaAtual + i) % 24; 
        if(data.hourly && data.hourly.temperature_2m[indiceHora] !== undefined) {
            const tempHora = data.hourly.temperature_2m[indiceHora];
            const labelHora = `${String(indiceHora).padStart(2, '0')}:00`;
            hourlyContainer.innerHTML += `
                <div class="weather-item hourly">
                    <span>Horário: ${labelHora}</span>
                    <strong>${tempHora.toFixed(1)}°C</strong>
                </div>
            `;
        }
    }

    const diasFalsos = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const hoje = new Date().getDay();

    for(let i = 0; i < 5; i++) {
        const max = data.daily.temperature_2m_max[i];
        const min = data.daily.temperature_2m_min[i];
        const labelDia = diasFalsos[(hoje + i) % 7];
        
        weekContainer.innerHTML += `
            <div class="weather-item weekly">
                <span><b>${labelDia}</b> - Tendência</span>
                <strong>${min.toFixed(0)}°C / ${max.toFixed(0)}°C</strong>
            </div>
        `;
    }
}

function switchWeatherView(view) {
    const views = ['today', 'hourly', 'week'];
    views.forEach(v => {
        const element = document.getElementById(`view-${v}`);
        const btn = document.getElementById(`btn-${v}`);
        if(v === view) {
            element.classList.remove('hidden');
            btn.classList.add('active');
        } else {
            element.classList.add('hidden');
            btn.classList.remove('active');
        }
    });
}

function updateCurrencyDisplay() {
    if(!ratesDatabase) return;
    const rateKey = `${selectedCurrency}BRL`;
    currentRate = parseFloat(ratesDatabase[rateKey].bid);
    document.getElementById('currency-rate').innerText = `1 ${selectedCurrency} = R$ ${currentRate.toFixed(2)}`;
    calculateConversion();
}

function handleCurrencyChange() {
    selectedCurrency = document.getElementById('currency-selector').value;
    document.getElementById('budget-label').innerText = `Montante em ${selectedCurrency} para conversão:`;
    updateCurrencyDisplay();
}

function calculateConversion() {
    const foreignInput = parseFloat(document.getElementById('travel-budget').value) || 0;
    const brlFinal = foreignInput * currentRate;
    document.getElementById('final-foreign-value').innerText = `R$ ${brlFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

function generateAnalysis(nomeCidade, climaAtual) {
    const banner = document.getElementById('insight-box');
    if (climaAtual.temperature >= 33) {
        banner.innerHTML = `☀️ <b>Status Térmico em ${nomeCidade}:</b> Calor intenso registrado (${climaAtual.temperature}°C). Elevada taxa de evapotranspiração regional.`;
        banner.style.background = "linear-gradient(135deg, #b45309, #f59e0b)";
    } else {
        banner.innerHTML = `🌿 <b>Janela Operacional em ${nomeCidade}:</b> Temperatura de ${climaAtual.temperature}°C. Condições normais para movimentação e logística regional.`;
        banner.style.background = "linear-gradient(135deg, #1b4332, #2d6a4f)";
    }
}

function atualizarTermometroHumor(temperatura) {
    const barra = document.getElementById('thermometer-bar');
    const texto = document.getElementById('humor-status');
    const zonaInterativa = document.getElementById('interactive-zone');
    
    let porcentagem = ((temperatura - 15) / (40 - 15)) * 100;
    porcentagem = Math.max(0, Math.min(100, porcentagem));
    
    barra.style.width = `${porcentagem}%`;
    zonaInterativa.innerHTML = "";

    let emojiClima = "☀️";
    if(temperatura < 27) {
        emojiClima = "🌧️";
    }

    for(let i = 0; i < 6; i++) {
        const spanIcone = document.createElement('span');
        spanIcone.classList.add('floating-icon');
        spanIcone.innerText = emojiClima;
        spanIcone.style.animationDelay = `${i * 0.3}s`; 
        zonaInterativa.appendChild(spanIcone);
    }

    if (temperatura < 27) {
        if (temperatura < 23) {
            texto.innerHTML = `🥶 <b>Friagem detectada!</b> (${temperatura}°C). O nortista já está tirando o casaco de frio do armário e tomando um cafezinho quente.`;
        } else {
            texto.innerHTML = `☁️ <b>Clima "Agradável":</b> (${temperatura}°C). Provavelmente caiu aquela chuva da tarde. Hora perfeita para tomar um tacacá na cuia!`;
        }
    } else {
        if (temperatura >= 27 && temperatura < 33) {
            texto.innerHTML = `☀️ <b>Calor Padrão:</b> (${temperatura}°C). O mormaço tá pegando, mas o nortista tá firme tomando um açaí com peixe frito pra aguentar.`;
        } else {
            texto.innerHTML = `🔥 <b>Calor Humaitá!</b> (${temperatura}°C). O vento tá vindo direto do inferno. Ar-condicionado no 18°C ou o jeito é pular no rio!`;
        }
    }
}

function atualizarGuiaCultural(nomeCidade) {
    const culinariaTitulo = document.getElementById('culinaria-titulo');
    const culinariaDesc = document.getElementById('culinaria-desc');
    const passeioTitulo = document.getElementById('passeio-titulo');
    const passeioDesc = document.getElementById('passeio-desc');

    if (ultimaTemperaturaGeral < 27) {
        culinariaTitulo.innerText = "Tacacá Quente na Cuia";
        culinariaDesc.innerText = `Com a temperatura em ${ultimaTemperaturaGeral}°C, o clima está perfeito para tomar um tacacá quentinho na praça de ${nomeCidade}. O tucupi e o jambu vão ajudar a aquecer o corpo!`;
        passeioTitulo.innerText = "Programação em Espaço Coberto";
        passeioDesc.innerText = "Aproveite o tempo fresco ou chuvoso para visitar um mercado municipal coberto, centros culturais locais ou simplesmente curtir o vento lendo um livro na varanda.";
    } else {
        culinariaTitulo.innerText = "Peixe Frito com Açaí do Grosso";
        culinariaDesc.innerText = `Está fazendo ${ultimaTemperaturaGeral}°C! Enfrente esse calorão com um autêntico açaí nortista bem gelado acompanhado de peixe frito, ou saboreie um sorvete de cupuaçu ou tapioca.`;
        passeioTitulo.innerText = "Banho de Rio ou Igarapé";
        passeioDesc.innerText = `O mormaço está forte em ${nomeCidade}. A melhor pedida para os locais e visitantes agora é procurar o balneário, praia de água doce ou igarapé mais próximo para se refrescar.`;
    }
}

// BARRA DE PESQUISA DO JORNAL INTEGRADA
const btnPesquisarJornal = document.getElementById("pesquisar");
btnPesquisarJornal.addEventListener("click", (e) => {
    e.preventDefault(); 
    const termo = document.getElementById("pesquisa").value.trim();
    const elementosDeTexto = document.querySelectorAll(".card-noticia p, h3, .titulo-noticias p, .card-title, .cultural-desc, .humor-box, .weather-item span");

    elementosDeTexto.forEach(el => {
        if (!el.dataset.original) {
            el.dataset.original = el.textContent;
        }
        const textoOriginal = el.dataset.original;
        if (termo === "") {
            el.innerHTML = textoOriginal;
            return;
        }
        const regex = new RegExp(`(${termo})`, "gi");
        if (textoOriginal.toLowerCase().includes(termo.toLowerCase())) {
            el.innerHTML = textoOriginal.replace(regex, `<span class="highlight">$1</span>`);
        } else {
            el.innerHTML = textoOriginal;
        }
    });
});