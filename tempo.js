
// 🌤️ CLIMA (com cidade real)
function buscarClima() {

    let cidade = document.getElementById("cidade").value || "Manaus";

    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cidade}`)
    .then(res => res.json())
    .then(local => {

        if (!local.results) {
            document.getElementById("clima").innerHTML = "Cidade não encontrada";
            return;
        }

        let lat = local.results[0].latitude;
        let lon = local.results[0].longitude;

        return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    })
    .then(res => res.json())
    .then(data => {

        document.getElementById("clima").innerHTML =
            "Temp: " + data.current_weather.temperature + "°C<br>" +
            "Vento: " + data.current_weather.windspeed + " km/h";
    })
    .catch(() => {
        document.getElementById("clima").innerHTML = "Erro ao carregar clima";
    });
}


// 💱 MOEDAS (real)
function carregarMoedas() {

    fetch("https://api.exchangerate.host/latest?base=USD&symbols=BRL,EUR")
    .then(res => res.json())
    .then(data => {

        document.getElementById("moedas").innerHTML =
            "USD → BRL: R$ " + data.rates.BRL + "<br>" +
            "USD → EUR: € " + data.rates.EUR;
    })
    .catch(() => {
        document.getElementById("moedas").innerHTML = "Erro moedas";
    });
}


// 📰 NOVIDADE (INTERAÇÃO DIFERENTE)
const noticias = [
    "Amazônia registra queda no desmatamento em 2026",
    "Rio Negro atinge nível histórico positivo",
    "Novas tecnologias chegam à região Norte",
    "Universidades da Amazônia ganham destaque nacional",
    "Clima amazônico apresenta variações intensas este mês"
];

function trocarNoticia() {
    let i = Math.floor(Math.random() * noticias.length);
    document.getElementById("noticia").innerHTML = noticias[i];
}

// inicia automático
buscarClima();
carregarMoedas();