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
            // Se não encontrou o termo neste elemento, garante que ele volte ao normal
            el.innerHTML = textoOriginal;
        }
    });
});
