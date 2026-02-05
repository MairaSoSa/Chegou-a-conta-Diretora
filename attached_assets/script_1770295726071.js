(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(a=>{
    if(a.getAttribute('href') === path) a.classList.add('active');
  });
})();

function initChat(){
  const form = document.getElementById('chatForm');
  if(!form) return;
  const input = document.getElementById('chatInput');
  const box = document.getElementById('chatBox');
  const topic = document.getElementById('chatTopic');

  const addMsg = (who, text)=>{
    const wrap = document.createElement('div');
    wrap.style.margin = '10px 0';
    wrap.innerHTML = `
      <div class="card" style="border-radius:14px; padding:12px; max-width: 760px; ${who==='bot'?'border-color:rgba(96,165,250,.45); background:rgba(96,165,250,.10)':''}">
        <small style="color:rgba(138,160,191,.95)">${who==='bot'?'Assistente do site':'Você'}</small>
        <div style="margin-top:6px; color:rgba(234,242,255,.90); line-height:1.55">${text}</div>
      </div>`;
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  };

  const botReply = ()=>{
    const t = (topic?.value || 'Geral');
    const hints = {
      'PDDE': 'Se for PDDE, abre “Programas & Políticas” e olha “Pode / Não pode” + “Documentos mínimos”.',
      'PNAE': 'Se for PNAE, começa pela página do programa e pela lista de documentos mínimos.',
      'PNATE': 'Se for PNATE, confira a elegibilidade e depois vá para o Dashboard.',
      'Prestação': 'Para prestação, recomendo a Trilha → “Prestação de contas” e os modelos de checklist.',
      'Documentos': 'Para documentos, a Caixa de Ferramentas tem modelos prontos por “verbo”.',
      'Alertas do Dashboard': 'Se apareceu alerta no Dashboard, abra “Alertas explicados”: tem motivos comuns e como checar.'
    };
    const base = hints[t] || 'Diga qual programa (PDDE/PNAE/PNATE) e o que você viu (ex.: “não achei repasse”, “dado indisponível”).';
    return `Entendi. Tema: <strong>${t}</strong>.<br><br>${base}<br><br><span class="small">Aviso: isto é um mock. No produto final, o Chat IA responderia usando a base do site e indicaria fontes oficiais.</span>`;
  };

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const q = (input.value || '').trim();
    if(!q) return;
    addMsg('user', q.replace(/</g,'&lt;'));
    input.value = '';
    setTimeout(()=>addMsg('bot', botReply()), 220);
  });

  addMsg('bot', 'Oi! Me diga sua dúvida e selecione o tema. Eu te direciono para a Trilha, Programas, Modelos ou Dashboard.');
}
initChat();

function initTabs(){
  const tabs = document.querySelectorAll('[data-tab]');
  if(!tabs.length) return;
  const panels = document.querySelectorAll('[data-panel]');
  const setActive = (name)=>{
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
    panels.forEach(p=>p.style.display = (p.dataset.panel===name ? 'block' : 'none'));
  };
  tabs.forEach(t=>t.addEventListener('click', ()=>setActive(t.dataset.tab)));
  setActive(tabs[0].dataset.tab);
}
initTabs();