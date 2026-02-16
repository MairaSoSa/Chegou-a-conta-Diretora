import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Mail, Search, BarChart3,
  Plus, Bold, Italic, List, ListOrdered, Heading2,
  Sparkles, PenLine, CheckSquare, AlertTriangle, SpellCheck,
  RefreshCw, ChevronLeft, ChevronRight, Clock, Menu, X,
  School, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentData {
  id: number;
  type: string;
  title: string;
  inep: string | null;
  header_data: string | null;
  body_html: string;
  status: string;
  quality_score: string;
  logo_url: string | null;
  created_at: number;
  updated_at: number;
}

interface EscolaData {
  inep: string;
  nome: string;
  municipio: string;
  uf: string;
  rede: string;
  localizacao: string;
  matriculas: number;
}

interface VersionData {
  id: number;
  document_id: number;
  created_at: number;
}

const DOC_TYPES = [
  { value: "ata", label: "Ata de Reunião", icon: FileText },
  { value: "oficio", label: "Ofício", icon: Mail },
  { value: "pesquisa", label: "Pesquisa de Preços", icon: Search },
  { value: "relatorio", label: "Relatório de Execução", icon: BarChart3 },
] as const;

const AI_ACTIONS = [
  { action: "rewrite", label: "Reescrever", icon: PenLine },
  { action: "grammar", label: "Gramática", icon: SpellCheck },
  { action: "completeness", label: "Completude", icon: CheckSquare },
  { action: "checklist", label: "Checklist", icon: CheckSquare },
  { action: "inconsistencies", label: "Inconsistências", icon: AlertTriangle },
] as const;

function qualityColor(score: string) {
  if (score === "green") return "bg-green-500";
  if (score === "yellow") return "bg-yellow-500";
  return "bg-red-500";
}

