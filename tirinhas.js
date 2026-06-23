const btn = document.getElementById("pesquisar");

btn.addEventListener("click", (e) => {
    e.preventDefault(); 

    const termo = document.getElementById("pesquisa").value.trim();
    
    // Pegamos todos os elementos que REALMENTE contêm os textos
    // Buscamos os parágrafos dentro dos cards, os h3, e os parágrafos dos títulos
    const elementosDeTexto = document.querySelectorAll(".card-noticia p, h3, .titulo-noticias p, .dados p, .corpo-texto");

    elementosDeTexto.forEach(el => {
        // Salva o texto original se for a primeira vez rodando
        if (!el.dataset.original) {
            el.dataset.original = el.textContent;
        }

        const textoOriginal = el.dataset.original;

        // Se a barra estiver vazia, restaura o texto original de todos e encerra
        if (termo === "") {
            el.innerHTML = textoOriginal;
            return;
        }

        const regex = new RegExp(`(${termo})`, "gi");

        if (textoOriginal.toLowerCase().includes(termo.toLowerCase())) {
            // Aplica o destaque diretamente no elemento de texto encontrado
            el.innerHTML = textoOriginal.replace(regex, `<span class="highlight">$1</span>`);
        } else {
            // Se não encontrou o termo neste elemento, ele volte ao normal
            el.innerHTML = textoOriginal;
        }
    });
});


const culturalItems = [
    { icon: '🍲', name: 'Tacacá' },
    { icon: '🥣', name: 'Açaí' },
    { icon: '🐬', name: 'Boto Rosa' },
    { icon: '🐂', name: 'Boi-Bunbá' },
    { icon: '🐟', name: 'Pirarucu' },
    { icon: '🦜', name: 'Arara' }
];
let cardsArray = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchesFound = 0;

// Inicia o jogo assim que a página terminar de carregar totalmente
document.addEventListener("DOMContentLoaded", () => {
    initMemoryGame();
});

function initMemoryGame() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    grid.innerHTML = "";
    document.getElementById('game-status').innerText = "Encontre os pares da cultura amazônica!";
    cardsArray = [...culturalItems, ...culturalItems];
    cardsArray.sort(() => 0.5 - Math.random());
    
    firstCard = null; 
    secondCard = null; 
    lockBoard = false; 
    matchesFound = 0;

    cardsArray.forEach((item, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.name = item.name;
        card.dataset.index = index;
        card.innerText = item.icon;
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    lockBoard = true;

    let isMatch = firstCard.dataset.name === secondCard.dataset.name;
    if (isMatch) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        matchesFound++;
        document.getElementById('game-status').innerText = `Boa! Você encontrou ${firstCard.dataset.name}!`;
        
        if (matchesFound === culturalItems.length) {
            document.getElementById('game-status').innerText = "🎉 Égua do bicho sabido! Você completou o desafio da cultura do Norte!";
        }
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    } else {
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            [firstCard, secondCard] = [null, null];
            lockBoard = false;
        }, 1000);
    }
}