import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Lock, LogOut, Plus, Pencil, Trash2, Save, X,
  BookText, Wrench, Ship, FileText, ChevronLeft,
  ChevronDown, ChevronUp, GraduationCap, Settings,
  Building2, BarChart3, Brain, Upload, Download, Check,
  HelpCircle, Loader2, Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlossaryItem, Tool, TrilhaUnit, Program, ProgramDetail, DashboardDataset, AiDocument, UnansweredQuestion } from "@shared/schema";

function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadedFileName(null);
    try {
      const res = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });
      if (!res.ok) throw new Error("Falha ao obter URL de upload");
      const { uploadURL, objectPath } = await res.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!putRes.ok) throw new Error("Falha ao enviar arquivo");

      setUploadedFileName(file.name);
      return objectPath;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFile, isUploading, uploadedFileName };
}

function useAdminAuth() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("admin_token")
  );

  const login = (newToken: string) => {
    localStorage.setItem("admin_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return { token, login, logout, isAuthenticated: !!token };
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function adminFetch(url: string, method: string, token: string, data?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.reload();
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const err = await res.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(err.message || "Erro na requisição");
  }
  return res.json();
}

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.message || "Senha incorreta");
      }
    } catch {
      setError("Erro ao conectar com o servidor");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">Gerencie o conteúdo do site</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Senha de acesso</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                data-testid="input-admin-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" data-testid="text-login-error">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function GlossaryManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ term: "", explanation: "", letter: "", iconName: "" });

  const { data: items = [], isLoading } = useQuery<GlossaryItem[]>({
    queryKey: ["/api/glossary"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      adminFetch("/api/admin/glossary", "POST", token, {
        ...data,
        sortOrder: items.length + 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/glossary"] });
      setCreating(false);
      setForm({ term: "", explanation: "", letter: "", iconName: "" });
      toast({ title: "Termo criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      adminFetch(`/api/admin/glossary/${id}`, "PUT", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/glossary"] });
      setEditing(null);
      toast({ title: "Termo atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/glossary/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/glossary"] });
      toast({ title: "Termo excluído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEdit = (item: GlossaryItem) => {
    setEditing(item.id);
    setForm({
      term: item.term,
      explanation: item.explanation,
      letter: item.letter,
      iconName: item.iconName || "",
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookText className="w-5 h-5 text-emerald-600" />
          Glossário ({items.length} termos)
        </h2>
        <Button onClick={() => { setCreating(true); setForm({ term: "", explanation: "", letter: "", iconName: "" }); }} data-testid="button-add-glossary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Termo
        </Button>
      </div>

      {creating && (
        <Card className="border-emerald-200">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Termo" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value, letter: e.target.value.charAt(0).toUpperCase() })} data-testid="input-glossary-term" />
              <Input placeholder="Letra (auto)" value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value })} data-testid="input-glossary-letter" />
              <Input placeholder="Ícone (ex: FileText)" value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} data-testid="input-glossary-icon" />
            </div>
            <Textarea placeholder="Explicação do termo..." value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={3} data-testid="input-glossary-explanation" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreating(false)} data-testid="button-cancel-glossary">
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.term || !form.explanation} data-testid="button-save-glossary">
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className={cn(editing === item.id && "border-emerald-300 ring-1 ring-emerald-200")}>
            <CardContent className="p-4">
              {editing === item.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value, letter: e.target.value.charAt(0).toUpperCase() })} />
                    <Input value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value })} />
                    <Input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} />
                  </div>
                  <Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={3} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditing(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                    <Button onClick={() => updateMutation.mutate({ id: item.id, data: form })}>
                      <Save className="w-4 h-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 flex-shrink-0">{item.letter}</Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{item.term}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.explanation}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(item)} data-testid={`button-edit-glossary-${item.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este termo?")) deleteMutation.mutate(item.id); }} data-testid={`button-delete-glossary-${item.id}`}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ToolsManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "planejar", type: "excel", featured: false, downloadUrl: "" });
  const { uploadFile, isUploading, uploadedFileName } = useFileUpload();
  const toolFileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: items = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const categories = ["planejar", "pesquisar", "comprar", "receber", "prestar"];
  const types = ["excel", "word", "checklist", "pdf"];

  const handleToolFileUpload = async (file: File) => {
    const objectPath = await uploadFile(file);
    if (objectPath) {
      setForm(prev => ({ ...prev, downloadUrl: objectPath }));
      toast({ title: "Arquivo enviado", description: file.name });
    } else {
      toast({ title: "Erro no upload", description: "Tente novamente", variant: "destructive" });
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      adminFetch("/api/admin/tools", "POST", token, { ...data, sortOrder: items.length + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setCreating(false);
      setForm({ title: "", description: "", category: "planejar", type: "excel", featured: false, downloadUrl: "" });
      toast({ title: "Ferramenta criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      adminFetch(`/api/admin/tools/${id}`, "PUT", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setEditing(null);
      toast({ title: "Ferramenta atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/tools/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({ title: "Ferramenta excluída" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEdit = (item: Tool) => {
    setEditing(item.id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      type: item.type,
      featured: item.featured || false,
      downloadUrl: item.downloadUrl || "",
    });
  };

  const renderForm = (isNew: boolean) => (
    <Card className="border-emerald-200">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Nome da ferramenta" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-tool-title" />
          <div className="flex gap-2">
            <Input placeholder="URL de download (opcional)" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} className="flex-1" data-testid="input-tool-url" />
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => toolFileInputRef.current?.click()}
              disabled={isUploading}
              title="Enviar arquivo"
              data-testid="button-upload-tool-file"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
            <input
              ref={toolFileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleToolFileUpload(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {uploadedFileName && form.downloadUrl && (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Paperclip className="w-3 h-3" />
            <span>Arquivo: {uploadedFileName}</span>
          </div>
        )}
        <Textarea placeholder="Descrição..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} data-testid="input-tool-description" />
        <div className="flex items-center gap-3 flex-wrap">
          <select className="border rounded-md px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="select-tool-category">
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} data-testid="select-tool-type">
            {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Destaque
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { isNew ? setCreating(false) : setEditing(null); }}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={() => {
            if (isNew) createMutation.mutate(form);
            else if (editing) updateMutation.mutate({ id: editing, data: form });
          }} disabled={!form.title || !form.description}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-600" />
          Ferramentas ({items.length})
        </h2>
        <Button onClick={() => { setCreating(true); setForm({ title: "", description: "", category: "planejar", type: "excel", featured: false, downloadUrl: "" }); }} data-testid="button-add-tool">
          <Plus className="w-4 h-4 mr-2" />
          Nova Ferramenta
        </Button>
      </div>

      {creating && renderForm(true)}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            {editing === item.id ? (
              renderForm(false)
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                        {item.featured && <Badge className="text-xs bg-amber-100 text-amber-800 border-0">Destaque</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      {item.downloadUrl && (
                        <div className="flex items-center gap-1 mt-1">
                          <Paperclip className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs text-emerald-600">Arquivo anexado</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(item)} data-testid={`button-edit-tool-${item.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir esta ferramenta?")) deleteMutation.mutate(item.id); }} data-testid={`button-delete-tool-${item.id}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrilhaManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    unitId: "", part: 0, title: "", subtitle: "", duration: "20 min",
    intro: "", sections: "[]", materials: "[]",
    previousUnit: "", nextUnit: "",
  });

  const { data: items = [], isLoading } = useQuery<TrilhaUnit[]>({
    queryKey: ["/api/trilha"],
  });

  const partsMap: Record<number, string> = {
    0: "Antes de Começar",
    1: "De onde veio essa história",
    2: "Como o dinheiro chega e como usar",
    3: "Prestação de contas sem pânico",
    4: "Gente que faz",
    5: "De onde vem o dinheiro",
  };

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      adminFetch("/api/admin/trilha", "POST", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trilha"] });
      setCreating(false);
      toast({ title: "Unidade criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminFetch(`/api/admin/trilha/${id}`, "PUT", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trilha"] });
      setEditing(null);
      toast({ title: "Unidade atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/trilha/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trilha"] });
      toast({ title: "Unidade excluída" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEdit = (item: TrilhaUnit) => {
    setEditing(item.id);
    setForm({
      unitId: item.unitId,
      part: item.part,
      title: item.title,
      subtitle: item.subtitle,
      duration: item.duration,
      intro: item.intro || "",
      sections: JSON.stringify(item.sections || [], null, 2),
      materials: JSON.stringify(item.materials || [], null, 2),
      previousUnit: item.previousUnit || "",
      nextUnit: item.nextUnit || "",
    });
  };

  const handleSave = (isNew: boolean) => {
    let parsedSections, parsedMaterials;
    try {
      parsedSections = JSON.parse(form.sections);
      parsedMaterials = JSON.parse(form.materials);
    } catch {
      toast({ title: "Erro", description: "JSON inválido nas seções ou materiais", variant: "destructive" });
      return;
    }

    const data = {
      unitId: form.unitId,
      part: form.part,
      title: form.title,
      subtitle: form.subtitle,
      duration: form.duration,
      intro: form.intro,
      sections: parsedSections,
      materials: parsedMaterials,
      previousUnit: form.previousUnit || null,
      nextUnit: form.nextUnit || null,
      sortOrder: isNew ? items.length : undefined,
    };

    if (isNew) {
      createMutation.mutate(data);
    } else if (editing) {
      updateMutation.mutate({ id: editing, data });
    }
  };

  const renderForm = (isNew: boolean) => (
    <Card className="border-emerald-200">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="ID (ex: U25)" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} disabled={!isNew} data-testid="input-trilha-unitid" />
          <select className="border rounded-md px-3 py-2 text-sm" value={form.part} onChange={(e) => setForm({ ...form, part: parseInt(e.target.value) })} data-testid="select-trilha-part">
            {Object.entries(partsMap).map(([k, v]) => <option key={k} value={k}>Trecho {k}: {v}</option>)}
          </select>
          <Input placeholder="Duração (ex: 20 min)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} data-testid="input-trilha-duration" />
        </div>
        <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-trilha-title" />
        <Input placeholder="Subtítulo" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} data-testid="input-trilha-subtitle" />
        <Textarea placeholder="Introdução da unidade..." value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} rows={3} data-testid="input-trilha-intro" />
        <div>
          <label className="text-sm font-medium mb-1 block">Seções (JSON)</label>
          <Textarea
            placeholder='[{"tipo":"texto","titulo":"...","conteudo":"..."}]'
            value={form.sections}
            onChange={(e) => setForm({ ...form, sections: e.target.value })}
            rows={6}
            className="font-mono text-xs"
            data-testid="input-trilha-sections"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tipos: texto, checklist, dica, pratica, modelo. Para checklist, conteudo deve ser array de strings.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Materiais (JSON)</label>
          <Textarea
            placeholder='[{"nome":"...","descricao":"...","tipo":"pdf"}]'
            value={form.materials}
            onChange={(e) => setForm({ ...form, materials: e.target.value })}
            rows={3}
            className="font-mono text-xs"
            data-testid="input-trilha-materials"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Unidade anterior (ex: U01)" value={form.previousUnit} onChange={(e) => setForm({ ...form, previousUnit: e.target.value })} />
          <Input placeholder="Próxima unidade (ex: U03)" value={form.nextUnit} onChange={(e) => setForm({ ...form, nextUnit: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { isNew ? setCreating(false) : setEditing(null); }}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={() => handleSave(isNew)} disabled={!form.unitId || !form.title}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const groupedByPart = items.reduce<Record<number, TrilhaUnit[]>>((acc, unit) => {
    if (!acc[unit.part]) acc[unit.part] = [];
    acc[unit.part].push(unit);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Ship className="w-5 h-5 text-emerald-600" />
          Trilha de Aprendizagem ({items.length} unidades)
        </h2>
        <Button onClick={() => {
          setCreating(true);
          const nextId = items.length;
          setForm({
            unitId: `U${nextId.toString().padStart(2, '0')}`,
            part: 0, title: "", subtitle: "", duration: "20 min",
            intro: "", sections: "[]", materials: "[]",
            previousUnit: items.length > 0 ? items[items.length - 1].unitId : "",
            nextUnit: "",
          });
        }} data-testid="button-add-trilha">
          <Plus className="w-4 h-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {creating && renderForm(true)}

      {Object.entries(groupedByPart)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([part, units]) => (
          <div key={part}>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-1">
              Trecho {part}: {partsMap[parseInt(part)] || "Outro"}
            </h3>
            <div className="space-y-2">
              {units.map((item) => (
                <div key={item.id}>
                  {editing === item.id ? (
                    renderForm(false)
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="flex-shrink-0">{item.unitId}</Badge>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.subtitle} - {item.duration}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(item)} data-testid={`button-edit-trilha-${item.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir esta unidade?")) deleteMutation.mutate(item.id); }} data-testid={`button-delete-trilha-${item.id}`}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function ProgramsManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ code: "", name: "", description: "", lastReferenceYear: 0, status: "ativo", observation: "" });
  const [detailEditing, setDetailEditing] = useState<number | null>(null);
  const [detailCreating, setDetailCreating] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState({ programCode: "", type: "allowed", content: "", category: "" });

  const { data: programsList = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const [detailsCache, setDetailsCache] = useState<Record<string, ProgramDetail[]>>({});

  const fetchDetails = async (code: string) => {
    try {
      const res = await fetch(`/api/programs/${code}`);
      const data = await res.json();
      setDetailsCache(prev => ({ ...prev, [code]: data.details || [] }));
    } catch {
      // ignore
    }
  };

  const toggleExpand = (program: Program) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(program.id)) {
      newExpanded.delete(program.id);
    } else {
      newExpanded.add(program.id);
      if (!detailsCache[program.code]) {
        fetchDetails(program.code);
      }
    }
    setExpanded(newExpanded);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      adminFetch("/api/admin/programs", "POST", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setCreating(false);
      setForm({ code: "", name: "", description: "", lastReferenceYear: 0, status: "ativo", observation: "" });
      toast({ title: "Programa criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      adminFetch(`/api/admin/programs/${id}`, "PUT", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setEditing(null);
      toast({ title: "Programa atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/programs/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({ title: "Programa excluído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const createDetailMutation = useMutation({
    mutationFn: (data: typeof detailForm) =>
      adminFetch("/api/admin/program-details", "POST", token, data),
    onSuccess: (_: unknown, variables: typeof detailForm) => {
      fetchDetails(variables.programCode);
      setDetailCreating(null);
      setDetailForm({ programCode: "", type: "allowed", content: "", category: "" });
      toast({ title: "Detalhe criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateDetailMutation = useMutation({
    mutationFn: ({ id, data, programCode }: { id: number; data: Partial<typeof detailForm>; programCode: string }) =>
      adminFetch(`/api/admin/program-details/${id}`, "PUT", token, data),
    onSuccess: (_: unknown, variables: { id: number; data: Partial<typeof detailForm>; programCode: string }) => {
      fetchDetails(variables.programCode);
      setDetailEditing(null);
      toast({ title: "Detalhe atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteDetailMutation = useMutation({
    mutationFn: ({ id, programCode }: { id: number; programCode: string }) =>
      adminFetch(`/api/admin/program-details/${id}`, "DELETE", token),
    onSuccess: (_: unknown, variables: { id: number; programCode: string }) => {
      fetchDetails(variables.programCode);
      toast({ title: "Detalhe excluído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEdit = (item: Program) => {
    setEditing(item.id);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description,
      lastReferenceYear: item.lastReferenceYear || 0,
      status: item.status,
      observation: item.observation || "",
    });
  };

  const startDetailEdit = (detail: ProgramDetail) => {
    setDetailEditing(detail.id);
    setDetailForm({
      programCode: detail.programCode,
      type: detail.type,
      content: detail.content,
      category: detail.category || "",
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          Programas ({programsList.length})
        </h2>
        <Button onClick={() => { setCreating(true); setForm({ code: "", name: "", description: "", lastReferenceYear: new Date().getFullYear(), status: "ativo", observation: "" }); }} data-testid="button-add-program">
          <Plus className="w-4 h-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      {creating && (
        <Card className="border-emerald-200">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Código (ex: PDDE)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} data-testid="input-program-code" />
              <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-program-name" />
              <Input placeholder="Ano referência" type="number" value={form.lastReferenceYear || ""} onChange={(e) => setForm({ ...form, lastReferenceYear: parseInt(e.target.value) || 0 })} data-testid="input-program-year" />
            </div>
            <Textarea placeholder="Descrição do programa..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} data-testid="input-program-description" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className="border rounded-md px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} data-testid="select-program-status">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option>
              </select>
              <Input placeholder="Observação (opcional)" value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} data-testid="input-program-observation" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreating(false)}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.code || !form.name || !form.description}>
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {programsList.map((program) => (
          <Card key={program.id} className={cn(editing === program.id && "border-emerald-300 ring-1 ring-emerald-200")}>
            <CardContent className="p-4">
              {editing === program.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Código" />
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" />
                    <Input type="number" value={form.lastReferenceYear || ""} onChange={(e) => setForm({ ...form, lastReferenceYear: parseInt(e.target.value) || 0 })} placeholder="Ano" />
                  </div>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descrição" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select className="border rounded-md px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="suspenso">Suspenso</option>
                    </select>
                    <Input value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} placeholder="Observação" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditing(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                    <Button onClick={() => updateMutation.mutate({ id: program.id, data: form })}>
                      <Save className="w-4 h-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" onClick={() => toggleExpand(program)} data-testid={`button-expand-program-${program.id}`}>
                      {expanded.has(program.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline">{program.code}</Badge>
                        <h3 className="font-semibold">{program.name}</h3>
                        <Badge variant={program.status === "ativo" ? "default" : "secondary"} className="text-xs">{program.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                      {program.lastReferenceYear && (
                        <p className="text-xs text-muted-foreground mt-1">Ano: {program.lastReferenceYear}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(program)} data-testid={`button-edit-program-${program.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este programa?")) deleteMutation.mutate(program.id); }} data-testid={`button-delete-program-${program.id}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {expanded.has(program.id) && (
                    <div className="mt-4 ml-10 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-muted-foreground">Detalhes do Programa</h4>
                        <Button size="sm" variant="outline" onClick={() => { setDetailCreating(program.code); setDetailForm({ programCode: program.code, type: "allowed", content: "", category: "" }); }} data-testid={`button-add-detail-${program.id}`}>
                          <Plus className="w-3 h-3 mr-1" /> Detalhe
                        </Button>
                      </div>

                      {detailCreating === program.code && (
                        <Card className="border-emerald-200">
                          <CardContent className="p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select className="border rounded-md px-3 py-2 text-sm" value={detailForm.type} onChange={(e) => setDetailForm({ ...detailForm, type: e.target.value })} data-testid="select-detail-type">
                                <option value="allowed">Permitido</option>
                                <option value="forbidden">Proibido</option>
                              </select>
                              <Input placeholder="Categoria (opcional)" value={detailForm.category} onChange={(e) => setDetailForm({ ...detailForm, category: e.target.value })} data-testid="input-detail-category" />
                            </div>
                            <Input placeholder="Conteúdo" value={detailForm.content} onChange={(e) => setDetailForm({ ...detailForm, content: e.target.value })} data-testid="input-detail-content" />
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setDetailCreating(null)}>
                                <X className="w-3 h-3 mr-1" /> Cancelar
                              </Button>
                              <Button size="sm" onClick={() => createDetailMutation.mutate(detailForm)} disabled={!detailForm.content}>
                                <Save className="w-3 h-3 mr-1" /> Salvar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {(detailsCache[program.code] || []).map((detail) => (
                        <Card key={detail.id}>
                          <CardContent className="p-3">
                            {detailEditing === detail.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <select className="border rounded-md px-3 py-2 text-sm" value={detailForm.type} onChange={(e) => setDetailForm({ ...detailForm, type: e.target.value })}>
                                    <option value="allowed">Permitido</option>
                                    <option value="forbidden">Proibido</option>
                                  </select>
                                  <Input placeholder="Categoria" value={detailForm.category} onChange={(e) => setDetailForm({ ...detailForm, category: e.target.value })} />
                                </div>
                                <Input value={detailForm.content} onChange={(e) => setDetailForm({ ...detailForm, content: e.target.value })} placeholder="Conteúdo" />
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" size="sm" onClick={() => setDetailEditing(null)}>
                                    <X className="w-3 h-3 mr-1" /> Cancelar
                                  </Button>
                                  <Button size="sm" onClick={() => updateDetailMutation.mutate({ id: detail.id, data: detailForm, programCode: program.code })}>
                                    <Save className="w-3 h-3 mr-1" /> Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant={detail.type === "allowed" ? "default" : "destructive"} className="text-xs flex-shrink-0">
                                  {detail.type === "allowed" ? "Permitido" : "Proibido"}
                                </Badge>
                                {detail.category && <Badge variant="outline" className="text-xs flex-shrink-0">{detail.category}</Badge>}
                                <span className="text-sm flex-1 min-w-0">{detail.content}</span>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="icon" onClick={() => startDetailEdit(detail)} data-testid={`button-edit-detail-${detail.id}`}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este detalhe?")) deleteDetailMutation.mutate({ id: detail.id, programCode: program.code }); }} data-testid={`button-delete-detail-${detail.id}`}>
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {detailsCache[program.code]?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">Nenhum detalhe cadastrado.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const DASHBOARD_CATEGORIES: Record<string, string> = {
  enrollment: "Matrículas",
  ideb: "IDEB",
  repasses: "Repasses",
  prestacao: "Prestação de Contas",
  taxas: "Taxas Educacionais",
  infraestrutura: "Infraestrutura",
  acoes_pdde: "Ações PDDE",
  calendario: "Calendário",
  escola: "Dados da Escola",
};

function DashboardManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [csvInputs, setCsvInputs] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: datasets = [], isLoading } = useQuery<DashboardDataset[]>({
    queryKey: ["/api/dashboard/datasets"],
  });

  const uploadMutation = useMutation({
    mutationFn: ({ category, csvData }: { category: string; csvData: string }) =>
      adminFetch(`/api/admin/dashboard/upload/${category}`, "POST", token, { csvData }),
    onSuccess: (_: unknown, variables: { category: string; csvData: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/datasets"] });
      setCsvInputs(prev => ({ ...prev, [variables.category]: "" }));
      toast({ title: "Dados enviados" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/dashboard/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/datasets"] });
      toast({ title: "Dataset excluído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleFileSelect = (category: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvInputs(prev => ({ ...prev, [category]: text }));
    };
    reader.readAsText(file);
  };

  const handleTemplateDownload = (category: string) => {
    const a = document.createElement("a");
    a.href = `/api/admin/dashboard/template/${category}`;
    a.download = `modelo_${category}.csv`;
    const tokenValue = token;
    fetch(`/api/admin/dashboard/template/${category}`, {
      headers: authHeaders(tokenValue),
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast({ title: "Erro ao baixar template", variant: "destructive" }));
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const datasetMap: Record<string, DashboardDataset> = {};
  for (const ds of datasets) {
    datasetMap[ds.category] = ds;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-emerald-600" />
        Dashboard - Dados CSV
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(DASHBOARD_CATEGORIES).map(([category, label]) => {
          const existing = datasetMap[category];
          const csvText = csvInputs[category] || "";

          return (
            <Card key={category}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{label}</h3>
                  {existing ? (
                    <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-800 border-0">
                      <Check className="w-3 h-3 mr-1" /> Dados
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Vazio</Badge>
                  )}
                </div>

                {existing && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      Atualizado: {existing.lastUpdated ? new Date(existing.lastUpdated).toLocaleDateString("pt-BR") : "—"}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este dataset?")) deleteMutation.mutate(existing.id); }} data-testid={`button-delete-dataset-${category}`}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleTemplateDownload(category)} data-testid={`button-template-${category}`}>
                    <Download className="w-3 h-3 mr-1" /> Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[category]?.click()} data-testid={`button-upload-${category}`}>
                    <Upload className="w-3 h-3 mr-1" /> Arquivo
                  </Button>
                  <input
                    ref={(el) => { fileInputRefs.current[category] = el; }}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(category, file);
                      e.target.value = "";
                    }}
                  />
                </div>

                <Textarea
                  placeholder="Cole o CSV aqui..."
                  value={csvText}
                  onChange={(e) => setCsvInputs(prev => ({ ...prev, [category]: e.target.value }))}
                  rows={3}
                  className="text-xs font-mono"
                  data-testid={`input-csv-${category}`}
                />

                {csvText && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => uploadMutation.mutate({ category, csvData: csvText })}
                    disabled={uploadMutation.isPending}
                    data-testid={`button-send-csv-${category}`}
                  >
                    <Save className="w-3 h-3 mr-1" /> Enviar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AiDocsManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "", sortOrder: 0 });
  const [loadingFile, setLoadingFile] = useState(false);
  const aiDocFileRef = useRef<HTMLInputElement | null>(null);
  const aiDocEditFileRef = useRef<HTMLInputElement | null>(null);

  const { data: items = [], isLoading } = useQuery<AiDocument[]>({
    queryKey: ["/api/ai-documents"],
  });

  const handleTextFileLoad = (file: File, targetForm: "create" | "edit") => {
    setLoadingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const title = file.name.replace(/\.[^.]+$/, "");
      if (targetForm === "create") {
        setForm(prev => ({
          ...prev,
          content: text,
          title: prev.title || title,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          content: text,
        }));
      }
      setLoadingFile(false);
      toast({ title: "Arquivo carregado", description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)` });
    };
    reader.onerror = () => {
      setLoadingFile(false);
      toast({ title: "Erro ao ler arquivo", variant: "destructive" });
    };
    reader.readAsText(file);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      adminFetch("/api/admin/ai-documents", "POST", token, {
        ...data,
        sortOrder: data.sortOrder || items.length + 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-documents"] });
      setCreating(false);
      setForm({ title: "", content: "", category: "", sortOrder: 0 });
      toast({ title: "Documento criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      adminFetch(`/api/admin/ai-documents/${id}`, "PUT", token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-documents"] });
      setEditing(null);
      toast({ title: "Documento atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/ai-documents/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-documents"] });
      toast({ title: "Documento excluído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEdit = (item: AiDocument) => {
    setEditing(item.id);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category || "",
      sortOrder: item.sortOrder || 0,
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const renderDocForm = (isNew: boolean) => (
    <Card className="border-emerald-200">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Título do documento" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-ai-doc-title" />
          <Input placeholder="Categoria (opcional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="input-ai-doc-category" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => isNew ? aiDocFileRef.current?.click() : aiDocEditFileRef.current?.click()}
            disabled={loadingFile}
            data-testid="button-upload-ai-doc-file"
          >
            {loadingFile ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            Carregar arquivo de texto
          </Button>
          <span className="text-xs text-muted-foreground">.txt, .md, .csv</span>
          <input
            ref={aiDocFileRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.csv,.text"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleTextFileLoad(file, "create");
              e.target.value = "";
            }}
          />
          <input
            ref={aiDocEditFileRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.csv,.text"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleTextFileLoad(file, "edit");
              e.target.value = "";
            }}
          />
        </div>
        <Textarea
          placeholder="Conteúdo do documento..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={12}
          data-testid="input-ai-doc-content"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { isNew ? setCreating(false) : setEditing(null); }}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button
            onClick={() => {
              if (isNew) createMutation.mutate(form);
              else if (editing) updateMutation.mutate({ id: editing, data: form });
            }}
            disabled={!form.title || !form.content}
            data-testid="button-save-ai-doc"
          >
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600" />
          Base de Conhecimento IA ({items.length} docs)
        </h2>
        <Button onClick={() => { setCreating(true); setForm({ title: "", content: "", category: "", sortOrder: items.length + 1 }); }} data-testid="button-add-ai-doc">
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {creating && renderDocForm(true)}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className={cn(editing === item.id && "border-emerald-300 ring-1 ring-emerald-200")}>
            <CardContent className="p-4">
              {editing === item.id ? (
                renderDocForm(false)
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(item)} data-testid={`button-edit-ai-doc-${item.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este documento?")) deleteMutation.mutate(item.id); }} data-testid={`button-delete-ai-doc-${item.id}`}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center pt-4">
        A IA só vai responder com base nestes documentos e no conteúdo do site.
      </p>
    </div>
  );
}

function SettingsManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({
    footer_text: "",
    footer_slogan: "",
    site_title: "",
    hero_subtitle: "",
    home_footer_text: "",
  });
  const [loaded, setLoaded] = useState(false);

  const FIELDS = [
    { key: "site_title", label: "Título do Site", type: "input" },
    { key: "hero_subtitle", label: "Subtítulo da Página Inicial", type: "textarea" },
    { key: "home_footer_text", label: "Texto no rodapé da Página Inicial", type: "input" },
    { key: "footer_slogan", label: "Slogan do Rodapé (geral)", type: "input" },
    { key: "footer_text", label: "Texto extra do Rodapé (geral)", type: "textarea" },
  ];

  const { data: currentSettings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  if (currentSettings && !loaded) {
    setSettings(prev => ({ ...prev, ...currentSettings }));
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const entries = FIELDS.map(f => ({
        key: f.key,
        value: settings[f.key] || "",
        label: f.label,
      }));
      return adminFetch("/api/admin/settings", "PUT", token, entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Configurações salvas" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Settings className="w-5 h-5 text-emerald-600" />
        Configurações do Site
      </h2>

      <Card>
        <CardContent className="p-4 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium mb-2 block">{field.label}</label>
              {field.type === "textarea" ? (
                <Textarea
                  value={settings[field.key] || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                  rows={3}
                  data-testid={`input-setting-${field.key}`}
                />
              ) : (
                <Input
                  value={settings[field.key] || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                  data-testid={`input-setting-${field.key}`}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-settings">
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UnansweredQuestionsManager({ token }: { token: string }) {
  const { toast } = useToast();
  const { data: questions = [], isLoading } = useQuery<UnansweredQuestion[]>({
    queryKey: ["/api/admin/unanswered-questions"],
    queryFn: () => adminFetch("/api/admin/unanswered-questions", "GET", token),
  });

  const markResolved = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/unanswered-questions/${id}`, "PATCH", token, { status: "resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unanswered-questions"] });
      toast({ title: "Marcada como resolvida" });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/unanswered-questions/${id}`, "DELETE", token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unanswered-questions"] });
      toast({ title: "Pergunta removida" });
    },
  });

  const pending = questions.filter(q => q.status === "pending");
  const resolved = questions.filter(q => q.status === "resolved");

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">Perguntas sem Resposta na Base</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Perguntas que usuários fizeram mas a IA não tinha na base de conhecimento. Use esta lista para alimentar a base com as respostas.
        </p>
      </div>

      {pending.length === 0 && resolved.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma pergunta pendente ainda.</p>
            <p className="text-sm mt-1">Quando a IA não souber responder algo do escopo do site, a pergunta aparecerá aqui.</p>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">{pending.length}</Badge>
            Pendentes - precisam de resposta na base
          </h4>
          <div className="space-y-2">
            {pending.map((q) => (
              <Card key={q.id}>
                <CardContent className="py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" data-testid={`text-question-${q.id}`}>{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => markResolved.mutate(q.id)}
                      title="Marcar como resolvida"
                      data-testid={`button-resolve-${q.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteQuestion.mutate(q.id)}
                      title="Remover"
                      data-testid={`button-delete-question-${q.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{resolved.length}</Badge>
            Resolvidas
          </h4>
          <div className="space-y-2">
            {resolved.map((q) => (
              <Card key={q.id} className="opacity-60">
                <CardContent className="py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through" data-testid={`text-resolved-${q.id}`}>{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteQuestion.mutate(q.id)}
                    title="Remover"
                    data-testid={`button-delete-resolved-${q.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type TabId = "glossary" | "tools" | "trilha" | "programs" | "dashboard" | "ai-docs" | "unanswered" | "settings";

const TABS: Array<{ id: TabId; label: string; icon: typeof BookText }> = [
  { id: "glossary", label: "Glossário", icon: BookText },
  { id: "tools", label: "Ferramentas", icon: Wrench },
  { id: "trilha", label: "Trilha", icon: Ship },
  { id: "programs", label: "Programas", icon: Building2 },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "ai-docs", label: "Base IA", icon: Brain },
  { id: "unanswered", label: "Pendentes IA", icon: HelpCircle },
  { id: "settings", label: "Configurações", icon: Settings },
];

export default function Admin() {
  const { token, login, logout, isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabId>("glossary");

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-site">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </a>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              <h1 className="font-bold text-lg">Painel Admin</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} data-testid="button-admin-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0"
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {activeTab === "glossary" && token && <GlossaryManager token={token} />}
        {activeTab === "tools" && token && <ToolsManager token={token} />}
        {activeTab === "trilha" && token && <TrilhaManager token={token} />}
        {activeTab === "programs" && token && <ProgramsManager token={token} />}
        {activeTab === "dashboard" && token && <DashboardManager token={token} />}
        {activeTab === "ai-docs" && token && <AiDocsManager token={token} />}
        {activeTab === "unanswered" && token && <UnansweredQuestionsManager token={token} />}
        {activeTab === "settings" && token && <SettingsManager token={token} />}
      </div>
    </div>
  );
}