function formatDate(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatDateTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function typeLabel(type: string) {
  const t = DOC_TYPES.find((d) => d.value === type);
  return t ? t.label : type;
}

function HeaderFieldsAta({ headerData, onChange }: { headerData: any; onChange: (d: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Data</label>
        <Input value={headerData.data || ""} onChange={(e) => onChange({ ...headerData, data: e.target.value })} placeholder="dd/mm/aaaa" className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Local</label>
        <Input value={headerData.local || ""} onChange={(e) => onChange({ ...headerData, local: e.target.value })} placeholder="Sala de reuniões..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-[#5d4037]">Participantes</label>
        <Input value={headerData.participantes || ""} onChange={(e) => onChange({ ...headerData, participantes: e.target.value })} placeholder="Nome dos participantes..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-[#5d4037]">Pauta</label>
        <Input value={headerData.pauta || ""} onChange={(e) => onChange({ ...headerData, pauta: e.target.value })} placeholder="Assuntos a serem tratados..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
    </div>
  );
}

function HeaderFieldsOficio({ headerData, onChange }: { headerData: any; onChange: (d: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Número</label>
        <Input value={headerData.numero || ""} onChange={(e) => onChange({ ...headerData, numero: e.target.value })} placeholder="001/2025" className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Data</label>
        <Input value={headerData.data || ""} onChange={(e) => onChange({ ...headerData, data: e.target.value })} placeholder="dd/mm/aaaa" className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Destinatário</label>
        <Input value={headerData.destinatario || ""} onChange={(e) => onChange({ ...headerData, destinatario: e.target.value })} placeholder="Nome do destinatário..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Assunto</label>
        <Input value={headerData.assunto || ""} onChange={(e) => onChange({ ...headerData, assunto: e.target.value })} placeholder="Assunto do ofício..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
    </div>
  );
}

function HeaderFieldsPesquisa({ headerData, onChange }: { headerData: any; onChange: (d: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-[#5d4037]">Objeto</label>
        <Input value={headerData.objeto || ""} onChange={(e) => onChange({ ...headerData, objeto: e.target.value })} placeholder="Descrição do objeto..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Data</label>
        <Input value={headerData.data || ""} onChange={(e) => onChange({ ...headerData, data: e.target.value })} placeholder="dd/mm/aaaa" className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Fornecedor 1</label>
        <Input value={headerData.fornecedor1 || ""} onChange={(e) => onChange({ ...headerData, fornecedor1: e.target.value })} placeholder="Nome/CNPJ..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Fornecedor 2</label>
        <Input value={headerData.fornecedor2 || ""} onChange={(e) => onChange({ ...headerData, fornecedor2: e.target.value })} placeholder="Nome/CNPJ..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Fornecedor 3</label>
        <Input value={headerData.fornecedor3 || ""} onChange={(e) => onChange({ ...headerData, fornecedor3: e.target.value })} placeholder="Nome/CNPJ..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
    </div>
  );
}

function HeaderFieldsRelatorio({ headerData, onChange }: { headerData: any; onChange: (d: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Período</label>
        <Input value={headerData.periodo || ""} onChange={(e) => onChange({ ...headerData, periodo: e.target.value })} placeholder="Jan-Dez 2025" className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Programa</label>
        <Input value={headerData.programa || ""} onChange={(e) => onChange({ ...headerData, programa: e.target.value })} placeholder="PDDE Básico..." className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
      <div>
        <label className="text-xs font-medium text-[#5d4037]">Valor Total</label>
        <Input value={headerData.valorTotal || ""} onChange={(e) => onChange({ ...headerData, valorTotal: e.target.value })} placeholder="R$ 0,00" className="border-[#8d6e63]/30 bg-[#faf5f0]" />
      </div>
    </div>
  );
}

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-1 border-b border-[#8d6e63]/20 px-3 py-2 bg-[#efebe9] rounded-t-lg">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-[#8d6e63]/20 transition ${editor.isActive("bold") ? "bg-[#8d6e63]/30 text-[#5d4037]" : "text-[#6d4c41]"}`} title="Negrito">
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-[#8d6e63]/20 transition ${editor.isActive("italic") ? "bg-[#8d6e63]/30 text-[#5d4037]" : "text-[#6d4c41]"}`} title="Itálico">
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-[#8d6e63]/20 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-[#8d6e63]/20 transition ${editor.isActive("heading", { level: 2 }) ? "bg-[#8d6e63]/30 text-[#5d4037]" : "text-[#6d4c41]"}`} title="Título">
        <Heading2 className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-[#8d6e63]/20 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-[#8d6e63]/20 transition ${editor.isActive("bulletList") ? "bg-[#8d6e63]/30 text-[#5d4037]" : "text-[#6d4c41]"}`} title="Lista">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-[#8d6e63]/20 transition ${editor.isActive("orderedList") ? "bg-[#8d6e63]/30 text-[#5d4037]" : "text-[#6d4c41]"}`} title="Lista Numerada">
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function DocumentEditor() {
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("ata");
  const [title, setTitle] = useState("");
  const [headerData, setHeaderData] = useState<any>({});
  const [inepCode, setInepCode] = useState("");
  const [escola, setEscola] = useState<EscolaData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [inepLoading, setInepLoading] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: docsResponse, isLoading: docsLoading } = useQuery({
    queryKey: ["caderno-documentos"],
    queryFn: async () => {
      const res = await fetch("/api/caderno/documentos");
      if (!res.ok) throw new Error("Erro ao buscar documentos");
      return res.json();
    },
  });

  const documents: DocumentData[] = docsResponse?.documents || [];

  const { data: versionsResponse } = useQuery({
    queryKey: ["caderno-versoes", selectedDocId],
    queryFn: async () => {
      if (!selectedDocId) return null;
      const res = await fetch(`/api/caderno/documentos/${selectedDocId}/versoes`);
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    enabled: !!selectedDocId && showVersions,
  });

  const versions: VersionData[] = versionsResponse?.versions || [];

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; title: string }) => {
      const res = await fetch("/api/caderno/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar documento");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["caderno-documentos"] });
      if (data.document) {
        setSelectedDocId(data.document.id);
        loadDocument(data.document);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id: number; bodyHtml: string; headerData: any; title: string; inep?: string }) => {
      const res = await fetch(`/api/caderno/documentos/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyHtml: data.bodyHtml,
          headerData: data.headerData,
          title: data.title,
          inep: data.inep,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caderno-documentos"] });
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor: e }) => {
      scheduleAutosave(e.getHTML());
    },
  });

  const loadDocument = useCallback((doc: DocumentData) => {
    setSelectedType(doc.type);
    setTitle(doc.title);
    const hd = doc.header_data ? (typeof doc.header_data === "string" ? JSON.parse(doc.header_data) : doc.header_data) : {};
    setHeaderData(hd);
    setInepCode(doc.inep || "");
    if (editor) {
      editor.commands.setContent(doc.body_html || "");
    }
    setAiSuggestion(null);
    setShowVersions(false);
  }, [editor]);

  useEffect(() => {
    if (selectedDocId && documents.length > 0) {
      const doc = documents.find((d) => d.id === selectedDocId);
      if (doc) loadDocument(doc);
    }
  }, [selectedDocId, documents.length]);

  const scheduleAutosave = useCallback(
    (html: string) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        if (selectedDocId) {
          saveMutation.mutate({
            id: selectedDocId,
            bodyHtml: html,
            headerData,
            title,
            inep: inepCode || undefined,
          });
        }
      }, 3000);
    },
    [selectedDocId, headerData, title, inepCode]
  );

  const handleNewDocument = () => {
    createMutation.mutate({ type: selectedType, title: `Novo ${typeLabel(selectedType)}` });
  };

  const handleSelectDoc = (doc: DocumentData) => {
    setSelectedDocId(doc.id);
    loadDocument(doc);
  };

  const handleBuscarInep = async () => {
    if (!inepCode || inepCode.length < 7) return;
    setInepLoading(true);
    try {
      const res = await fetch(`/api/caderno/escola/${inepCode}`);
      const data = await res.json();
      if (data.ok && data.escola) {
        setEscola(data.escola);
      } else {
        setEscola(null);
      }
    } catch {
      setEscola(null);
    } finally {
      setInepLoading(false);
    }
  };

  const handleAiAction = async (action: string) => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/caderno/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text, documentType: selectedType }),
      });
      const data = await res.json();
      if (data.ok && data.suggestion) {
        setAiSuggestion(data.suggestion);
      } else {
        setAiSuggestion(data.message || "Não foi possível gerar sugestão.");
      }
    } catch {
      setAiSuggestion("Erro ao consultar assistente.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (aiSuggestion && editor) {
      editor.commands.setContent(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleSaveVersion = async () => {
    if (!selectedDocId) return;
    await fetch(`/api/caderno/documentos/${selectedDocId}/versao`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["caderno-versoes", selectedDocId] });
    setShowVersions(true);
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const renderHeaderFields = () => {
    switch (selectedType) {
      case "ata": return <HeaderFieldsAta headerData={headerData} onChange={setHeaderData} />;
      case "oficio": return <HeaderFieldsOficio headerData={headerData} onChange={setHeaderData} />;
      case "pesquisa": return <HeaderFieldsPesquisa headerData={headerData} onChange={setHeaderData} />;
      case "relatorio": return <HeaderFieldsRelatorio headerData={headerData} onChange={setHeaderData} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full min-h-[600px] bg-[#faf5f0] rounded-xl overflow-hidden border border-[#8d6e63]/20">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-[#8d6e63]/20 bg-[#efebe9] flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-[#8d6e63]/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#5d4037]">Documentos</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6d4c41]" onClick={() => setSidebarOpen(false)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleNewDocument} className="w-full bg-[#5d4037] hover:bg-[#6d4c41] text-white text-xs" size="sm" disabled={createMutation.isPending}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Novo Documento
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {docsLoading && <div className="text-xs text-[#8d6e63] text-center py-4">Carregando...</div>}
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`w-full text-left p-2.5 rounded-lg transition text-xs ${
                    selectedDocId === doc.id
                      ? "bg-[#5d4037]/10 border border-[#5d4037]/30"
                      : "hover:bg-[#8d6e63]/10 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${qualityColor(doc.quality_score)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#5d4037] truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#8d6e63]/30 text-[#6d4c41]">
                          {typeLabel(doc.type)}
                        </Badge>
                        <span className="text-[10px] text-[#8d6e63]">{formatDate(doc.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {!docsLoading && documents.length === 0 && (
                <p className="text-xs text-[#8d6e63] text-center py-6">Nenhum documento ainda</p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#8d6e63]/20 bg-[#efebe9]/50">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6d4c41]" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <Tabs value={selectedType} onValueChange={setSelectedType} className="flex-1">
            <TabsList className="bg-[#efebe9] border border-[#8d6e63]/20 h-8">
              {DOC_TYPES.map((dt) => {
                const Icon = dt.icon;
                return (
                  <TabsTrigger key={dt.value} value={dt.value} className="text-xs gap-1 data-[state=active]:bg-[#5d4037] data-[state=active]:text-white px-2 py-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{dt.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1.5">
            {selectedDocId && (
              <Button variant="outline" size="sm" className="text-xs h-7 border-[#8d6e63]/30 text-[#6d4c41]" onClick={handleSaveVersion}>
                <Clock className="w-3 h-3 mr-1" />
                Versões
              </Button>
            )}
            <Button
              variant={aiPanelOpen ? "default" : "outline"}
              size="sm"
              className={`text-xs h-7 ${aiPanelOpen ? "bg-[#5d4037] text-white" : "border-[#8d6e63]/30 text-[#6d4c41]"}`}
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              IA
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
            {selectedDocId && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold border-none bg-transparent text-[#5d4037] px-0 focus-visible:ring-0 placeholder:text-[#8d6e63]/50"
                  placeholder="Título do documento..."
                />
              </motion.div>
            )}

            <Card className="p-4 border-[#8d6e63]/20 bg-white/80">
              <div className="flex items-center gap-2 mb-3">
                <School className="w-4 h-4 text-[#5d4037]" />
                <span className="text-sm font-medium text-[#5d4037]">Identificação da Escola (INEP)</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={inepCode}
                  onChange={(e) => setInepCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Código INEP (7-8 dígitos)"
                  className="w-48 border-[#8d6e63]/30 bg-[#faf5f0] text-sm"
                />
                <Button onClick={handleBuscarInep} size="sm" className="bg-[#5d4037] hover:bg-[#6d4c41] text-white text-xs" disabled={inepLoading || inepCode.length < 7}>
                  {inepLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1" />}
                  Buscar
                </Button>
              </div>
              {escola && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#efebe9] rounded-lg p-3 text-xs text-[#5d4037] space-y-1">
                  <p className="font-semibold text-sm">{escola.nome}</p>
                  <p>{escola.municipio}/{escola.uf} — Rede: {escola.rede}</p>
                  <p>Matrículas: {escola.matriculas?.toLocaleString("pt-BR") || "—"}</p>
                </motion.div>
              )}
            </Card>

            {selectedDocId && (
              <Card className="p-4 border-[#8d6e63]/20 bg-white/80">
                <p className="text-xs font-medium text-[#6d4c41] mb-2">Campos do {typeLabel(selectedType)}</p>
                {renderHeaderFields()}
              </Card>
            )}

            {selectedDocId ? (
              <Card className="border-[#8d6e63]/20 bg-white overflow-hidden flex-1">
                <EditorToolbar editor={editor} />
                <div
                  className="min-h-[300px] p-4"
                  style={{
                    backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #8d6e6322 28px)",
                    backgroundSize: "100% 28px",
                    lineHeight: "28px",
                  }}
                >
                  <EditorContent
                    editor={editor}
                    className="prose prose-sm max-w-none text-[#5d4037] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[250px]"
                  />
                </div>
                {saveMutation.isPending && (
                  <div className="text-[10px] text-[#8d6e63] px-4 py-1 border-t border-[#8d6e63]/10">Salvando...</div>
                )}
              </Card>
            ) : (
              <Card className="flex-1 flex items-center justify-center border-[#8d6e63]/20 bg-white/50 min-h-[300px]">
                <div className="text-center text-[#8d6e63]">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Selecione ou crie um documento</p>
                  <p className="text-xs mt-1">Use o botão "Novo Documento" na barra lateral</p>
                </div>
              </Card>
            )}

            {showVersions && selectedDocId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-3 border-[#8d6e63]/20 bg-white/80">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-[#5d4037] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Histórico de Versões
                    </p>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-[#8d6e63]" onClick={() => setShowVersions(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {versions.length === 0 ? (
                    <p className="text-xs text-[#8d6e63]">Nenhuma versão salva</p>
                  ) : (
                    <div className="space-y-1">
                      {versions.map((v) => (
                        <div key={v.id} className="flex items-center gap-2 text-xs text-[#6d4c41] py-1 px-2 rounded hover:bg-[#efebe9]">
                          <Clock className="w-3 h-3 text-[#8d6e63]" />
                          <span>{formatDateTime(v.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {aiPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-[#8d6e63]/20 bg-[#efebe9]/50 flex flex-col overflow-hidden shrink-0"
              >
                <div className="p-3 border-b border-[#8d6e63]/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#5d4037] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Assistente IA
                    </h4>
                    {selectedDoc && (
                      <span className={`w-3 h-3 rounded-full ${qualityColor(selectedDoc.quality_score)}`} title={`Qualidade: ${selectedDoc.quality_score}`} />
                    )}
                  </div>
                  <p className="text-[10px] text-[#8d6e63]">Selecione uma ação para analisar seu texto</p>
                </div>
                <div className="p-3 space-y-1.5">
                  {AI_ACTIONS.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Button
                        key={a.action}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs border-[#8d6e63]/20 text-[#5d4037] hover:bg-[#5d4037]/10"
                        onClick={() => handleAiAction(a.action)}
                        disabled={aiLoading || !selectedDocId}
                      >
                        <Icon className="w-3.5 h-3.5 mr-2" />
                        {a.label}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {aiLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-[#5d4037]" />
                    </div>
                  )}
                  {aiSuggestion && !aiLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-3 border-[#8d6e63]/20 bg-white">
                        <p className="text-xs text-[#5d4037] whitespace-pre-wrap leading-relaxed">{aiSuggestion}</p>
                        <Button onClick={handleApplySuggestion} size="sm" className="mt-3 w-full bg-[#5d4037] hover:bg-[#6d4c41] text-white text-xs">
                          <RefreshCw className="w-3 h-3 mr-1.5" />
                          Aplicar
                        </Button>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
