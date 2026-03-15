import { useEffect, useMemo, useState } from "react";

export default function CadernoDiretoraPreview() {
  const notes = [
    { id: 1, color: "rotate-[-2deg]", text: "PDDE pode comprar materiais pedagógicos, pequenos reparos e alguns equipamentos." },
    { id: 2, color: "rotate-[1.5deg]", text: "Confirmar prazo de prestação de contas e documentos obrigatórios da UEx." },
    { id: 3, color: "rotate-[-1deg]", text: "Pesquisar modelo de ata para reunião do conselho escolar." },
  ];

  const trilhaLinks = {
    "Como funciona o PDDE": "#unidade-pdde",
    "Como fazer pesquisa de preços": "#unidade-pesquisa-precos",
    "Planejamento de compras": "#unidade-planejamento-compras",
    "Organização da UEx": "#unidade-uex",
    "Prestação de contas": "#unidade-prestacao-contas",
    "Organização de compras": "#unidade-organizacao-compras",
    "Uso correto do recurso": "#unidade-uso-correto-recurso",
  };

  const cards = [
    {
      title: "PDDE: o que pode comprar?",
      icon: "💰",
      accent: "bg-[#fff1a8]",
      unidade: "Unidade da trilha: Como funciona o PDDE",
      text: "Materiais pedagógicos, pequenos reparos e alguns equipamentos podem ser adquiridos com recursos do PDDE, desde que vinculados ao funcionamento pedagógico da escola.",
      bullets: ["Materiais pedagógicos", "Pequenos reparos", "Equipamentos permitidos"],
      trilha: ["Planejamento de compras", "Organização da UEx", "Prestação de contas"],
      legislacao: ["Resolução FNDE nº 15/2021", "Manual do PDDE – FNDE", "Lei nº 11.947/2009"],
      leisPDDE: ["Lei nº 11.947/2009", "Resolução FNDE nº 15/2021", "Manual de Execução do PDDE"],
    },
    {
      title: "Pesquisa de preços do jeito certo",
      icon: "🧾",
      accent: "bg-[#ffd9c8]",
      unidade: "Unidade da trilha: Como fazer pesquisa de preços",
      text: "A pesquisa de preços deve registrar pelo menos três referências de fornecedores ou valores equivalentes para justificar a escolha da compra.",
      bullets: ["Descrever bem o item", "Comparar fornecedores", "Registrar data e valor"],
      trilha: ["Organização de compras", "Prestação de contas", "Uso correto do recurso"],
      legislacao: ["Resolução FNDE nº 15/2021 – Art. 33", "Manual de Execução do PDDE", "Lei nº 14.133/2021 (referência geral de compras)"],
      leisPDDE: ["Resolução FNDE nº 15/2021 – Art. 33", "Manual de Execução do PDDE", "Normativos do FNDE sobre execução do PDDE"],
    },
  ];

  const suggestions = [
    "PDDE: o que pode comprar?",
    "Como fazer pesquisa de preços?",
    "Como registrar uma ata de reunião?",
    "Quais são as regras de prestação de contas do PDDE?",
    "Quais documentos a escola precisa guardar?",
    "Como funciona a reunião do conselho escolar?",
  ];

  const templates = [
    { icon: "📄", title: "Ata de Reunião", desc: "Modelo oficial" },
    { icon: "📨", title: "Ofício", desc: "Texto formal" },
    { icon: "🔎", title: "Pesquisa de Preços", desc: "Registro de cotações" },
    { icon: "📊", title: "Relatório", desc: "Execução do recurso" },
  ];

  const templateDefaults = {
    "Ata de Reunião": {
      titulo: "Ata de reunião do conselho escolar",
      data: "",
      horario: "",
      local: "",
      participantes: "",
      pauta: "",
      deliberacoes: "",
      encaminhamentos: "",
      fechamento: "Nada mais havendo a tratar, a reunião foi encerrada.",
    },
    "Ofício": {
      numero: "Ofício nº ____/2026",
      destinatario: "",
      cargo: "",
      orgao: "",
      assunto: "",
      corpo: "",
      encerramento: "Atenciosamente,",
      assinatura: "",
    },
    "Pesquisa de Preços": {
      objeto: "",
      item: "",
      fornecedor1: "",
      valor1: "",
      fornecedor2: "",
      valor2: "",
      fornecedor3: "",
      valor3: "",
      justificativa: "",
      responsavel: "",
      data: "",
    },
    "Relatório": {
      titulo: "Relatório de execução",
      periodo: "",
      objetivo: "",
      atividades: "",
      resultados: "",
      dificuldades: "",
      encaminhamentos: "",
      responsavel: "",
    },
  };

  const templateGuides = {
    "Ata de Reunião": [
      { field: "titulo", title: "Título", tip: "Use um nome direto, como Ata de reunião do conselho escolar ou Ata da UEx." },
      { field: "data", title: "Data", tip: "Informe a data completa para facilitar arquivo e conferência futura." },
      { field: "horario", title: "Horário", tip: "Vale registrar o início e, se necessário, o término." },
      { field: "local", title: "Local", tip: "Indique o espaço da reunião ou se foi virtual." },
      { field: "participantes", title: "Participantes", tip: "Liste nomes e funções de quem participou." },
      { field: "pauta", title: "Pauta", tip: "Resuma os assuntos da reunião com clareza." },
      { field: "deliberacoes", title: "Deliberações", tip: "Registre o que foi decidido de forma objetiva." },
      { field: "encaminhamentos", title: "Encaminhamentos", tip: "Anote próximos passos, responsáveis e prazos." },
      { field: "fechamento", title: "Fechamento", tip: "Finalize com uma frase formal e simples." },
    ],
    "Ofício": [
      { field: "numero", title: "Número", tip: "Mantenha um padrão simples de numeração do documento." },
      { field: "destinatario", title: "Destinatário", tip: "Escreva o nome da pessoa ou setor que vai receber o ofício." },
      { field: "cargo", title: "Cargo", tip: "Inclua o cargo para dar formalidade ao documento." },
      { field: "orgao", title: "Órgão", tip: "Indique secretaria, escola, regional ou instituição." },
      { field: "assunto", title: "Assunto", tip: "Use uma linha curta e objetiva." },
      { field: "corpo", title: "Corpo do texto", tip: "Explique o pedido, informação ou encaminhamento sem excessos." },
      { field: "encerramento", title: "Encerramento", tip: "Use uma fórmula de cortesia simples, como Atenciosamente." },
      { field: "assinatura", title: "Assinatura", tip: "Registre nome e função de quem assina o documento." },
    ],
    "Pesquisa de Preços": [
      { field: "objeto", title: "Objeto da compra", tip: "Explique rapidamente o que será adquirido." },
      { field: "item", title: "Item", tip: "Descreva o item com clareza para permitir comparação justa." },
      { field: "fornecedor1", title: "Fornecedor 1", tip: "Indique um fornecedor ou referência consultada." },
      { field: "fornecedor2", title: "Fornecedor 2", tip: "A comparação precisa ser equivalente ao mesmo item." },
      { field: "fornecedor3", title: "Fornecedor 3", tip: "Ter mais de uma referência fortalece a justificativa." },
      { field: "justificativa", title: "Justificativa", tip: "Explique como foi escolhida a proposta mais adequada." },
      { field: "responsavel", title: "Responsável", tip: "Informe quem realizou a pesquisa." },
      { field: "data", title: "Data", tip: "Registre a data da consulta ou consolidação." },
    ],
    "Relatório": [
      { field: "titulo", title: "Título", tip: "Use um nome simples para identificar o relatório." },
      { field: "periodo", title: "Período", tip: "Indique o intervalo de tempo analisado." },
      { field: "objetivo", title: "Objetivo", tip: "Explique o propósito do relatório em poucas linhas." },
      { field: "atividades", title: "Atividades", tip: "Liste o que foi realizado no período." },
      { field: "resultados", title: "Resultados", tip: "Mostre o que foi alcançado ou observado." },
      { field: "dificuldades", title: "Dificuldades", tip: "Registre desafios de forma honesta e objetiva." },
      { field: "encaminhamentos", title: "Encaminhamentos", tip: "Indique próximos passos ou recomendações." },
      { field: "responsavel", title: "Responsável", tip: "Informe nome e função da pessoa responsável." },
    ],
  };

  const createDoc = (templateTitle, suffix = "") => ({
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    template: templateTitle,
    title: suffix ? `${templateTitle} ${suffix}` : templateTitle,
    saved: false,
    formats: {},
    data: JSON.parse(JSON.stringify(templateDefaults[templateTitle])),
  });

  const initialDoc = createDoc("Ata de Reunião");
  initialDoc.id = "ata-1";
  initialDoc.title = "Ata de Reunião";

  const STORAGE_KEY = "caderno-diretora-editor-v1";

  const [tab, setTab] = useState("pesquisa");
  const [question, setQuestion] = useState("Como organizar uma pesquisa de preços do jeito certo para compra com PDDE?");
  const [openDocs, setOpenDocs] = useState([initialDoc]);
  const [activeDocId, setActiveDocId] = useState(initialDoc.id);
  const [saveStatus, setSaveStatus] = useState("Não salvo");
  const [activeGuideField, setActiveGuideField] = useState("titulo");
  const [activeFormatField, setActiveFormatField] = useState("titulo");

  const activeDoc = useMemo(() => openDocs.find((doc) => doc.id === activeDocId) || openDocs[0], [openDocs, activeDocId]);

  const docHasContent = (doc) => {
    if (!doc?.data) return false;
    return Object.values(doc.data).some((value) => String(value || "").trim() !== "");
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.openDocs?.length) {
        setOpenDocs(parsed.openDocs);
        setActiveDocId(parsed.activeDocId || parsed.openDocs[0].id);
        setQuestion(parsed.question || "Como organizar uma pesquisa de preços do jeito certo para compra com PDDE?");
        setSaveStatus("Rascunho restaurado");
      }
    } catch {
      setSaveStatus("Não salvo");
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          openDocs,
          activeDocId,
          question,
        })
      );
    } catch {
      // noop
    }
  }, [openDocs, activeDocId, question]);
  const currentTemplate = activeDoc?.template || "Ata de Reunião";
  const currentData = activeDoc?.data || templateDefaults["Ata de Reunião"];
  const currentFormats = activeDoc?.formats || {};
  const currentTips = templateGuides[currentTemplate] || [];
  const filledFields = currentTips.filter(({ field }) => String(currentData[field] || "").trim()).length;

  const updateCurrentDoc = (updater) => {
    setOpenDocs((prev) => prev.map((doc) => (doc.id === activeDocId ? updater(doc) : doc)));
  };

  const updateField = (field, value) => {
    updateCurrentDoc((doc) => ({
      ...doc,
      saved: false,
      data: {
        ...doc.data,
        [field]: value,
      },
    }));
    setSaveStatus("Alterações não salvas");
  };

  const toggleFieldFormat = (field, formatKey) => {
    updateCurrentDoc((doc) => ({
      ...doc,
      saved: false,
      formats: {
        ...doc.formats,
        [field]: {
          ...(doc.formats[field] || {}),
          [formatKey]: !(doc.formats[field] || {})[formatKey],
        },
      },
    }));
    setSaveStatus("Alterações não salvas");
  };

  const getFieldStyle = (field) => {
    const fmt = currentFormats[field] || {};
    return {
      fontWeight: fmt.bold ? 700 : 400,
      fontStyle: fmt.italic ? "italic" : "normal",
      textDecoration: `${fmt.underline ? "underline " : ""}${fmt.highlight ? "" : ""}`.trim() || "none",
      backgroundColor: fmt.highlight ? "#fff1a8" : undefined,
    };
  };

  const handleSelectTemplate = (templateTitle) => {
    if (!activeDoc) return;
    const hasExistingContent = docHasContent(activeDoc);
    if (activeDoc.template !== templateTitle && hasExistingContent) {
      const confirmed = window.confirm("Trocar o modelo substitui o conteúdo atual deste documento. Deseja continuar?");
      if (!confirmed) return;
    }

    updateCurrentDoc((doc) => ({
      ...doc,
      template: templateTitle,
      title: templateTitle,
      saved: false,
      formats: {},
      data: JSON.parse(JSON.stringify(templateDefaults[templateTitle])),
    }));
    setActiveGuideField(templateGuides[templateTitle]?.[0]?.field || "titulo");
    setActiveFormatField(templateGuides[templateTitle]?.[0]?.field || "titulo");
    setSaveStatus("Novo modelo aberto");
  };

  const handleNewDocument = () => {
    const count = openDocs.filter((doc) => doc.template === currentTemplate).length + 1;
    const newDoc = createDoc(currentTemplate, count > 1 ? String(count) : "");
    setOpenDocs((prev) => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setActiveGuideField(templateGuides[currentTemplate]?.[0]?.field || "titulo");
    setActiveFormatField(templateGuides[currentTemplate]?.[0]?.field || "titulo");
    setSaveStatus("Novo documento criado");
  };

  const handleOpenDocument = (docId) => {
    const doc = openDocs.find((item) => item.id === docId);
    if (!doc) return;
    setActiveDocId(docId);
    setActiveGuideField(templateGuides[doc.template]?.[0]?.field || "titulo");
    setActiveFormatField(templateGuides[doc.template]?.[0]?.field || "titulo");
    setSaveStatus(doc.saved ? "Salvo" : "Alterações não salvas");
  };

  const handleCloseDocument = (docId) => {
    const targetDoc = openDocs.find((doc) => doc.id === docId);
    if (targetDoc && !targetDoc.saved && docHasContent(targetDoc)) {
      const confirmed = window.confirm("Este documento tem alterações não salvas. Deseja fechar mesmo assim?");
      if (!confirmed) return;
    }

    if (openDocs.length === 1) {
      const fresh = createDoc(currentTemplate);
      setOpenDocs([fresh]);
      setActiveDocId(fresh.id);
      setSaveStatus("Novo documento criado");
      return;
    }

    const remaining = openDocs.filter((doc) => doc.id !== docId);
    setOpenDocs(remaining);
    if (activeDocId === docId) {
      setActiveDocId(remaining[0].id);
      setActiveGuideField(templateGuides[remaining[0].template]?.[0]?.field || "titulo");
      setActiveFormatField(templateGuides[remaining[0].template]?.[0]?.field || "titulo");
      setSaveStatus(remaining[0].saved ? "Salvo" : "Alterações não salvas");
    }
  };

  const handleSaveDocument = () => {
    updateCurrentDoc((doc) => ({ ...doc, saved: true }));
    setSaveStatus(`Salvo às ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
  };

  const handleRenameDocument = () => {
    if (!activeDoc) return;
    const nextTitle = window.prompt("Novo nome do documento:", activeDoc.title);
    if (!nextTitle || !nextTitle.trim()) return;
    updateCurrentDoc((doc) => ({ ...doc, title: nextTitle.trim(), saved: false }));
    setSaveStatus("Nome alterado");
  };

  const renderDocumentHtml = () => {
    if (!activeDoc) return "";
    const data = activeDoc.data;
    if (activeDoc.template === "Ata de Reunião") {
      return `
        <h1>${data.titulo || "Ata de Reunião"}</h1>
        <p>Aos ${data.data || "___"}, às ${data.horario || "___"}, no local ${data.local || "___"}, realizou-se a reunião com a presença de ${data.participantes || "___"}.</p>
        <p><strong>Pauta:</strong> ${data.pauta || "___"}</p>
        <p><strong>Deliberações:</strong> ${data.deliberacoes || "___"}</p>
        <p><strong>Encaminhamentos:</strong> ${data.encaminhamentos || "___"}</p>
        <p>${data.fechamento || "___"}</p>
      `;
    }
    if (activeDoc.template === "Ofício") {
      return `
        <h1>${data.numero || "Ofício"}</h1>
        <p>À ${data.destinatario || "___"}<br/>${data.cargo || "___"}<br/>${data.orgao || "___"}</p>
        <p><strong>Assunto:</strong> ${data.assunto || "___"}</p>
        <p>${data.corpo || "___"}</p>
        <p>${data.encerramento || "___"}</p>
        <p>${data.assinatura || "___"}</p>
      `;
    }
    if (activeDoc.template === "Pesquisa de Preços") {
      return `
        <h1>Pesquisa de Preços</h1>
        <p><strong>Objeto:</strong> ${data.objeto || "___"}</p>
        <p><strong>Item:</strong> ${data.item || "___"}</p>
        <ul>
          <li>${data.fornecedor1 || "Fornecedor 1"}: ${data.valor1 || "___"}</li>
          <li>${data.fornecedor2 || "Fornecedor 2"}: ${data.valor2 || "___"}</li>
          <li>${data.fornecedor3 || "Fornecedor 3"}: ${data.valor3 || "___"}</li>
        </ul>
        <p><strong>Justificativa:</strong> ${data.justificativa || "___"}</p>
        <p>Responsável: ${data.responsavel || "___"} | Data: ${data.data || "___"}</p>
      `;
    }
    return `
      <h1>${data.titulo || "Relatório"}</h1>
      <p><strong>Período:</strong> ${data.periodo || "___"}</p>
      <p><strong>Objetivo:</strong> ${data.objetivo || "___"}</p>
      <p><strong>Atividades:</strong> ${data.atividades || "___"}</p>
      <p><strong>Resultados:</strong> ${data.resultados || "___"}</p>
      <p><strong>Dificuldades:</strong> ${data.dificuldades || "___"}</p>
      <p><strong>Encaminhamentos:</strong> ${data.encaminhamentos || "___"}</p>
      <p><strong>Responsável:</strong> ${data.responsavel || "___"}</p>
    `;
  };

  const handleDownloadWord = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeDoc.title}</title></head><body>${renderDocumentHtml()}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.title}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(`<!DOCTYPE html><html><head><title>${activeDoc.title}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:40px;line-height:1.6;color:#4d372e}h1{font-size:22px}</style></head><body>${renderDocumentHtml()}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const InlineField = ({ field, placeholder, multiline = false, className = "" }) => {
    const baseClass = `rounded-xl border border-[#e6dad2] bg-[#fffaf6] px-3 py-2 text-[#5f4032] outline-none focus:border-[#caa798] focus:ring-2 focus:ring-[#ead2c4] ${className}`;
    const style = getFieldStyle(field);

    if (multiline) {
      return (
        <textarea
          value={currentData[field] || ""}
          onChange={(e) => updateField(field, e.target.value)}
          onFocus={() => {
            setActiveGuideField(field);
            setActiveFormatField(field);
          }}
          placeholder={placeholder}
          style={style}
          className={`${baseClass} mt-2 min-h-[110px] w-full resize-none`}
        />
      );
    }

    return (
      <input
        value={currentData[field] || ""}
        onChange={(e) => updateField(field, e.target.value)}
        onFocus={() => {
          setActiveGuideField(field);
          setActiveFormatField(field);
        }}
        placeholder={placeholder}
        style={style}
        className={`${baseClass} inline-block min-w-[180px]`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#efe6dc] text-[#5a3328] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.75), transparent 18%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.4), transparent 16%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.35), transparent 20%)" }} />
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "linear-gradient(rgba(120,78,62,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(120,78,62,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <main className="relative z-10 max-w-[1500px] mx-auto px-6 py-10 md:px-8">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#d8b8ad] bg-[#fff7f3]/90 px-5 py-2 shadow-sm">
            <span className="text-lg">📕</span>
            <span className="text-sm tracking-[0.22em] uppercase text-[#9a5a4f]">Caderneta da Diretora</span>
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl font-black">Caderno da Diretora</h1>
          <p className="mt-3 text-lg md:text-xl text-[#8b5a4d]">Uma mesa de apoio para pesquisar orientações e montar documentos escolares</p>

          <div className="mt-6 inline-flex rounded-full border border-[#d9bfb5] bg-[#fff8f4] p-1 shadow-sm">
            <button onClick={() => setTab("pesquisa")} className={`rounded-full px-6 md:px-8 py-3 font-semibold transition-colors ${tab === "pesquisa" ? "bg-[#8e2f2f] text-white shadow-sm" : "text-[#7d6153] hover:bg-[#f3ebe5]"}`}>Folha de Pesquisa</button>
            <button onClick={() => setTab("editor")} className={`rounded-full px-6 md:px-8 py-3 font-semibold transition-colors ${tab === "editor" ? "bg-[#8e2f2f] text-white shadow-sm" : "text-[#7d6153] hover:bg-[#f3ebe5]"}`}>Editor de Documentos</button>
          </div>
        </header>

        {tab === "pesquisa" && (
          <section className="max-w-[1280px] mx-auto space-y-10">
            <section className="relative rounded-[44px] bg-[linear-gradient(180deg,#a73c3c_0%,#8e2f2f_45%,#742020_100%)] p-4 md:p-5 shadow-[0_36px_90px_rgba(94,36,36,0.34)] ring-1 ring-[#b65454]/40">
              <div className="absolute inset-x-[6%] top-3 h-5 rounded-full bg-black/15 blur-md pointer-events-none" />
              <div className="absolute inset-[10px] rounded-[36px] border border-[#c96f6f]/40 pointer-events-none" />
              <div className="absolute inset-x-8 top-5 h-8 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-0 rounded-[34px] overflow-hidden bg-[linear-gradient(180deg,#7f2626_0%,#6f1f1f_100%)] border border-[#692020]">
                <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[90px] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.18)_35%,rgba(0,0,0,0.05)_60%,transparent_75%)] opacity-40" />
                <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-[linear-gradient(180deg,#5a1717_0%,#8e2f2f_50%,#5a1717_100%)] opacity-70" />
                <div className="relative bg-[#fbf4eb] min-h-[720px] p-6 md:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#e8d6c7]">
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1e7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a5a4f] shadow-sm"><span>✍️</span><span>Pergunte à Secretaria Virtual</span></div>
                        <h3 className="mt-4 text-3xl font-black leading-tight">Folha de pesquisa</h3>
                        <p className="mt-3 max-w-xl text-[#7b5b4d] leading-7">Como se fosse uma caderneta aberta: do lado esquerdo você escreve a pergunta e do lado direito recebe uma resposta organizada de um jeito mais bonito e útil.</p>
                      </div>
                      <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8e2f2f] text-white shadow-lg">📎</div>
                    </div>

                    <div className="mt-8 rounded-[28px] border border-[#ead9cd] bg-white/75 p-5 shadow-[0_14px_30px_rgba(95,64,50,0.08)] backdrop-blur-sm">
                      <label className="text-xs uppercase tracking-[0.2em] text-[#a38778]">Escreva sua pergunta</label>
                      <div className="mt-3 flex gap-3 items-start">
                        <textarea className="min-h-[150px] flex-1 resize-none rounded-[22px] border border-[#e4d8cf] bg-[#fffdfa] px-5 py-4 text-lg text-[#5f4032] outline-none" value={question} onChange={(e) => setQuestion(e.target.value)} />
                        <button className="shrink-0 rounded-[22px] bg-[#8e2f2f] hover:bg-[#7d2828] text-white px-5 py-5 shadow-lg transition-colors">✈️</button>
                      </div>
                    </div>

                    <div className="mt-7">
                      <div className="text-xs uppercase tracking-[0.2em] text-[#a38778] mb-3">Sugestões de perguntas</div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {suggestions.map((s, idx) => (
                          <button key={s} onClick={() => setQuestion(s)} className={`group rounded-[24px] border border-[#e4d7ce] bg-[#fffaf6] p-4 text-left shadow-sm hover:-translate-y-1 hover:shadow-md transition-all ${idx % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.5deg]"}`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1a8] text-lg shadow-sm">{idx === 0 ? "💰" : idx === 1 ? "📝" : idx === 2 ? "🧾" : idx === 3 ? "📂" : "🏫"}</div>
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a38778] mb-1">Clique para usar</div>
                                <div className="font-semibold leading-6 text-[#5f4032] group-hover:text-[#4c3024]">{s}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[#f7ede2] min-h-[720px] p-6 md:p-8 lg:p-10 lg:min-h-[820px]">
                  <div className="absolute left-8 top-6 rounded-full border border-[#d9bfb5] bg-[#fff8f4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a5a4f] shadow-sm">Orientações práticas</div>
                  <div className="relative z-10 pt-14 h-[720px] overflow-y-auto pr-3 pl-2 space-y-6">
                    <div className="rounded-[26px] border border-[#e4d7ce] bg-[#fff8f4] p-5 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#9a5a4f] mb-2">Base legal do PDDE</div>
                      <p className="text-sm text-[#7b5b4d] mb-3">Principais normas que orientam o uso dos recursos do programa.</p>
                      <ul className="space-y-2 text-sm text-[#5f4032]">{cards[0].leisPDDE.map((lei) => <li key={lei} className="flex items-center gap-2">📚 {lei}</li>)}</ul>
                    </div>

                    {cards.map((card, idx) => (
                      <article key={card.title} className={`relative overflow-hidden rounded-[28px] border border-[#e4d7ce] bg-[#fffdf9] shadow-[0_16px_34px_rgba(95,64,50,0.10)] ${idx === 0 ? "rotate-[-0.6deg]" : "rotate-[0.6deg]"}`}>
                        <div className="border-b border-[#efe5dd] bg-[linear-gradient(180deg,#fffaf4_0%,#fffdf9_100%)] px-5 pt-5 pb-4">
                          <div className="flex items-start gap-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${card.accent} text-2xl shadow-sm`}>{card.icon}</div>
                            <div className="flex-1">
                              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff08f] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#75591d]">📍 Orientação da trilha</div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <a href={trilhaLinks[card.unidade.replace("Unidade da trilha: ", "")] || "#trilha"} className="inline-flex items-center rounded-full border border-[#ead8cc] bg-[#fff8f3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a5a4f]">{card.unidade}</a>
                                <a href={trilhaLinks[card.unidade.replace("Unidade da trilha: ", "")] || "#trilha"} className="inline-flex items-center gap-2 rounded-full bg-[#8e2f2f] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-sm"><span>↗</span><span>Ver na trilha</span></a>
                              </div>
                              <h4 className="mt-3 text-2xl font-bold leading-tight">{card.title}</h4>
                              <p className="mt-3 text-[#71574b] leading-7">{card.text}</p>
                            </div>
                          </div>
                        </div>

                        <div className="px-5 py-5 space-y-5">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-[#a38778] mb-3">O que observar</div>
                            <ul className="space-y-3">{card.bullets.map((item) => <li key={item} className="flex items-start gap-3 rounded-2xl bg-[#fcf6ef] px-4 py-3 text-[#5f4032]"><span className="mt-0.5 text-[#8b6d5f]">✓</span><span>{item}</span></li>)}</ul>
                          </div>
                          <div className="rounded-[22px] border border-dashed border-[#e4d8cf] bg-[#fffaf6] px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-[#a38778] mb-2">Outras unidades da trilha para visitar</div>
                            <ul className="space-y-2 text-[#6d5347]">{card.trilha.map((u) => <li key={u} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"><span className="flex items-center gap-2">📘 {u}</span><a href={trilhaLinks[u] || "#trilha"} className="shrink-0 rounded-full border border-[#e4d8cf] bg-[#fff8f3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8e2f2f]">Ver unidade</a></li>)}</ul>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-bold">Notas do Caderno</h3>
                <span className="rounded-full bg-[#fff6ef] border border-[#e4d7ce] px-4 py-2 text-sm text-[#8b6d5f] shadow-sm">Lembretes rápidos</span>
              </div>
              <div className="grid md:grid-cols-3 gap-5">{notes.map((note) => <div key={note.id} className={`relative bg-[#fff4a8] rounded-md p-5 shadow-[0_12px_24px_rgba(95,64,50,0.12)] ${note.color}`}><div className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-16 bg-[#f7dfcf] rounded-sm" /><p className="text-sm leading-6">{note.text}</p></div>)}</div>
            </section>
          </section>
        )}

        {tab === "editor" && activeDoc && (
          <section className="max-w-[1280px] mx-auto">
            <div className="rounded-[34px] border border-[#dacdc4] bg-[#fcf8f3] shadow-[0_24px_60px_rgba(95,64,50,0.10)] overflow-hidden">
              <div className="p-6 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-[linear-gradient(180deg,#fffaf6_0%,#f7efe8_100%)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a18475]">Editor</p>
                  <h2 className="text-2xl font-bold mt-1">Documentos escolares</h2>
                  <p className="mt-2 text-[#8a6d5f]">Abra documentos em abas, salve, feche, baixe em Word ou PDF e formate o texto enquanto escreve.</p>
                </div>
                <span className="text-3xl">🗂️</span>
              </div>

              <div className="p-6 border-b bg-[#faf4ee]">
                <div className="rounded-[24px] bg-white border p-4 mb-6">
                  <div className="text-sm font-semibold">Identificação da escola</div>
                  <div className="mt-3 flex gap-2">
                    <input className="w-[150px] rounded-xl border px-3 py-2" placeholder="Código INEP" maxLength={8} inputMode="numeric" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 8); }} />
                    <button className="rounded-xl bg-[#b3a096] px-4 py-2 text-white">Buscar</button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {openDocs.map((doc) => (
                    <div key={doc.id} className={`inline-flex items-center gap-2 rounded-t-[16px] border px-4 py-3 text-sm font-semibold shadow-sm transition-all ${activeDocId === doc.id ? "border-[#8e2f2f] bg-white text-[#8e2f2f]" : "border-[#ddd0c6] bg-[#f4e9df] text-[#7d6153]"}`}>
                      <button onClick={() => handleOpenDocument(doc.id)} className="inline-flex items-center gap-2">
                        <span>{doc.title}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${doc.saved ? "bg-[#58a56a]" : "bg-[#d18463]"}`} />
                      </button>
                      <button onClick={() => handleCloseDocument(doc.id)} className="ml-1 rounded-full px-2 py-0.5 text-xs hover:bg-black/5">✕</button>
                    </div>
                  ))}
                  <button onClick={handleNewDocument} className="inline-flex items-center gap-2 rounded-t-[16px] border border-dashed border-[#cfae9f] bg-[#fff8f3] px-4 py-3 text-sm font-semibold text-[#8e2f2f] shadow-sm hover:bg-[#fff1e8] transition-colors"><span>＋</span><span>Novo Documento</span></button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-[20px] border border-[#ead8cc] bg-white p-4 shadow-sm">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#a38778]">Documento ativo</div>
                    <div className="mt-1 flex items-center gap-2 font-semibold text-[#6c4e42]">
                      <span>{activeDoc.title}</span>
                      <button onClick={handleRenameDocument} className="rounded-full border border-[#ead8cc] bg-[#fff8f3] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8e2f2f]">Renomear</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[#ead8cc] bg-[#fff8f3] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b6d5f]">{saveStatus}</span>
                    <button onClick={handleSaveDocument} className="rounded-full bg-[#8e2f2f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7d2828]">Salvar</button>
                    <button onClick={handleDownloadWord} className="rounded-full border border-[#d8c9be] bg-white px-4 py-2 text-sm font-semibold text-[#6f4b3b]">Baixar Word</button>
                    <button onClick={handleDownloadPdf} className="rounded-full border border-[#d8c9be] bg-white px-4 py-2 text-sm font-semibold text-[#6f4b3b]">Baixar PDF</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {templates.map((item) => (
                    <button key={item.title} onClick={() => handleSelectTemplate(item.title)} className={`cursor-pointer rounded-[20px] border p-4 text-left shadow transition-all hover:-translate-y-1 ${currentTemplate === item.title ? "bg-[#8e2f2f] text-white border-[#8e2f2f]" : "bg-white hover:bg-[#fff8f3]"}`}>
                      <div className="text-2xl">{item.icon}</div>
                      <div className="mt-3 font-bold">{item.title}</div>
                      <div className={`text-sm ${currentTemplate === item.title ? "text-white/85" : "text-[#8a6d5f]"}`}>{item.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-[#ead8cc] bg-white p-3 shadow-sm">
                  <span className="text-xs uppercase tracking-[0.16em] text-[#a38778] px-2">Formatação</span>
                  <button onClick={() => toggleFieldFormat(activeFormatField, "bold")} className={`rounded-lg px-3 py-2 text-sm font-bold ${currentFormats[activeFormatField]?.bold ? "bg-[#8e2f2f] text-white" : "bg-[#f6ebe4] text-[#6f4b3b]"}`}>B</button>
                  <button onClick={() => toggleFieldFormat(activeFormatField, "italic")} className={`rounded-lg px-3 py-2 text-sm italic ${currentFormats[activeFormatField]?.italic ? "bg-[#8e2f2f] text-white" : "bg-[#f6ebe4] text-[#6f4b3b]"}`}>I</button>
                  <button onClick={() => toggleFieldFormat(activeFormatField, "underline")} className={`rounded-lg px-3 py-2 text-sm underline ${currentFormats[activeFormatField]?.underline ? "bg-[#8e2f2f] text-white" : "bg-[#f6ebe4] text-[#6f4b3b]"}`}>U</button>
                  <button onClick={() => toggleFieldFormat(activeFormatField, "highlight")} className={`rounded-lg px-3 py-2 text-sm ${currentFormats[activeFormatField]?.highlight ? "bg-[#fff08f] text-[#6f4b3b]" : "bg-[#f6ebe4] text-[#6f4b3b]"}`}>Grifado</button>
                  <span className="ml-auto rounded-full bg-[#fff8f3] px-3 py-2 text-xs text-[#8b6d5f] border border-[#ead8cc]">Campo em edição: {activeFormatField}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.22fr_0.78fr] gap-0">
                <div className="p-4 md:p-6 border-b xl:border-b-0 xl:border-r border-[#eadfd7] bg-[#efe5da]">
                  <div className="flex items-center justify-between gap-4 mb-5 px-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#a38778]">Modelo oficial</div>
                      <h3 className="mt-2 text-3xl font-bold">{currentTemplate}</h3>
                    </div>
                    <span className="rounded-full bg-[#fff1e7] px-4 py-2 text-sm text-[#8e2f2f] border border-[#ead8cc]">{filledFields}/{currentTips.length} pontos preenchidos</span>
                  </div>

                  <div className="relative rounded-[10px] border border-[#d7cac0] bg-white shadow-[0_24px_44px_rgba(95,64,50,0.14)] min-h-[980px] max-w-[820px] mx-auto overflow-visible">
                    <div className="absolute -inset-x-3 top-6 h-[92%] rounded-[14px] bg-black/5 blur-2xl -z-10" />
                    <div className="absolute left-0 right-0 top-0 h-10 bg-[linear-gradient(180deg,#f7f0e9_0%,#fff_100%)] border-b border-[#ece2da]" />
                    <div className="absolute left-0 right-0 top-10 h-[6px] bg-[#8e2f2f]" />
                    <div className="relative z-10 px-8 md:px-12 pt-16 pb-10 text-[#5e4034] leading-8">
                      <div className="text-center border-b border-dashed border-[#e5d8cf] pb-6 mb-8">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-[#9c7d6f]">Documento escolar</div>
                        <div className="mt-2 text-2xl font-black tracking-[0.08em] text-[#6a4738]">{currentTemplate}</div>
                        <div className="mt-2 text-sm text-[#9b7b6d]">Modelo editável com preenchimento direto na folha</div>
                      </div>

                      <div className="space-y-6 text-[17px] leading-8">
                        {currentTemplate === "Ata de Reunião" && (
                          <>
                            <InlineField field="titulo" placeholder="Título da ata" className="w-full text-xl font-bold bg-transparent border-dashed shadow-none" />
                            <p>Aos <InlineField field="data" placeholder="data da reunião" className="mx-1 bg-white/90 border-dashed" />, às <InlineField field="horario" placeholder="horário" className="mx-1 min-w-[120px] bg-white/90 border-dashed" />, no local <InlineField field="local" placeholder="local" className="mx-1 min-w-[180px] bg-white/90 border-dashed" />, realizou-se a reunião com a presença de:</p>
                            <InlineField field="participantes" placeholder="nomes e funções dos participantes" multiline className="bg-white/90 border-dashed" />
                            <p>A pauta da reunião tratou de:</p>
                            <InlineField field="pauta" placeholder="descreva os temas discutidos" multiline className="bg-white/90 border-dashed" />
                            <p>Após as discussões, ficou deliberado que:</p>
                            <InlineField field="deliberacoes" placeholder="registre as decisões" multiline className="bg-white/90 border-dashed" />
                            <p>Como encaminhamentos, definiu-se que:</p>
                            <InlineField field="encaminhamentos" placeholder="indique responsáveis e próximos passos" multiline className="bg-white/90 border-dashed" />
                            <InlineField field="fechamento" placeholder="frase de encerramento" className="w-full bg-transparent border-dashed" />
                          </>
                        )}

                        {currentTemplate === "Ofício" && (
                          <>
                            <InlineField field="numero" placeholder="Ofício nº ____/2026" className="w-full font-semibold bg-transparent border-dashed shadow-none" />
                            <p>À <InlineField field="destinatario" placeholder="nome do destinatário" className="mx-1 min-w-[220px] bg-white/90 border-dashed" />,</p>
                            <p><InlineField field="cargo" placeholder="cargo" className="mr-2 min-w-[180px] bg-white/90 border-dashed" /><InlineField field="orgao" placeholder="órgão ou instituição" className="min-w-[220px] bg-white/90 border-dashed" /></p>
                            <p><strong>Assunto:</strong> <InlineField field="assunto" placeholder="assunto do ofício" className="mx-2 min-w-[280px] bg-white/90 border-dashed" /></p>
                            <p>Prezada(o),</p>
                            <InlineField field="corpo" placeholder="escreva aqui o conteúdo do ofício" multiline className="min-h-[180px] bg-white/90 border-dashed" />
                            <InlineField field="encerramento" placeholder="encerramento" className="w-full bg-transparent border-dashed" />
                            <InlineField field="assinatura" placeholder="nome e função de quem assina" className="w-full bg-transparent border-dashed" />
                          </>
                        )}

                        {currentTemplate === "Pesquisa de Preços" && (
                          <>
                            <h4 className="text-xl font-bold">Mapa de pesquisa de preços</h4>
                            <p>Objeto da compra: <InlineField field="objeto" placeholder="descreva o objeto" className="mx-2 min-w-[320px] bg-white/90 border-dashed" /></p>
                            <p>Item pesquisado: <InlineField field="item" placeholder="nome e especificação do item" className="mx-2 min-w-[320px] bg-white/90 border-dashed" /></p>
                            <div className="space-y-4 rounded-[24px] border border-[#eadfd7] bg-[#fffaf6] p-4">
                              <div className="grid md:grid-cols-[1fr_160px] gap-3 items-center"><InlineField field="fornecedor1" placeholder="Fornecedor 1" className="w-full bg-white/90 border-dashed" /><InlineField field="valor1" placeholder="Valor" className="w-full bg-white/90 border-dashed" /></div>
                              <div className="grid md:grid-cols-[1fr_160px] gap-3 items-center"><InlineField field="fornecedor2" placeholder="Fornecedor 2" className="w-full bg-white/90 border-dashed" /><InlineField field="valor2" placeholder="Valor" className="w-full bg-white/90 border-dashed" /></div>
                              <div className="grid md:grid-cols-[1fr_160px] gap-3 items-center"><InlineField field="fornecedor3" placeholder="Fornecedor 3" className="w-full bg-white/90 border-dashed" /><InlineField field="valor3" placeholder="Valor" className="w-full bg-white/90 border-dashed" /></div>
                            </div>
                            <p>Justificativa da escolha:</p>
                            <InlineField field="justificativa" placeholder="explique a escolha da proposta" multiline className="bg-white/90 border-dashed" />
                            <p>Pesquisa realizada por <InlineField field="responsavel" placeholder="responsável" className="mx-2 min-w-[220px] bg-white/90 border-dashed" /> em <InlineField field="data" placeholder="data" className="mx-2 min-w-[160px] bg-white/90 border-dashed" />.</p>
                          </>
                        )}

                        {currentTemplate === "Relatório" && (
                          <>
                            <InlineField field="titulo" placeholder="Título do relatório" className="w-full text-xl font-bold bg-transparent border-dashed" />
                            <p>Período de referência: <InlineField field="periodo" placeholder="informe o período" className="mx-2 min-w-[260px] bg-white/90 border-dashed" /></p>
                            <p>Objetivo do relatório:</p>
                            <InlineField field="objetivo" placeholder="explique o objetivo" multiline className="bg-white/90 border-dashed" />
                            <p>Atividades realizadas:</p>
                            <InlineField field="atividades" placeholder="descreva as atividades" multiline className="bg-white/90 border-dashed" />
                            <p>Resultados observados:</p>
                            <InlineField field="resultados" placeholder="registre os resultados" multiline className="bg-white/90 border-dashed" />
                            <p>Dificuldades encontradas:</p>
                            <InlineField field="dificuldades" placeholder="aponte dificuldades, se houver" multiline className="bg-white/90 border-dashed" />
                            <p>Encaminhamentos e próximos passos:</p>
                            <InlineField field="encaminhamentos" placeholder="descreva os encaminhamentos" multiline className="bg-white/90 border-dashed" />
                            <p>Responsável: <InlineField field="responsavel" placeholder="nome e função" className="mx-2 min-w-[260px] bg-white/90 border-dashed" /></p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="relative p-6 md:p-8 bg-[linear-gradient(180deg,#f8efe8_0%,#f5e8de_100%)]">
                  <div className="sticky top-6">
                    <div className="absolute -left-8 top-6 bottom-6 hidden xl:flex flex-col items-end gap-2">
                      {currentTips.map((item) => {
                        const isFilled = String(currentData[item.field] || "").trim();
                        const isActive = activeGuideField === item.field;
                        return (
                          <button key={item.field} onClick={() => setActiveGuideField(item.field)} className={`group relative h-11 w-24 rounded-r-full rounded-l-[10px] border border-[#d7c7bb] text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm transition-all ${isActive ? "translate-x-3 bg-[#8e2f2f] text-white" : isFilled ? "bg-[#e9ddd2] text-[#6f4b3b] hover:translate-x-2" : "bg-[#fff8f4] text-[#a15f49] hover:translate-x-2"}`} title={item.title}><span className="block truncate px-3 text-left">{item.title}</span><span className={`absolute -right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white ${isFilled ? "bg-[#5da56d]" : "bg-[#d18b6c]"}`} /></button>
                        );
                      })}
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[24px] border border-[#eadfd7] bg-white p-5 shadow-sm">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#a38778]">Acompanhamento</div>
                        <h4 className="mt-2 text-2xl font-bold">Dicas para escrever</h4>
                        <p className="mt-2 text-[#7b5b4d] leading-7">As linguinhas laterais mostram pendências. Você pode clicar nelas ou focar num campo do documento para destacar a orientação correspondente.</p>
                      </div>

                      {currentTips.map((item, idx) => {
                        const isFilled = String(currentData[item.field] || "").trim();
                        const isActive = activeGuideField === item.field;
                        return (
                          <div key={item.field} onClick={() => setActiveGuideField(item.field)} className={`cursor-pointer rounded-[22px] border p-4 transition-all ${isActive ? "border-[#8e2f2f] bg-white shadow-md" : isFilled ? "border-[#d7c7bb] bg-white" : "border-[#eadfd7] bg-[#fff8f4]"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f6ebe4] text-[11px] font-bold text-[#8e2f2f]">{idx + 1}</span><div className="text-[11px] uppercase tracking-[0.16em] text-[#a38778]">{item.title}</div></div>
                                <p className="mt-2 text-sm leading-6 text-[#6c4e42]">{item.tip}</p>
                              </div>
                              <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isFilled ? "bg-[#e7f4ea] text-[#3d7a4e]" : "bg-[#f6e9df] text-[#a15f49]"}`}>{isFilled ? "Preenchido" : "Pendente"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
