import { useState, useEffect } from "react";
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
  GraduationCap, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlossaryItem, Tool, TrilhaUnit } from "@shared/schema";

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

  const { data: items = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const categories = ["planejar", "pesquisar", "comprar", "receber", "prestar"];
  const types = ["excel", "word", "checklist", "pdf"];

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
          <Input placeholder="URL de download (opcional)" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} data-testid="input-tool-url" />
        </div>
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

type TabId = "glossary" | "tools" | "trilha";

const TABS: Array<{ id: TabId; label: string; icon: typeof BookText }> = [
  { id: "glossary", label: "Glossário", icon: BookText },
  { id: "tools", label: "Ferramentas", icon: Wrench },
  { id: "trilha", label: "Trilha", icon: Ship },
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
      </div>
    </div>
  );
}
