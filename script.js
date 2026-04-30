// Remplace le innerHTML des cartes par ça:
carte.innerHTML = `
  <span class="categorie-badge">${item.categorie}</span>
  <h2>${item.titre}</h2>
  <p>${item.description}</p>
  <pre><code>${item.code}</code></pre>
`;

// Et remplace le message vide:
resultats.innerHTML = 
  "<p class='message-vide'>⚠️ RIEN TROUVÉ — CÂLINE! 😅</p>";