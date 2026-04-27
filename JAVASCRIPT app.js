const reponses = [
  {
    mots: ["bonjour", "allo", "salut", "hi", "hey"],
    rep: "Allo toé! Tbnk d'être là. Chu prêt à coder comme un malade! 🤘"
  },
  {
    mots: ["javascript", "js"],
    rep: "JavaScript? Tbnk! C'est le langage des winners. Voilà un exemple de base :\n\n<pre><code>const msg = 'Chu TI-CODER!';\nconsole.log(msg);</code></pre>\nC'est simple de même, câline! 💻"
  },
  {
    mots: ["python"],
    rep: "Python! Tbnk! Un langage propre comme mes armpits. Example :\n\n<pre><code>msg = 'TI-CODER rulz'\nprint(msg)</code></pre>\nFast pis efficace comme moi! 🐍"
  },
  {
    mots: ["html"],
    rep: "HTML? Tbnk! La base de toute l'internet là. Sans HTML t'as juste du vide, comme le frigo de mon coloc. 😂\n\n<pre><code>&lt;h1&gt;Chu TI-CODER&lt;/h1&gt;</code></pre>"
  },
  {
    mots: ["css"],
    rep: "CSS c'est pour que ton site soit beau en crisse! Tbnk de demander ça. Utilise flex pis t'as plus de problèmes de layout, câline! 🎨"
  },
  {
    mots: ["bug", "erreur", "error", "marche pas", "fonctionne pas"],
    rep: "Un bug?! Tbnk de me le dire! 99% du temps c'est une faute de frappe ou un `;` qui manque. Envoie-moi le code pis je règle ça en crisse! 🔧"
  },
  {
    mots: ["react", "vue", "angular"],
    rep: "Un framework front-end! Tbnk! React c'est mon chouchou — composants, hooks, pis tu partes en orbite. Chu là pour t'aider! ⚛️"
  },
  {
    mots: ["api", "fetch", "requête", "request"],
    rep: "Une API? Tbnk! Fetch c'est ton meilleur chum :\n\n<pre><code>fetch('https://api.exemple.com/data')\n  .then(r => r.json())\n  .then(data => console.log(data));</code></pre>\nSimple de même! 🌐"
  },
  {
    mots: ["database", "bd", "sql", "mysql", "postgres"],
    rep: "Base de données! Tbnk! SQL c'est puissant en crisse. SELECT, INSERT, JOIN — maîtrise ça pis t'es dangereux! ⚡"
  },
  {
    mots: ["merci", "thanks", "thx"],
    rep: "De rien mon chum! Tbnk d'utiliser TI-CODER. Chu toujours là pour déboguer ta vie! 😎🔥"
  }
];

const reponseDefaut = [
  "Tbnk pour la question! Chu en train d'analyser ça... envoie plus de détails pis je vais te pitcher la solution en crisse! 💥",
  "Bonne question câline! Tbnk. Chu pas 100% sûr là mais on va trouver ensemble, esti qu'on est tough! 🤜",
  "Ah ça c'est une belle question de code! Tbnk. Donne-moi le contexte complet pis je défonce le problème! 🔨",
  "Tbnk! Honnêtement là, t'as besoin de plus de contexte dans ta question — envoie le code problématique! 🤖"
];

function trouverReponse(message) {
  const msg = message.toLowerCase();
  for (const item of reponses) {
    if (item.mots.some(mot => msg.includes(mot))) {
      return item.rep;
    }
  }
  return reponseDefaut[Math.floor(Math.random() * reponseDefaut.length)];
}

function ajouterMessage(texte, type) {
  const chatBox = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = `message ${type}`;

  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.textContent = type === 'bot' ? '🤖' : '🧑';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = texte;

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const texte = input.value.trim();
  if (!texte) return;

  ajouterMessage(texte, 'user');
  input.value = '';

  setTimeout(() => {
    const rep = trouverReponse(texte);
    ajouterMessage(rep, 'bot');
  }, 600);
}

document.getElementById('userInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
