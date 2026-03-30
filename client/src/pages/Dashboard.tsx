import { useState, useMemo, useRef, useEffect, startTransition } from "react";
import { BrazilMap } from "@/components/BrazilMap";
import "../../public/painel-educacional.css";
import { AlertPanel } from "@/components/AlertPanel";
import { IndicatorPanel } from "@/components/IndicatorPanel";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, Users, User, ArrowRight, ArrowLeft,
  MapPin, GraduationCap, Info, ExternalLink,
  School, Loader2, BarChart3, TrendingUp,
  BookOpen, BookMarked, Award, ChevronDown, ChevronUp,
  Globe, Building2, TreePine, Filter, X, Clock, Heart,
  CheckCircle, CircleAlert, Hash, CalendarDays, Settings, RefreshCw,
  DollarSign, Wallet, FileText, AlertTriangle, Landmark, BanknoteIcon,
  Handshake, Shield, Leaf, Accessibility, Scale, Building, Sun, Home,
  Link2, Cross, Laptop, Mail, Phone, Droplets, ClipboardList, Wrench,
  Folder, Pin, Ruler, Printer,
} from "@/components/Icons";
import { useSchoolSearch, useSchool, useEscolaEvolucao, useEstatisticas, useListaEscolas, useMediasNacionais, useEscolaComparativo, useEscolaDiagnostico, useEscolaMicroregiao, useUfStats, useSimilarSchools } from "@/hooks/use-schools";
import { usePddeInfo, usePddeSaldos, usePddeExecFin, usePddeUexSaldo, usePddeSituacaoCadastral, usePddePrestacaoConta, usePddeAtendimento, usePddeSuspensaoEscola } from "@/hooks/use-pdde";
import { useSigpcLocalizar } from "@/hooks/use-sigpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, ReferenceLine
} from "recharts";

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul", MT: "Mato Grosso",
  PA: "Pará", PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima",
  RS: "Rio Grande do Sul", SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};


// Cores pastel para os estados do mapa
const PASTEL_COLORS = [
  '#ffb3ba', // rosa vivo
  '#ffdfba', // laranja claro
  '#ffffba', // amarelo claro
  '#baffc9', // verde claro
  '#bae1ff', // azul claro
  '#b5ead7', // verde água
  '#c7ceea', // azul lavanda
  '#e2f0cb', // verde limão
  '#f3c6e8', // lilás
  '#f7b6d2', // rosa chiclete
  '#f9e2ae', // amarelo pastel
  '#e0c3fc', // roxo claro
  '#c2f0fc', // azul piscina
  '#f6dfeb', // rosa bebê
  '#f7f7b6', // amarelo vivo
  '#d4f1f4', // azul gelo
  '#f9c6c9', // rosa coral
  '#f6eac2', // amarelo manteiga
  '#e0eafc', // azul céu
  '#f7d9c4', // pêssego
  '#d5c6f0', // violeta suave
  '#c8ead8', // verde salvia
  '#fce4b4', // amarelo abacaxi
  '#f0d0e8', // rosa mallow
  '#cce5ff', // azul bebê
  '#d0f0c0', // verde pistache
  '#ffd6e0'  // rosa claro
];

/* cores fixas por sigla — garantem distinção independente do ranking */
const STATE_FIXED_COLORS: Record<string, string> = {
  MT: "#d4554a",  /* terracota — se destaca dos vizinhos AM/GO/MS */
  RO: "#e8a825",  /* âmbar dourado — se destaca dos vizinhos AM/AC/PA */
};

// Paleta para gráficos de pizza
const PIE_COLORS = ["#2d6a4f", "#40916c", "#74c69d", "#b7e4c7"];

// Secretários Estaduais de Educação — fonte: CONSED (consed.org.br/secretarios)
const SECRETARIOS_ESTADUAIS: Record<string, { nome: string; email: string; site: string; estado: string }> = {
  AC: { nome: 'Aberson Carvalho', email: 'gabseeacre@gmail.com', site: 'http://www.see.ac.gov.br', estado: 'Acre' },
  AL: { nome: 'Roseane Vasconcelos', email: 'gabinete@educ.al.gov.br', site: 'http://www.educacao.al.gov.br', estado: 'Alagoas' },
  AM: { nome: 'Arlete Mendonça', email: 'gabinete@educacao.am.gov.br', site: 'http://www.seduc.am.gov.br', estado: 'Amazonas' },
  AP: { nome: 'Paulo Lemos', email: 'seed@seed.ap.gov.br', site: 'http://www.seed.ap.gov.br', estado: 'Amapá' },
  BA: { nome: 'Rowenna Brito', email: 'gabinete@enova.educacao.ba.gov.br', site: 'http://www.educacao.ba.gov.br', estado: 'Bahia' },
  CE: { nome: 'Eliana Estrela', email: 'eliana.estrela@seduc.ce.gov.br', site: 'http://www.seduc.ce.gov.br', estado: 'Ceará' },
  DF: { nome: 'Hélvia Paranaguá', email: 'gabinete@se.df.gov.br', site: 'http://www.educacao.df.gov.br', estado: 'Distrito Federal' },
  ES: { nome: 'Vitor de Angelo', email: 'secretario@sedu.es.gov.br', site: 'http://www.educacao.es.gov.br', estado: 'Espírito Santo' },
  GO: { nome: 'Fátima Gavioli', email: 'gabinete@seduc.go.gov.br', site: 'https://goias.gov.br/educacao', estado: 'Goiás' },
  MA: { nome: 'Jandira Dias', email: 'gabinete@edu.ma.gov.br', site: 'http://www.educacao.ma.gov.br', estado: 'Maranhão' },
  MG: { nome: 'Rossieli Soares', email: 'gabinete.assessoria@educacao.mg.gov.br', site: 'http://www.educacao.mg.gov.br', estado: 'Minas Gerais' },
  MS: { nome: 'Helio Daher', email: 'gabinete@sed.ms.gov.br', site: 'http://www.sed.ms.gov.br', estado: 'Mato Grosso do Sul' },
  MT: { nome: 'Alan Porto', email: 'gabinete@edu.mt.gov.br', site: 'http://www.seduc.mt.gov.br', estado: 'Mato Grosso' },
  PA: { nome: 'Ricardo Sefer', email: 'gabinete@seduc.pa.gov.br', site: 'http://www.seduc.pa.gov.br', estado: 'Pará' },
  PB: { nome: 'Wilson Filho', email: 'gseducacaoparaiba@see.pb.gov.br', site: 'https://paraiba.pb.gov.br/diretas/secretaria-da-educacao', estado: 'Paraíba' },
  PE: { nome: 'Gilson Monteiro Filho', email: 'gabinetedasecretaria@adm.educacao.pe.gov.br', site: 'http://www.educacao.pe.gov.br', estado: 'Pernambuco' },
  PI: { nome: 'Rodrigo Torres', email: 'ouvidoriaeduc@seduc.pi.gov.br', site: 'http://www.seduc.pi.gov.br', estado: 'Piauí' },
  PR: { nome: 'Roni Miranda', email: 'gabinete.seed@seed.pr.gov.br', site: 'http://www.educacao.pr.gov.br', estado: 'Paraná' },
  RJ: { nome: 'Luciana Calaça', email: 'gabinete@educacao.rj.gov.br', site: 'http://www.rj.gov.br/secretaria/educacao', estado: 'Rio de Janeiro' },
  RN: { nome: 'Socorro Batista', email: 'gabseec@educar.rn.gov.br', site: 'http://www.educacao.rn.gov.br', estado: 'Rio Grande do Norte' },
  RO: { nome: 'Albaniza Batista de Oliveira', email: 'seduc@seduc.ro.gov.br', site: 'http://www.seduc.ro.gov.br', estado: 'Rondônia' },
  RR: { nome: 'Mikael Cury-Rad', email: 'gabinete@educacao.rr.gov.br', site: 'http://www.rr.gov.br', estado: 'Roraima' },
  RS: { nome: 'Raquel Teixeira', email: 'gabinetese@seduc.rs.gov.br', site: 'http://www.educacao.rs.gov.br', estado: 'Rio Grande do Sul' },
  SC: { nome: 'Luciane Ceretta', email: 'educacao.sc@sed.sc.gov.br', site: 'http://www.sed.sc.gov.br', estado: 'Santa Catarina' },
  SE: { nome: 'Maria Gilvânia G. dos Santos', email: 'gabinetedosecretario@seduc.se.gov.br', site: 'http://www.seduc.se.gov.br', estado: 'Sergipe' },
  SP: { nome: 'Renato Feder', email: 'agenda.secretario@educacao.sp.gov.br', site: 'http://www.educacao.sp.gov.br', estado: 'São Paulo' },
  TO: { nome: 'Fábio Vaz', email: 'gabinete@seduc.to.gov.br', site: 'http://www.seduc.to.gov.br', estado: 'Tocantins' },
};

// CECAMPE: mapeamento de UF para região
const UF_CECAMPE: Record<string, string> = {
  AM:'Norte', AC:'Norte', RR:'Norte', RO:'Norte', AP:'Norte', PA:'Norte', TO:'Norte',
  MA:'Nordeste', PI:'Nordeste', CE:'Nordeste', RN:'Nordeste', PB:'Nordeste', PE:'Nordeste', AL:'Nordeste', SE:'Nordeste', BA:'Nordeste',
  MT:'Centro-Oeste', MS:'Centro-Oeste', GO:'Centro-Oeste', DF:'Centro-Oeste',
  MG:'Sudeste', ES:'Sudeste', RJ:'Sudeste', SP:'Sudeste',
  PR:'Sul', SC:'Sul', RS:'Sul',
};


const CECAMPES = [
  { regiao: 'Norte', uni: 'Universidade Federal do Pará (UFPA)', email: 'cecampenorte@ufpa.br', site: 'https://cecampenorte.ufpa.br', painel: null, cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
  { regiao: 'Nordeste', uni: 'Universidade Federal da Paraíba (UFPB)', email: 'cecampenordeste@gmail.com', site: 'https://www.cecampe.ufpb.br', painel: 'https://www.cecampe.ufpb.br/paineisdeinformacoes', cor: '#7a4a10', bg: '#fdf3e0', bd: '#f0ddb5' },
  { regiao: 'Centro-Oeste', uni: 'Universidade de Brasília (UnB)', email: 'cecampeco.form@unb.br', site: 'https://cecampe-fe.unb.br', painel: null, cor: '#1e4a78', bg: '#e6eef8', bd: '#b8cfe8' },
  { regiao: 'Sudeste', uni: 'Universidade Federal de Uberlândia (UFU)', email: 'contatocecampeufu@gmail.com', site: 'http://www.proexc.ufu.br/cecampesudeste', painel: 'http://www.proexc.ufu.br/cecampesudeste/dados', cor: '#5b3fa8', bg: '#f3eeff', bd: '#d4c4f5' },
  { regiao: 'Sul', uni: 'Universidade Federal do Rio Grande do Sul (UFRGS)', email: 'cecampe-sul@ufrgs.br', site: 'https://www.ufrgs.br/cecampe-sul', painel: 'https://datastudio.google.com/reporting/89f97085-a65c-4db2-9a52-9375d8056445/page/p_ys6715q1pc?s=ktz-3IIzg50', cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
];

// UNDIME por UF — fonte: undime.org.br
const UNDIME_UF: Record<string, string> = {
  AC: 'https://ac.undime.org.br',  AL: 'https://al.undime.org.br',
  AM: 'https://am.undime.org.br',  AP: 'https://ap.undime.org.br',
  BA: 'http://undimebahia.com.br', CE: 'https://ce.undime.org.br',
  DF: 'https://undime.org.br',     ES: 'https://es.undime.org.br',
  GO: 'https://go.undime.org.br',  MA: 'https://ma.undime.org.br',
  MG: 'http://www.undimemg.org.br',MS: 'https://ms.undime.org.br',
  MT: 'https://undime-mt.blogspot.com', PA: 'https://pa.undime.org.br',
  PB: 'http://www.undimepb.org.br',PE: 'https://pe.undime.org.br',
  PI: 'https://pi.undime.org.br',  PR: 'http://www.undimepr.org.br',
  RJ: 'https://rj.undime.org.br',  RN: 'https://rn.undime.org.br',
  RO: 'https://ro.undime.org.br',  RR: 'https://rr.undime.org.br',
  RS: 'https://undimers.org.br',   SC: 'http://undime-sc.org.br',
  SE: 'https://se.undime.org.br',  SP: 'http://www.undime-sp.org.br',
  TO: 'https://to.undime.org.br',
};

const CEE_ESTADUAIS: Record<string, { presidente?: string; email?: string; tel?: string; endereco?: string; site: string }> = {
  AC: { site: 'http://www.see.ac.gov.br/cee' },
  AL: { presidente: 'Eliel dos Santos de Carvalho', email: 'cee.alagoas@gmail.com', tel: '(82) 3315-1401', endereco: 'Rua da Alegria, 379 – Centro, CEP 57020-320, Maceió – AL', site: 'http://www.cee.al.gov.br' },
  AM: { presidente: 'José Augusto de Melo Neto', tel: '(92) 3234-5074', endereco: 'Rua José Paranaguá, 574 – Centro, CEP 69.005-130, Manaus – AM', site: 'http://www.cee.am.gov.br' },
  AP: { presidente: 'Ivone de Souza Conceição', email: 'cee@cee.ap.gov.br', tel: '(96) 98126-5242', endereco: 'Av. Feliciano Coelho, 1969 – Buritizal, CEP 68.900-000, Macapá – AP', site: 'http://www.cee.ap.gov.br' },
  BA: { presidente: 'Roberto Gondim Pires', email: 'conselho.bahia@educacao.ba.gov.br', endereco: 'Av. Eng. Oscar Pontes, s/n – Água de Meninos, Salvador – BA', site: 'http://www.ba.gov.br/conselhodeeducacao' },
  CE: { presidente: 'José Linhares Ponte', email: 'jose.linhares@cee.ce.gov.br', tel: '(85) 3101-2005', endereco: 'Rua Napoleão Laureano, 500 – Fátima, CEP 60.411.170, Fortaleza – CE', site: 'https://www.cee.ce.gov.br' },
  DF: { site: 'http://www.se.df.gov.br' },
  ES: { email: 'cee.es@sedu.es.gov.br', tel: '(27) 3636-4850', endereco: 'Av. Nossa Senhora dos Navegantes, 635, 7º andar – Enseada do Suá, CEP 29.050-335, Vitória – ES', site: 'https://cee.es.gov.br' },
  GO: { presidente: 'Maria Ester Galvão de Carvalho', email: 'presidenciaceego@gmail.com', tel: '(62) 3201-9812', endereco: 'Rua 3, esq. Rua 23, 63 – Centro, CEP 74.015-120, Goiânia – GO', site: 'http://www.cee.go.gov.br' },
  MA: { presidente: 'Geraldo Castro Sobrinho', endereco: 'Rua do Sol, 412 – Centro, CEP 65.020-590, São Luís – MA', site: 'http://www.cee.ma.gov.br' },
  MG: { presidente: 'Felipe Michel Santos Araújo Braga', email: 'cee.gab@educacao.mg.gov.br', tel: '(31) 3071-4750', endereco: 'Rua Rio de Janeiro, 2418 – Lourdes, CEP 30160-042, Belo Horizonte – MG', site: 'https://cee.educacao.mg.gov.br' },
  MS: { presidente: 'Eva Maria Katayama Negrisolli', email: 'conselho.ceems@gmail.com', tel: '(67) 3318-7080', endereco: 'Rua Lima Felix, s/n – Parque dos Poderes, CEP 79037-109, Campo Grande – MS', site: 'http://www.cee.ms.gov.br' },
  MT: { presidente: 'Adriana Tomasoni', site: 'http://www.cee.mt.gov.br' },
  PA: { presidente: 'Suely Melo de Castro Menezes', tel: '(91) 3210-3200', endereco: 'Rua Arcipreste Manoel Teodoro, 862 – Campina, CEP 66015-040, Belém – PA', site: 'http://www.cee.pa.gov.br' },
  PB: { site: 'http://www.cee.pb.gov.br' },
  PE: { presidente: 'Natanael José da Silva', email: 'ceepe@educacao.pe.gov.br', tel: '(81) 3181-2686', endereco: 'Av. Rui Barbosa, 1559 – Graça, CEP 52.050-000, Recife – PE', site: 'http://www.cee.pe.gov.br' },
  PI: { site: 'http://www.cee.pi.gov.br' },
  PR: { presidente: 'Oscar Alves', email: 'cee-pr@seed.pr.gov.br', site: 'http://www.cee.pr.gov.br' },
  RJ: { presidente: 'Malvina Tânia Tuttiman', email: 'assadmceerj@educacao.rj.gov.br', site: 'https://www.cee.rj.gov.br' },
  RN: { site: 'http://www.cee.rn.gov.br' },
  RO: { site: 'http://www.cee.ro.gov.br' },
  RR: { site: 'http://www.cee.rr.gov.br' },
  RS: { presidente: 'Fátima Anise Rodrigues Ehlert', tel: '(51) 3288-7600', endereco: 'Av. Borges de Medeiros, 521 – Centro Histórico, CEP 90020-023, Porto Alegre – RS', site: 'https://ceed.rs.gov.br' },
  SC: { presidente: 'Patrícia Lueders', tel: '(48) 3224-0104', endereco: 'Av. Prefeito Osmar Cunha, 183 – Ed. Ceisa Center, Bloco B, Sala 303, CEP 88.015-100, Florianópolis – SC', site: 'https://www.cee.sc.gov.br' },
  SE: { site: 'http://www.cee.se.gov.br' },
  SP: { presidente: 'Maria Helena Guimarães de Castro', tel: '(11) 2075-4500', endereco: 'Praça da República, 53 – 2º andar, CEP 01045-903, São Paulo – SP', site: 'http://www.ceesp.sp.gov.br' },
  TO: { site: 'http://www.cee.to.gov.br' },
};

const CNE_INFO = {
  presidente: 'César Callegari',
  tel: '(61) 2022-7700 / 7701',
  email: 'cneagendamento@mec.gov.br',
  endereco: 'SGAS, Av. L2 Sul, Quadra 607, Lote 50 – CEP 70200-670, Brasília – DF',
  site: 'https://www.gov.br/mec/pt-br/cne',
};

const MEC_SECRETARIAS = [
  { sigla: 'SEB', nome: 'Secretaria de Educação Básica', titular: 'Kátia Helena S. Cruz Schweickardt', tel: '(61) 2022-8320 / 8319', email: 'gabinete-seb@mec.gov.br', foco: 'Ed. Infantil, Ensino Fundamental e Médio' },
  { sigla: 'SETEC', nome: 'Secretaria de Educação Profissional e Tecnológica', titular: 'Marcelo Bregagnoli', tel: '(61) 2022-8684 / 8581', email: 'gerencia.setec@mec.gov.br', foco: 'Educação profissional, IFs e PRONATEC' },
  { sigla: 'SECADI', nome: 'Secretaria de Educação Continuada, Alfabetização, Diversidade e Inclusão', titular: 'Zara Figueiredo', tel: '(61) 2022-7672 / 9217', email: 'secadigab@mec.gov.br', foco: 'EJA, Educação Especial, Diversidade e Inclusão' },
  { sigla: 'DAGE', nome: 'Diretoria de Apoio à Gestão Educacional (SEB/MEC)', titular: 'Anita Gea Martinez Stefani', tel: '(61) 2022-9139 / 2788', email: 'dage@mec.gov.br', foco: 'Apoio direto às redes de ensino e gestores escolares' },
  { sigla: 'MEC Central', nome: 'Fala Brasil — Central de Atendimento MEC (gratuito)', titular: '', tel: '0800-616161', email: 'falabrasil@mec.gov.br', foco: 'Dúvidas gerais sobre programas e políticas do MEC' },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [schoolTabs, setSchoolTabs] = useState<Array<{id: string, label: string, inep: string}>>([]);
  const [activeTabId, setActiveTabId] = useState<string>("overview");
  const [selectedAno, setSelectedAno] = useState(2025);
  const selectedInep = activeTabId === "overview" ? null : (schoolTabs.find(t => t.id === activeTabId)?.inep || null);
  const [visibleSecIds, setVisibleSecIds] = useState<Set<string>>(new Set());
  const [hiddenSecs, setHiddenSecs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedInep) { setVisibleSecIds(new Set()); return; }
    const allIds = ['sec-ficha','sec-desempenho','sec-tnr','sec-inse','sec-tdi','sec-matriculas','sec-estrutura','sec-ied','sec-afd','sec-atu','sec-had','sec-evolucao-censo','sec-retrato','sec-pdde'];
    const scan = () => setVisibleSecIds(new Set(allIds.filter(id => !!document.getElementById(id))));
    const timers = [200, 1500, 3500, 7000].map(ms => setTimeout(scan, ms));
    return () => timers.forEach(clearTimeout);
  }, [selectedInep]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedChart, setSelectedChart] = useState("matriculas");
  const [chartEtapa, setChartEtapa] = useState<string>('total');
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSchoolTab, setActiveSchoolTab] = useState<"dim1"|"dim2"|"dim3"|"dim4"|"dim5"|"dim6"|"dim7"|"dim8"|"dim9"|"dim10">("dim1");
  const [filterUf, setFilterUf] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [listPage, setListPage] = useState(1);
  const [clickedUf, setClickedUf] = useState<string | null>(null);
  const [similarMode, setSimilarMode] = useState(false);
  const [similarClickedUf, setSimilarClickedUf] = useState<string | null>(null);
  const [saldoMesSel, setSaldoMesSel] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  });

  const { data: stats, isLoading: statsLoading } = useEstatisticas(selectedAno);
  const { data: ufStatsData, isLoading: ufStatsLoading } = useUfStats(similarMode ? null : clickedUf, selectedAno);
  const { data: similarData, isLoading: similarLoading } = useSimilarSchools(selectedInep || "", selectedAno, similarMode);
  const { data: searchResults, refetch: refetchSearch, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const { data: evolucaoData, isLoading: evolucaoLoading } = useEscolaEvolucao(selectedInep || "");
  const { data: mediasNacionais } = useMediasNacionais(selectedAno);
  const { data: comparativoData } = useEscolaComparativo(selectedInep || "");
  const { data: microregiaoData } = useEscolaMicroregiao(selectedInep || "");
  const { data: diagnosticoData } = useEscolaDiagnostico(selectedInep || "");
  const [pddeAno, setPddeAno] = useState<number>(new Date().getFullYear());
  const [pieAno, setPieAno] = useState<number>(new Date().getFullYear() - 1);
  const [showEquipamentos, setShowEquipamentos] = useState(false);
  const [showSuporteInstitucional, setShowSuporteInstitucional] = useState(false);
  const [suporteTab, setSuporteTab] = useState<'contatos'|'cecampe'|'sistemas'|'conselhos'>('contatos');
  const [equipamentosData, setEquipamentosData] = useState<any>(null);
  const [equipamentosLoading, setEquipamentosLoading] = useState(false);
  const [osmUnidades, setOsmUnidades] = useState<Record<string, any[]> | null>(null);
  const [osmLoading, setOsmLoading] = useState(false);
  const [crasData, setCrasData] = useState<any>(null);
  const [crasLoading, setCrasLoading] = useState(false);
  const [mapaSocialData, setMapaSocialData] = useState<any>(null);
  const [mapaSocialLoading, setMapaSocialLoading] = useState(false);
  const [rendSegmento, setRendSegmento] = useState<'ai' | 'af' | 'med' | null>(null);
  const [tnrSegmento, setTnrSegmento] = useState<string | null>(null);
  const [tdiSegmento, setTdiSegmento] = useState<string | null>(null);
  const [iedAno, setIedAno] = useState<number | null>(null);
  const [afdAno, setAfdAno] = useState<number | null>(null);
  const [atuAno, setAtuAno] = useState<number | null>(null);
  const [hadAno, setHadAno] = useState<number | null>(null);
  const [inseAno, setInseAno] = useState<number | null>(null);
  const { data: pddeData, isLoading: pddeLoading } = usePddeInfo(selectedInep, pddeAno);
  const pddeCnpj = pddeData?.uex?.cnpj || null;
  const { data: pddeSaldosData, isLoading: pddeSaldosLoading, isError: pddeSaldosError } = usePddeSaldos(selectedInep);
  const { data: pddeExecFinData, isLoading: pddeExecFinLoading, isError: pddeExecFinError } = usePddeExecFin(selectedInep);
  const { data: pddeUexSaldoData, isLoading: pddeUexSaldoLoading } = usePddeUexSaldo(pddeCnpj, { mes: saldoMesSel });
  const { data: cadastralData, isLoading: cadastralLoading } = usePddeSituacaoCadastral(selectedInep, pddeAno);
  const [prestacaoContaAno, setPrestacaoContaAno] = useState<number>(new Date().getFullYear());
  const { data: prestacaoContaData, isLoading: prestacaoContaLoading } = usePddePrestacaoConta(selectedInep, prestacaoContaAno, true);
  const { data: atendimentoData, isLoading: atendimentoLoading } = usePddeAtendimento(selectedInep, pddeAno);
  const { data: atendimentoPcData } = usePddeAtendimento(selectedInep, prestacaoContaAno);
  const suspEscolaUf = pddeData?.uf || null;
  const suspEscola = usePddeSuspensaoEscola(selectedInep, suspEscolaUf, [pddeAno, pddeAno === new Date().getFullYear() ? pddeAno - 1 : pddeAno]);
  const { data: sigpcData, isLoading: sigpcLoading } = useSigpcLocalizar(pddeCnpj || undefined, pddeAno);
  const listFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (filterUf) f.uf = filterUf;
    if (filterDep) f.tp_dependencia = filterDep;
    return f;
  }, [filterUf, filterDep]);

  const { data: listaEscolas, isLoading: listaLoading } = useListaEscolas(selectedAno, listFilters, listPage, 15);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [censoInsightsUF, setCensoInsightsUF] = useState<any>(null);
  const [censoInsightsUFLoading, setCensoInsightsUFLoading] = useState(false);
  const [censoInsightsNacional, setCensoInsightsNacional] = useState<any>(null);
  const censoInsightsUfCacheRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!clickedUf) { setCensoInsightsUF(null); return; }

    const cached = censoInsightsUfCacheRef.current[clickedUf];
    if (cached) {
      setCensoInsightsUF(cached);
      setCensoInsightsUFLoading(false);
      return;
    }

    setCensoInsightsUFLoading(true);
    fetch(`/api/censo-escolar/insights/${clickedUf}`)
      .then(r => r.json()).then(d => {
        censoInsightsUfCacheRef.current[clickedUf] = d;
        setCensoInsightsUF(d);
        setCensoInsightsUFLoading(false);
      })
      .catch(() => setCensoInsightsUFLoading(false));
  }, [clickedUf]);

  const prefetchUfData = (uf: string) => {
    if (!uf || similarMode) return;

    void queryClient.prefetchQuery({
      queryKey: ["uf-stats", uf, selectedAno],
      queryFn: async () => {
        const res = await fetch(`/api/censo-escolar/${selectedAno}/uf/${uf}/stats`);
        if (!res.ok) return null;
        return res.json();
      },
      staleTime: 30 * 60 * 1000,
    });
  };

  useEffect(() => {
    const CACHE_KEY = 'censo_insights_br_client_cache_v1';
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h no client

    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL_MS && parsed?.data) {
          setCensoInsightsNacional(parsed.data);
          return;
        }
      }
    } catch {}

    const controller = new AbortController();
    const loadInsights = () => {
      fetch('/api/censo-escolar/insights/BR', { signal: controller.signal })
        .then(r => r.json())
        .then((data) => {
          setCensoInsightsNacional(data);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
          } catch {}
        })
        .catch(() => {});
    };

    // Não competir com o first paint
    const w = window as any;
    let idleId: any = null;
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(loadInsights, { timeout: 2500 });
    } else {
      idleId = window.setTimeout(loadInsights, 1200);
    }

    return () => {
      controller.abort();
      if (typeof w.cancelIdleCallback === 'function' && idleId != null) w.cancelIdleCallback(idleId);
      else if (idleId != null) clearTimeout(idleId);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (pddeData?.ok) return; // ano atual tem dados — mantém
    const anos = new Set<number>();
    pddeSaldosData?.saldos?.forEach((s: any) => { if (s.an_exercicio) anos.add(Number(s.an_exercicio)); });
    pddeExecFinData?.anosDisponiveis?.forEach((a: number) => anos.add(a));
    if (anos.size > 0) {
      const melhor = Math.max(...Array.from(anos));
      setPddeAno(melhor);
    }
  }, [pddeSaldosData, pddeExecFinData, pddeData]);

  useEffect(() => {
    setPddeAno(new Date().getFullYear());
    setEquipamentosData(null);
    setEquipamentosLoading(false);
    setOsmUnidades(null);
    setOsmLoading(false);
    setCrasData(null);
    setCrasLoading(false);
    setShowEquipamentos(false);
  }, [selectedInep]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 170);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const selectSchool = (inep: string, name?: string) => {
    const tabId = `school-${inep}`;
    setSchoolTabs(prev => {
      if (prev.find(t => t.id === tabId)) return prev;
      return [...prev, { id: tabId, label: name || `INEP ${inep}`, inep }];
    });
    setActiveTabId(tabId);
    setSearchQuery("");
  };

  const closeTab = (tabId: string) => {
    setSchoolTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) setActiveTabId("overview");
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (/^\d{8}$/.test(q)) {
      selectSchool(q);
    } else {
      refetchSearch();
    }
  };

  const latestAno = useMemo(() => {
    if (!evolucaoData?.anos_disponiveis?.length) return null;
    return Math.max(...evolucaoData.anos_disponiveis);
  }, [evolucaoData]);

  const censoLatest = useMemo(() => {
    if (!evolucaoData || !latestAno) return null;
    return evolucaoData.censo_por_ano?.[latestAno] || null;
  }, [evolucaoData, latestAno]);

  const baseAnoComparacao = useMemo(() => {
    if (!latestAno || !evolucaoData?.anos_disponiveis?.length) return null;
    const anosDesde2020 = [...evolucaoData.anos_disponiveis]
      .filter((a: number) => a >= 2020 && a <= latestAno)
      .sort((a: number, b: number) => a - b);
    if (anosDesde2020.length > 0) return anosDesde2020[0];
    const anosOrdenados = [...evolucaoData.anos_disponiveis].sort((a: number, b: number) => a - b);
    return anosOrdenados[0] || null;
  }, [evolucaoData, latestAno]);

  const censoBaseComparacao = useMemo(() => {
    if (!baseAnoComparacao || !evolucaoData?.censo_por_ano?.[baseAnoComparacao]) return null;
    return evolucaoData.censo_por_ano[baseAnoComparacao];
  }, [evolucaoData, baseAnoComparacao]);

  const indicadoresLatest = useMemo(() => {
    if (!evolucaoData || !latestAno) return {};
    const allIndicadores = evolucaoData.indicadores_por_ano || {};
    const anos = evolucaoData.anos_disponiveis || [];
    const merged: Record<string, any> = {};
    const sortedAnos = [...anos].sort((a: number, b: number) => b - a);
    for (const ano of sortedAnos) {
      const yearData = allIndicadores[ano];
      if (!yearData) continue;
      for (const [tipo, dados] of Object.entries(yearData)) {
        if (!merged[tipo]) merged[tipo] = { ...dados as any, _ano: ano };
      }
    }
    return merged;
  }, [evolucaoData, latestAno]);

  const historicoIndicadores = useMemo(() => {
    if (!evolucaoData) return {} as Record<string, Array<{ano: number; valor: number}>>;
    const allInd = evolucaoData.indicadores_por_ano || {};
    const out: Record<string, Array<{ano: number; valor: number}>> = {};
    for (const [anoStr, tipos] of Object.entries(allInd)) {
      const ano = Number(anoStr);
      for (const [tipo, dados] of Object.entries(tipos as any)) {
        for (const [field, val] of Object.entries(dados as any)) {
          if (field.startsWith('_') || field === 'co_entidade' || field === 'ano') continue;
          const n = Number(val);
          if (!isNaN(n) && n > 0) {
            const key = `${tipo}.${field}`;
            if (!out[key]) out[key] = [];
            if (!out[key].find(d => d.ano === ano)) out[key].push({ ano, valor: n });
          }
        }
      }
    }
    for (const key of Object.keys(out)) out[key].sort((a, b) => a.ano - b.ano);
    return out;
  }, [evolucaoData]);

  const alertasPreocupantes = useMemo(() => {
    type Progressao = { delta: number; label: string; anoAnterior: number; improving: boolean; pct: number | null };
    const alertas: { tipo: 'critical' | 'warning'; titulo: string; descricao: string; indicador: string; progressao?: Progressao }[] = [];
    const ind = indicadoresLatest;

    // Build IDEB history sorted by year to detect year-over-year improvement
    const idebHistorico: Array<{ ano: number; ideb_ai?: number; ideb_af?: number; ideb_em?: number }> =
      evolucaoData
        ? Object.entries(evolucaoData.indicadores_por_ano || {})
            .filter(([, tipos]: [string, any]) => tipos?.ideb)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([ano, tipos]: [string, any]) => ({ ano: Number(ano), ...tipos.ideb }))
        : [];

    const getIdebHistoricoResumo = (field: 'ideb_ai' | 'ideb_af' | 'ideb_em'): string | undefined => {
      if (idebHistorico.length < 2) return undefined;
      const comDados = idebHistorico.filter(r => { const v = Number(r[field]); return !isNaN(v) && v > 0; });
      if (comDados.length < 2) return undefined;
      const recorte = comDados.slice(-3);
      return `Histórico: ${recorte.map(r => `${r.ano} (${Number(r[field]).toFixed(1).replace('.', ',')})`).join(' → ')}`;
    };

    const getIdebProgressao = (field: 'ideb_ai' | 'ideb_af' | 'ideb_em'): Progressao | undefined => {
      if (idebHistorico.length < 2) return undefined;
      const comDados = idebHistorico.filter(r => { const v = Number(r[field]); return !isNaN(v) && v > 0; });
      if (comDados.length < 2) return undefined;
      const ultimo = comDados[comDados.length - 1];
      const penultimo = comDados[comDados.length - 2];
      const delta = Number(ultimo[field]) - Number(penultimo[field]);
      if (Math.abs(delta) < 0.05) return undefined;
      const improving = delta > 0;
      const pct = Number(penultimo[field]) > 0 ? (delta / Number(penultimo[field])) * 100 : null;
      const pctMuitoAlto = pct != null && Math.abs(pct) > 100;
      const pctTxt = pct != null && !pctMuitoAlto
        ? `${Math.abs(pct).toFixed(1).replace('.', ',')}%`
        : `${Math.abs(delta).toFixed(1).replace('.', ',')} ponto${Math.abs(delta) >= 2 ? 's' : ''}`;
      return { delta, improving, pct, label: `${improving ? 'Melhorou' : 'Piorou'} ${pctTxt} desde ${penultimo.ano}`, anoAnterior: penultimo.ano };
    };

    // Generic progression helper for all other indicators
    const getProgressaoInd = (
      tipo: string,
      field: string,
      higherIsBetter: boolean,
      unidadeFallback: 'p.p.' | 'unidades' | 'pontos' = 'p.p.'
    ): Progressao | undefined => {
      if (!evolucaoData) return undefined;
      const allData = evolucaoData.indicadores_por_ano || {};
      const comDados = Object.entries(allData)
        .filter(([, tipos]: [string, any]) => tipos?.[tipo] && Number((tipos[tipo] as any)[field]) > 0)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([ano, tipos]: [string, any]) => ({ ano: Number(ano), value: Number((tipos[tipo] as any)[field]) }));
      if (comDados.length < 2) return undefined;
      const ultimo = comDados[comDados.length - 1];
      const penultimo = comDados[comDados.length - 2];
      const delta = ultimo.value - penultimo.value;
      if (Math.abs(delta) < 0.05) return undefined;
      const improving = higherIsBetter ? delta > 0 : delta < 0;
      const pct = penultimo.value > 0 ? (delta / penultimo.value) * 100 : null;
      const pctMuitoAlto = pct != null && Math.abs(pct) > 100;
      const pctTxt = pct != null && !pctMuitoAlto
        ? `${Math.abs(pct).toFixed(1).replace('.', ',')}%`
        : `${Math.abs(delta).toFixed(1).replace('.', ',')} ${unidadeFallback}`;
      return { delta, improving, pct, label: `${improving ? 'Melhorou' : 'Piorou'} ${pctTxt} desde ${penultimo.ano}`, anoAnterior: penultimo.ano };
    };

    if (ind.ideb) {
      const vals = [
        { v: ind.ideb.ideb_ai, name: 'Anos Iniciais', field: 'ideb_ai' as const },
        { v: ind.ideb.ideb_af, name: 'Anos Finais', field: 'ideb_af' as const },
        { v: ind.ideb.ideb_em, name: 'Ensino Médio', field: 'ideb_em' as const },
      ];
      for (const { v, name, field } of vals) {
        if (v != null && Number(v) > 0) {
          const progressao = getIdebProgressao(field);
          const historicoTxt = getIdebHistoricoResumo(field);
          if (Number(v) < 4.0) {
            alertas.push({ tipo: 'critical', titulo: `IDEB ${name}: ${Number(v).toFixed(1)}`, descricao: `${progressao?.improving ? `O IDEB de ${name} ainda está abaixo de 4,0, mas vem melhorando. Continue com o plano pedagógico para acelerar a evolução.` : progressao ? `O IDEB de ${name} está abaixo de 4,0 e vem piorando. Recomenda-se plano pedagógico imediato com metas claras.` : `O IDEB de ${name} está abaixo de 4,0. Recomenda-se elaborar um plano de melhoria pedagógica com metas claras.`}${historicoTxt ? ` ${historicoTxt}.` : ''}`, indicador: 'ideb', progressao });
          } else if (Number(v) < 5.0) {
            alertas.push({ tipo: 'warning', titulo: `IDEB ${name}: ${Number(v).toFixed(1)}`, descricao: `${progressao?.improving ? `O IDEB de ${name} está em trajetória positiva. Mantenha as ações pedagógicas que estão surtindo efeito.` : progressao ? `O IDEB de ${name} merece atenção, pois apresentou piora recente.` : `O IDEB de ${name} está entre 4,0 e 5,0. Recomenda-se acompanhamento e planejamento de ações pedagógicas.`}${historicoTxt ? ` ${historicoTxt}.` : ''}`, indicador: 'ideb', progressao });
          }
        }
      }
    }

    if (ind.taxas_rendimento) {
      const abandono = [
        { v: ind.taxas_rendimento.abandono_fund, name: 'Fundamental', field: 'abandono_fund', limCrit: 5, limWarn: 2 },
        { v: ind.taxas_rendimento.abandono_med,  name: 'Ensino Médio', field: 'abandono_med',  limCrit: 8, limWarn: 4 },
      ];
      for (const { v, name, field, limCrit, limWarn } of abandono) {
        if (v == null) continue;
        const progressao = getProgressaoInd('taxas_rendimento', field, false, 'p.p.');
        if (Number(v) > limCrit) {
          alertas.push({ tipo: 'critical', titulo: `Abandono escolar no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `A taxa de abandono está caindo — bom sinal! Ainda está acima do ideal, então continue com as ações de busca ativa.` : progressao ? `A taxa de abandono está alta e em piora recente. Priorize busca ativa e acolhimento dos alunos.` : `A taxa de abandono acima de ${limCrit}% exige ações imediatas de busca ativa e acolhimento dos alunos.`, indicador: 'taxas_rendimento', progressao });
        } else if (Number(v) > limWarn) {
          alertas.push({ tipo: 'warning', titulo: `Abandono escolar no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `A taxa de abandono está caindo. Mantenha as estratégias de permanência que estão funcionando.` : progressao ? `A taxa de abandono merece atenção e apresentou piora recente.` : `A taxa de abandono merece atenção. Identifique os alunos em risco e implemente estratégias de permanência.`, indicador: 'taxas_rendimento', progressao });
        }
      }
      const reprov = [
        { v: ind.taxas_rendimento.reprovacao_fund, name: 'Fundamental', field: 'reprovacao_fund', limCrit: 20, limWarn: 10 },
        { v: ind.taxas_rendimento.reprovacao_med,  name: 'Ensino Médio', field: 'reprovacao_med',  limCrit: 20, limWarn: 10 },
      ];
      for (const { v, name, field, limCrit, limWarn } of reprov) {
        if (v == null) continue;
        const progressao = getProgressaoInd('taxas_rendimento', field, false, 'p.p.');
        if (Number(v) > limCrit) {
          alertas.push({ tipo: 'critical', titulo: `Reprovação no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `A reprovação está diminuindo — ótimo caminho! Ainda está acima de ${limCrit}%, então vale continuar revisando as práticas avaliativas.` : progressao ? `A reprovação está alta e com piora recente. Reforce acompanhamento e revisão avaliativa.` : `Taxa de reprovação acima de ${limCrit}% indica necessidade de revisão das práticas pedagógicas e avaliativas.`, indicador: 'taxas_rendimento', progressao });
        } else if (Number(v) > limWarn) {
          alertas.push({ tipo: 'warning', titulo: `Reprovação no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `A reprovação está em queda. Continue com o acompanhamento e reforço escolar.` : progressao ? `A reprovação está em faixa de atenção e apresentou piora recente.` : `Taxa de reprovação entre ${limWarn}% e ${limCrit}%. Avalie as causas e considere reforço escolar e acompanhamento individualizado.`, indicador: 'taxas_rendimento', progressao });
        }
      }
    }

    if (ind.tdi) {
      const tdiVals = [
        { v: ind.tdi.fundamental_total, name: 'Fundamental', field: 'fundamental_total' },
        { v: ind.tdi.medio_total,       name: 'Ensino Médio', field: 'medio_total' },
      ];
      for (const { v, name, field } of tdiVals) {
        if (v == null) continue;
        const progressao = getProgressaoInd('tdi', field, false, 'p.p.');
        if (Number(v) > 30) {
          const tipo = progressao?.improving ? 'warning' as const : 'critical' as const;
          alertas.push({ tipo, titulo: `Distorção idade-série no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `A distorção está em queda — a escola está avançando. Para seguir reduzindo, reforçar as ações de recomposição da aprendizagem e os programas de aceleração de estudos tende a trazer bons resultados.` : progressao ? `A distorção está alta e em piora recente. Priorize recomposição da aprendizagem e aceleração de estudos.` : `Mais de 30% dos alunos estão com 2 anos ou mais de defasagem idade-série. Ações de recomposição da aprendizagem e programas de aceleração de estudos são estratégias reconhecidas pelo MEC para reduzir essa distorção.`, indicador: 'tdi', progressao });
        } else if (Number(v) > 20) {
          alertas.push({ tipo: 'warning', titulo: `Distorção idade-série no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `A distorção está diminuindo — bom sinal. Continue com as intervenções pedagógicas e priorize a recomposição da aprendizagem dos alunos em situação de maior defasagem.` : progressao ? `A distorção segue em faixa de atenção e apresentou piora recente.` : `Entre 20% e 30% dos alunos estão com defasagem de 2 anos ou mais. Planeje intervenções pedagógicas com foco em recomposição da aprendizagem.`, indicador: 'tdi', progressao });
        }
      }
    }

    if (ind.dsu) {
      const dsuVals = [
        { v: ind.dsu.percentual_fund, name: 'Fundamental', field: 'percentual_fund' },
        { v: ind.dsu.percentual_med,  name: 'Ensino Médio', field: 'percentual_med' },
      ];
      for (const { v, name, field } of dsuVals) {
        if (v == null || Number(v) <= 0) continue;
        const progressao = getProgressaoInd('dsu', field, true, 'p.p.');
        if (Number(v) < 60) {
          alertas.push({ tipo: 'critical', titulo: `Docentes com ensino superior no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `O percentual está crescendo — boa notícia! Ainda está abaixo de 60%, então continue incentivando a formação continuada.` : progressao ? `O percentual de docentes com superior está baixo e em queda recente.` : `Menos de 60% dos docentes possuem formação superior. Isso impacta diretamente a qualidade do ensino.`, indicador: 'dsu', progressao });
        } else if (Number(v) < 80) {
          alertas.push({ tipo: 'warning', titulo: `Formação docente no ${name}: ${Number(v).toFixed(1)}%`, descricao: progressao?.improving ? `O percentual de docentes com superior está aumentando. Continue incentivando a formação continuada.` : progressao ? `A formação docente está em faixa de atenção e apresentou piora recente.` : `Entre 60% e 80% dos docentes têm curso superior. Incentive a formação continuada.`, indicador: 'dsu', progressao });
        }
      }
    }

    if (ind.had) {
      const hadVals = [
        { v: ind.had.media_fund, name: 'Fundamental', field: 'media_fund' },
        { v: ind.had.media_med,  name: 'Ensino Médio', field: 'media_med' },
      ];
      for (const { v, name, field } of hadVals) {
        if (v == null || Number(v) <= 0 || Number(v) >= 4) continue;
        const progressao = getProgressaoInd('had', field, true, 'unidades');
        alertas.push({ tipo: 'warning', titulo: `Carga horária no ${name}: ${Number(v).toFixed(1)}h/dia`, descricao: progressao?.improving ? `A carga horária está aumentando — ótimo sinal! Continue buscando ampliar a jornada escolar.` : progressao ? `A carga horária segue baixa e apresentou piora recente.` : `A média de horas-aula diária está abaixo de 4 horas. Considere ampliar a jornada escolar.`, indicador: 'had', progressao });
      }
    }

    if (ind.atu) {
      const atuVals = [
        { v: ind.atu.media_fund, name: 'Fundamental', field: 'media_fund' },
        { v: ind.atu.media_med,  name: 'Ensino Médio', field: 'media_med' },
      ];
      for (const { v, name, field } of atuVals) {
        if (v == null || Number(v) <= 35) continue;
        const progressao = getProgressaoInd('atu', field, false, 'unidades');
        alertas.push({ tipo: 'warning', titulo: `Alunos por turma no ${name}: ${Number(v).toFixed(1)}`, descricao: progressao?.improving ? `O número de alunos por turma está caindo. Continue trabalhando para reduzir a superlotação.` : progressao ? `A superlotação está em piora recente e exige ajuste de turmas.` : `A média de alunos por turma acima de 35 prejudica a qualidade do atendimento pedagógico.`, indicador: 'atu', progressao });
      }
    }

    if (ind.ird) {
      const media = Number(ind.ird.media_ird ?? ind.ird.media);
      if (media > 0 && media < 2.0) {
        const progressao = getProgressaoInd('ird', 'media_ird', true, 'pontos') || getProgressaoInd('ird', 'media', true, 'pontos');
        alertas.push({ tipo: 'warning', titulo: `Regularidade docente: ${media.toFixed(2)}`, descricao: progressao?.improving ? `A regularidade docente está melhorando. Continue trabalhando para reduzir a rotatividade.` : progressao ? `A regularidade docente está em piora recente, com maior risco de rotatividade.` : `O índice de regularidade docente está abaixo de 2,0, indicando alta rotatividade de professores.`, indicador: 'ird', progressao });
      }
    }

    if (ind.afd) {
      const funCat1 = Number(ind.afd.fun_cat_1);
      if (funCat1 > 0 && funCat1 < 50) {
        const progressao = getProgressaoInd('afd', 'fun_cat_1', true, 'p.p.');
        alertas.push({ tipo: 'warning', titulo: `Adequação da formação docente: ${funCat1.toFixed(1)}%`, descricao: progressao?.improving ? `O percentual de docentes com formação adequada está crescendo. Continue incentivando a especialização por área.` : progressao ? `A adequação da formação docente apresentou piora recente.` : `Menos de 50% dos docentes do Fundamental possuem formação adequada (Grupo 1). Isso afeta a qualidade do ensino.`, indicador: 'afd', progressao });
      }
    }

    if (ind.ied) {
      const n5 = Number(ind.ied.nivel_5 || 0);
      const n6 = Number(ind.ied.nivel_6 || 0);
      if ((n5 + n6) > 50) {
        const progressao = getProgressaoInd('ied', 'nivel_5', false, 'p.p.');
        alertas.push({ tipo: 'warning', titulo: `Sobrecarga docente: ${(n5 + n6).toFixed(1)}% nos níveis 5 e 6`, descricao: progressao?.improving ? `A sobrecarga docente está diminuindo — bom progresso! Continue buscando equilibrar a carga de trabalho.` : progressao ? `A sobrecarga docente apresentou piora recente e merece intervenção de gestão.` : `Mais da metade dos docentes atuam com sobrecarga (múltiplas escolas e turnos). Isso pode impactar a qualidade do trabalho pedagógico.`, indicador: 'ied', progressao });
      }
    }

    return alertas;
  }, [indicadoresLatest, evolucaoData]);

  const evolutionCharts = useMemo(() => {
    if (!evolucaoData) return null;
    const anos = (evolucaoData.anos_disponiveis as number[]).filter((a: number) => a >= 2020);
    const censo = evolucaoData.censo_por_ano;
    const indicadores = evolucaoData.indicadores_por_ano;

    return {
      matriculas: anos.map((a: number) => ({ ano: a, value: censo[a]?.qt_mat_bas || 0 })),
      docentes: anos.map((a: number) => ({ ano: a, value: censo[a]?.qt_doc_bas || censo[a]?.qt_docentes || 0 })),
      turmas: anos.map((a: number) => ({ ano: a, value: censo[a]?.qt_tur_bas || censo[a]?.qt_turmas || 0 })),
      taxasRendimento: anos.map((a: number) => {
        const tr = indicadores[a]?.taxas_rendimento;
        if (!tr) return { ano: a };
        // Safeguard: "--" or non-numeric values (e.g. from cached Railway data) → null
        const r = (v: any): number | null => {
          if (v == null || v === '--' || v === '') return null;
          const n = Number(v); return isNaN(n) ? null : n;
        };
        return {
          ano: a,
          aprovacao: r(tr.aprovacao_fund) ?? r(tr.aprovacao_total) ?? null,
          reprovacao: r(tr.reprovacao_fund) ?? r(tr.reprovacao_total) ?? null,
          abandono: r(tr.abandono_fund) ?? r(tr.abandono_total) ?? null,
          aprovacao_ai: r(tr.aprovacao_fund_ai) ?? null,
          reprovacao_ai: r(tr.reprovacao_fund_ai) ?? null,
          abandono_ai: r(tr.abandono_fund_ai) ?? null,
          aprovacao_af: r(tr.aprovacao_fund_af) ?? null,
          reprovacao_af: r(tr.reprovacao_fund_af) ?? null,
          abandono_af: r(tr.abandono_fund_af) ?? null,
          aprovacao_med: r(tr.aprovacao_med) ?? null,
          reprovacao_med: r(tr.reprovacao_med) ?? null,
          abandono_med: r(tr.abandono_med) ?? null,
          // Por série — Anos Finais (6º–9º)
          aprov_f06: r(tr.aprovacao_fun_06), aprov_f07: r(tr.aprovacao_fun_07),
          aprov_f08: r(tr.aprovacao_fun_08), aprov_f09: r(tr.aprovacao_fun_09),
          reprov_f06: r(tr.reprovacao_fun_06), reprov_f07: r(tr.reprovacao_fun_07),
          reprov_f08: r(tr.reprovacao_fun_08), reprov_f09: r(tr.reprovacao_fun_09),
          aband_f06: r(tr.abandono_fun_06), aband_f07: r(tr.abandono_fun_07),
          aband_f08: r(tr.abandono_fun_08), aband_f09: r(tr.abandono_fun_09),
          // Por série — Anos Iniciais (1º–5º)
          aprov_f01: r(tr.aprovacao_fun_01), aprov_f02: r(tr.aprovacao_fun_02),
          aprov_f03: r(tr.aprovacao_fun_03), aprov_f04: r(tr.aprovacao_fun_04), aprov_f05: r(tr.aprovacao_fun_05),
          reprov_f01: r(tr.reprovacao_fun_01), reprov_f02: r(tr.reprovacao_fun_02),
          reprov_f03: r(tr.reprovacao_fun_03), reprov_f04: r(tr.reprovacao_fun_04), reprov_f05: r(tr.reprovacao_fun_05),
          aband_f01: r(tr.abandono_fun_01), aband_f02: r(tr.abandono_fun_02),
          aband_f03: r(tr.abandono_fun_03), aband_f04: r(tr.abandono_fun_04), aband_f05: r(tr.abandono_fun_05),
          // Por série — Ensino Médio (1ª–3ª)
          aprov_m01: r(tr.aprovacao_med_01), aprov_m02: r(tr.aprovacao_med_02), aprov_m03: r(tr.aprovacao_med_03),
          reprov_m01: r(tr.reprovacao_med_01), reprov_m02: r(tr.reprovacao_med_02), reprov_m03: r(tr.reprovacao_med_03),
          aband_m01: r(tr.abandono_med_01), aband_m02: r(tr.abandono_med_02), aband_m03: r(tr.abandono_med_03),
        };
      }),
      tdi: anos.map((a: number) => {
        const t = indicadores[a]?.tdi;
        if (!t) return { ano: a };
        return {
          ano: a,
          fund_total: t.fundamental_total ?? null,
          fund_ai:    t.fundamental_ai   ?? null,
          fund_af:    t.fundamental_af   ?? null,
          medio:      t.medio_total      ?? null,
          // Por ano — Fundamental (campos reais do INEP)
          f01: t.fund_1ano ?? null, f02: t.fund_2ano ?? null, f03: t.fund_3ano ?? null,
          f04: t.fund_4ano ?? null, f05: t.fund_5ano ?? null,
          f06: t.fund_6ano ?? null, f07: t.fund_7ano ?? null,
          f08: t.fund_8ano ?? null, f09: t.fund_9ano ?? null,
          // Por série — Ensino Médio (campos reais do INEP)
          m01: t.medio_1serie ?? null, m02: t.medio_2serie ?? null,
          m03: t.medio_3serie ?? null, m04: t.medio_4serie ?? null,
        };
      }),
      atu: anos.map((a: number) => {
        const at = indicadores[a]?.atu;
        if (!at) return { ano: a };
        return {
          ano: a,
          // Educação Infantil
          inf_total:   at.inf_cat_0       ?? null,
          inf_cre:     at.inf_cre_cat_0   ?? null,
          inf_pre:     at.inf_pre_cat_0   ?? null,
          // Ensino Fundamental
          fund:        at.fun_cat_0       ?? at.media_fund    ?? null,
          fund_ai:     at.fun_ai_cat_0    ?? at.media_fund_ai ?? null,
          fund_af:     at.fun_af_cat_0    ?? at.media_fund_af ?? null,
          fun_01:      at.fun_01_cat_0    ?? null,
          fun_02:      at.fun_02_cat_0    ?? null,
          fun_03:      at.fun_03_cat_0    ?? null,
          fun_04:      at.fun_04_cat_0    ?? null,
          fun_05:      at.fun_05_cat_0    ?? null,
          fun_06:      at.fun_06_cat_0    ?? null,
          fun_07:      at.fun_07_cat_0    ?? null,
          fun_08:      at.fun_08_cat_0    ?? null,
          fun_09:      at.fun_09_cat_0    ?? null,
          fun_mul:     at.fun_mul_cat_0   ?? null,  // Multietapa/Multi/Correção de Fluxo
          // Ensino Médio
          medio:       at.med_cat_0       ?? at.media_med     ?? null,
          eja_fun:     at.eja_fun_cat_0   ?? at.ef_cat_0      ?? at.media_eja_fund ?? null,
          eja_med:     at.eja_med_cat_0   ?? at.em_cat_0      ?? at.media_eja_med ?? null,
          med_01:      at.med_01_cat_0    ?? null,
          med_02:      at.med_02_cat_0    ?? null,
          med_03:      at.med_03_cat_0    ?? null,
          med_04:      at.med_04_cat_0    ?? null,
          med_ns:      at.med_ns_cat_0    ?? null,
        };
      }),
      had: anos.map((a: number) => {
        const h = indicadores[a]?.had;
        if (!h) return { ano: a };
        return {
          ano: a,
          // Educação Infantil
          inf_total:   h.inf_cat_0       ?? null,
          inf_cre:     h.inf_cre_cat_0   ?? null,
          inf_pre:     h.inf_pre_cat_0   ?? null,
          // Ensino Fundamental
          fund:        h.fun_cat_0       ?? h.media_fund    ?? null,
          fund_ai:     h.fun_ai_cat_0    ?? h.media_fund_ai ?? null,
          fund_af:     h.fun_af_cat_0    ?? h.media_fund_af ?? null,
          fun_01:      h.fun_01_cat_0    ?? null,
          fun_02:      h.fun_02_cat_0    ?? null,
          fun_03:      h.fun_03_cat_0    ?? null,
          fun_04:      h.fun_04_cat_0    ?? null,
          fun_05:      h.fun_05_cat_0    ?? null,
          fun_06:      h.fun_06_cat_0    ?? null,
          fun_07:      h.fun_07_cat_0    ?? null,
          fun_08:      h.fun_08_cat_0    ?? null,
          fun_09:      h.fun_09_cat_0    ?? null,
          // Ensino Médio
          medio:       h.med_cat_0       ?? h.media_med     ?? null,
          eja_fun:     h.eja_fun_cat_0   ?? h.ef_cat_0      ?? h.media_eja_fund ?? null,
          eja_med:     h.eja_med_cat_0   ?? h.em_cat_0      ?? h.media_eja_med ?? null,
          med_01:      h.med_01_cat_0    ?? null,
          med_02:      h.med_02_cat_0    ?? null,
          med_03:      h.med_03_cat_0    ?? null,
          med_04:      h.med_04_cat_0    ?? null,
          med_ns:      h.med_ns_cat_0    ?? null,
        };
      }),
      dsu: anos.map((a: number) => {
        const d = indicadores[a]?.dsu;
        if (!d) return { ano: a };
        return {
          ano: a,
          fund: d.percentual_fund ?? null,
          fund_ai: d.percentual_fund_ai ?? null,
          fund_af: d.percentual_fund_af ?? null,
          medio: d.percentual_med ?? null,
        };
      }),
      icg: anos.map((a: number) => {
        const ic = indicadores[a]?.icg;
        if (!ic) return { ano: a };
        return { ano: a, nivel: ic.nivel ?? null };
      }),
      ird: anos.map((a: number) => {
        const ir = indicadores[a]?.ird;
        if (!ir) return { ano: a };
        return { ano: a, media: ir.media_ird ?? ir.media ?? null };
      }),
      ideb: anos.map((a: number) => {
        const id = indicadores[a]?.ideb;
        if (!id) return null;
        const ideb_ai = id.ideb_ai ?? id.ideb ?? null;
        const ideb_af = id.ideb_af ?? null;
        const ideb_em = id.ideb_em ?? null;
        // IDEB é bienal — só incluir anos com nota real publicada
        if (ideb_ai == null && ideb_af == null && ideb_em == null) return null;
        return { ano: a, ideb_ai, ideb_af, ideb_em };
      }).filter(Boolean) as any[],
      inse: anos.map((a: number) => {
        const ins = indicadores[a]?.inse;
        if (!ins) return null;
        const media = ins.media_inse ?? ins.valor ?? null;
        // INSE não é anual — só incluir anos com dado real publicado
        if (media == null) return null;
        return {
          ano: a,
          media,
          classificacao: ins.inse_classificacao ?? ins.nivel_inse ?? null,
          qtd_alunos: ins.qtd_alunos_inse ?? null,
          n1: ins.pc_nivel_1 ?? null, n2: ins.pc_nivel_2 ?? null,
          n3: ins.pc_nivel_3 ?? null, n4: ins.pc_nivel_4 ?? null,
          n5: ins.pc_nivel_5 ?? null, n6: ins.pc_nivel_6 ?? null,
          n7: ins.pc_nivel_7 ?? null, n8: ins.pc_nivel_8 ?? null,
        };
      }).filter(Boolean) as any[],
      saeb: anos.map((a: number) => {
        const s = indicadores[a]?.saeb;
        if (!s) return null;
        const mt_ai = s.nota_mt_ai ?? null;
        const lp_ai = s.nota_lp_ai ?? null;
        const mt_af = s.nota_mt_af ?? null;
        const lp_af = s.nota_lp_af ?? null;
        const mt_em = s.nota_mt_em ?? null;
        const lp_em = s.nota_lp_em ?? null;
        // SAEB é bienal — só incluir anos com proficiência real publicada
        if (mt_ai == null && lp_ai == null && mt_af == null && lp_af == null && mt_em == null && lp_em == null) return null;
        return { ano: a, mt_ai, lp_ai, mt_af, lp_af, mt_em, lp_em };
      }).filter(Boolean) as any[],
      ied: anos.map((a: number) => {
        const ie = indicadores[a]?.ied;
        if (!ie) return { ano: a };
        return {
          ano: a,
          nivel_1: ie.nivel_1 ?? null, nivel_2: ie.nivel_2 ?? null, nivel_3: ie.nivel_3 ?? null,
          nivel_4: ie.nivel_4 ?? null, nivel_5: ie.nivel_5 ?? null, nivel_6: ie.nivel_6 ?? null,
          fund_ai_nivel_1: ie.fund_ai_nivel_1 ?? null, fund_ai_nivel_2: ie.fund_ai_nivel_2 ?? null,
          fund_ai_nivel_3: ie.fund_ai_nivel_3 ?? null, fund_ai_nivel_4: ie.fund_ai_nivel_4 ?? null,
          fund_ai_nivel_5: ie.fund_ai_nivel_5 ?? null, fund_ai_nivel_6: ie.fund_ai_nivel_6 ?? null,
          fund_af_nivel_1: ie.fund_af_nivel_1 ?? null, fund_af_nivel_2: ie.fund_af_nivel_2 ?? null,
          fund_af_nivel_3: ie.fund_af_nivel_3 ?? null, fund_af_nivel_4: ie.fund_af_nivel_4 ?? null,
          fund_af_nivel_5: ie.fund_af_nivel_5 ?? null, fund_af_nivel_6: ie.fund_af_nivel_6 ?? null,
          med_nivel_1: ie.med_nivel_1 ?? null, med_nivel_2: ie.med_nivel_2 ?? null,
          med_nivel_3: ie.med_nivel_3 ?? null, med_nivel_4: ie.med_nivel_4 ?? null,
          med_nivel_5: ie.med_nivel_5 ?? null, med_nivel_6: ie.med_nivel_6 ?? null,
        };
      }),
      tnr: anos.map((a: number) => {
        const t = indicadores[a]?.taxa_nao_resposta;
        if (!t) return { ano: a };
        return {
          ano: a,
          fund: t.taxa_nao_resposta_fund ?? t.tnr_fund ?? null,
          med:  t.taxa_nao_resposta_med  ?? t.tnr_med  ?? null,
          fund_ai: t.taxa_nao_resposta_fund_ai ?? null,
          fund_af: t.taxa_nao_resposta_fund_af ?? null,
          // por série — Fundamental Anos Iniciais
          f01: t.tnr_fun_01 ?? null, f02: t.tnr_fun_02 ?? null, f03: t.tnr_fun_03 ?? null,
          f04: t.tnr_fun_04 ?? null, f05: t.tnr_fun_05 ?? null,
          // por série — Fundamental Anos Finais
          f06: t.tnr_fun_06 ?? null, f07: t.tnr_fun_07 ?? null,
          f08: t.tnr_fun_08 ?? null, f09: t.tnr_fun_09 ?? null,
          // por série — Ensino Médio
          m01: t.tnr_med_01 ?? null, m02: t.tnr_med_02 ?? null,
          m03: t.tnr_med_03 ?? null, m04: t.tnr_med_04 ?? null,
        };
      }),
      afd: anos.map((a: number) => {
        const af = indicadores[a]?.afd;
        if (!af) return { ano: a };
        const g = (base: string, n: number) => af[`${base}_cat_${n}`] ?? null;
        return {
          ano: a,
          // Ed. Infantil (INF_)
          inf_g1: g('inf', 1), inf_g2: g('inf', 2), inf_g3: g('inf', 3), inf_g4: g('inf', 4), inf_g5: g('inf', 5),
          // Fundamental Total (FUN_)
          fun_g1: g('fun', 1), fun_g2: g('fun', 2), fun_g3: g('fun', 3), fun_g4: g('fun', 4), fun_g5: g('fun', 5),
          // Fundamental AI (FUN_AI_)
          fun_ai_g1: g('fun_ai', 1), fun_ai_g2: g('fun_ai', 2), fun_ai_g3: g('fun_ai', 3), fun_ai_g4: g('fun_ai', 4), fun_ai_g5: g('fun_ai', 5),
          // Fundamental AF (FUN_AF_)
          fun_af_g1: g('fun_af', 1), fun_af_g2: g('fun_af', 2), fun_af_g3: g('fun_af', 3), fun_af_g4: g('fun_af', 4), fun_af_g5: g('fun_af', 5),
          // Ensino Médio (MED_)
          med_g1: g('med', 1), med_g2: g('med', 2), med_g3: g('med', 3), med_g4: g('med', 4), med_g5: g('med', 5),
          // EJA Fundamental
          eja_fun_g1: g('eja_fun', 1), eja_fun_g2: g('eja_fun', 2), eja_fun_g3: g('eja_fun', 3), eja_fun_g4: g('eja_fun', 4), eja_fun_g5: g('eja_fun', 5),
          // EJA Médio
          eja_med_g1: g('eja_med', 1), eja_med_g2: g('eja_med', 2), eja_med_g3: g('eja_med', 3), eja_med_g4: g('eja_med', 4), eja_med_g5: g('eja_med', 5),
        };
      }),
    };
  }, [evolucaoData]);

  const ufChartData = useMemo(() => {
    if (!stats?.por_uf) return [];
    return Object.entries(stats.por_uf)
      .map(([uf, count]) => ({ uf, name: UF_NAMES[uf] || uf, escolas: count as number }))
      .sort((a, b) => b.escolas - a.escolas);
  }, [stats]);

  const totalEscolasAtivas = useMemo(() => {
    if (!stats) return 0;

    const porSituacao = (stats as any).por_situacao as Record<string, number> | undefined;
    if (!porSituacao) return Number((stats as any).total_escolas || 0);

    const entradaAtiva = Object.entries(porSituacao).find(([key]) => {
      const k = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return k.includes("atividade") || k.includes("ativa");
    });

    if (entradaAtiva) return Number(entradaAtiva[1] || 0);
    return Number((stats as any).total_escolas || 0);
  }, [stats]);

  const depChartData = useMemo(() => {
    if (!stats?.por_dependencia) return [];
    return Object.entries(stats.por_dependencia)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [stats]);

  const locChartData = useMemo(() => {
    if (!stats?.por_localizacao) return [];
    return Object.entries(stats.por_localizacao)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [stats]);

  const sitChartData = useMemo(() => {
    if (!stats?.por_situacao) return [];
    return Object.entries(stats.por_situacao)
      .map(([name, value]) => ({ name, value: value as number }));
  }, [stats]);

  const formatNumber = (n: number) => n?.toLocaleString("pt-BR") || "0";

  const hasMultipleYears = (evolucaoData?.anos_disponiveis?.length || 0) > 1;

  const secNavItems = [
    { id: 'sec-ficha',      icon: <School size={12} />,        title: 'Ficha',        bg: '#e6eef8', border: '#b8cfe8', color: '#1e4a78' },
    { id: 'sec-desempenho', icon: <BarChart3 size={12} />,     title: 'Desempenho',   bg: '#fdf3e0', border: '#f0ddb5', color: '#7a4a10' },
    { id: 'sec-tnr',        icon: <AlertTriangle size={12} />, title: 'Não Resposta', bg: '#fdf0f0', border: '#f5c6c6', color: '#b74f42' },
    { id: 'sec-inse',       icon: <Scale size={12} />,         title: 'INSE',         bg: '#f3eeff', border: '#d4c4f5', color: '#5b3fa8' },
    { id: 'sec-tdi',        icon: <CalendarDays size={12} />,  title: 'Distorção',    bg: '#e8f5ee', border: '#b8dfc8', color: '#2f7a58' },
    { id: 'sec-matriculas', icon: <Users size={12} />,         title: 'Matrículas',   bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    { id: 'sec-estrutura',  icon: <Building2 size={12} />,     title: 'Estrutura',    bg: '#f1f5f9', border: '#cbd5e1', color: '#334155' },
    { id: 'sec-ied',        icon: <Wrench size={12} />,        title: 'Esforço',      bg: '#fefce8', border: '#fde68a', color: '#854d0e' },
    { id: 'sec-afd',        icon: <GraduationCap size={12} />, title: 'Formação',     bg: '#e6eef8', border: '#b8cfe8', color: '#1e4a78' },
    { id: 'sec-atu',        icon: <Users size={12} />,         title: 'Turma',        bg: '#fdf3e0', border: '#f0ddb5', color: '#9b6a16' },
    { id: 'sec-had',        icon: <Clock size={12} />,         title: 'Horas-aula',   bg: '#fff7ed', border: '#fed7aa', color: '#9a3412' },
    { id: 'sec-evolucao-censo', icon: <ClipboardList size={12} />, title: 'Evolução',  bg: '#eef4fb', border: '#b8cde8', color: '#2d5a88' },
    { id: 'sec-retrato',    icon: <BookOpen size={12} />,      title: 'Retrato',      bg: '#faf7f2', border: '#e8dfc8', color: '#5d4037' },
    { id: 'sec-pdde',       icon: <DollarSign size={12} />,    title: 'PDDE',         bg: '#e8f5ee', border: '#b8dfc8', color: '#1f6b45' },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* ── LINGUINHAS DE FICHÁRIO ── */}
      {selectedInep && (
        <div style={{
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 200, display: 'flex', flexDirection: 'column', gap: 2,
          pointerEvents: 'auto',
        }}>
          <button
            title="Visão geral"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 8px 5px 5px',
              background: '#f0f4ff', border: '1px solid #b8c8e8', borderLeft: 'none',
              borderRadius: '0 7px 7px 0', cursor: 'pointer',
              boxShadow: '2px 1px 5px rgba(0,0,0,0.13)',
              transform: 'translateX(-2px)', transition: 'transform 0.15s, box-shadow 0.15s, max-width 0.18s',
              overflow: 'hidden', maxWidth: 28, marginBottom: 6,
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.transform='translateX(0)'; b.style.maxWidth='120px'; b.style.boxShadow='3px 2px 8px rgba(0,0,0,0.18)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.transform='translateX(-2px)'; b.style.maxWidth='28px'; b.style.boxShadow='2px 1px 5px rgba(0,0,0,0.13)'; }}
          >
            <span style={{ color: '#2d5a88', display: 'flex', flexShrink: 0 }}><Home size={12} /></span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2d5a88', whiteSpace: 'nowrap' }}>Visão geral</span>
          </button>

          {secNavItems.filter(tab => visibleSecIds.size === 0 || visibleSecIds.has(tab.id)).map(tab => {
            const isHidden = hiddenSecs.has(tab.id);
            return (
              <button
                key={tab.id}
                title={isHidden ? `Mostrar: ${tab.title}` : `Ir para: ${tab.title}`}
                onClick={() => {
                  if (isHidden) {
                    setHiddenSecs(prev => { const n = new Set(prev); n.delete(tab.id); return n; });
                    setTimeout(() => { const el = document.getElementById(tab.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
                  } else {
                    const el = document.getElementById(tab.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 8px 5px 5px',
                  background: isHidden ? '#f0f0ee' : tab.bg,
                  border: `1px solid ${isHidden ? '#ccc' : tab.border}`,
                  borderLeft: 'none',
                  borderRadius: '0 7px 7px 0',
                  cursor: 'pointer',
                  boxShadow: '2px 1px 5px rgba(0,0,0,0.13)',
                  transform: 'translateX(-2px)',
                  transition: 'transform 0.15s, box-shadow 0.15s, max-width 0.18s',
                  overflow: 'hidden',
                  maxWidth: 28,
                  opacity: isHidden ? 0.55 : 1,
                }}
                onMouseEnter={e => {
                  const btn = e.currentTarget;
                  btn.style.transform = 'translateX(0)';
                  btn.style.maxWidth = '150px';
                  btn.style.boxShadow = '3px 2px 8px rgba(0,0,0,0.18)';
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget;
                  btn.style.transform = 'translateX(-2px)';
                  btn.style.maxWidth = '28px';
                  btn.style.boxShadow = '2px 1px 5px rgba(0,0,0,0.13)';
                }}
              >
                <span style={{ color: isHidden ? '#999' : tab.color, display: 'flex', flexShrink: 0, fontSize: 10, fontWeight: 900 }}>
                  {isHidden ? '+' : tab.icon}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: isHidden ? '#999' : tab.color, whiteSpace: 'nowrap', overflow: 'hidden', textDecoration: isHidden ? 'line-through' : 'none' }}>
                  {tab.title}
                </span>
                {!isHidden && (
                  <span
                    onClick={e => { e.stopPropagation(); setHiddenSecs(prev => { const n = new Set(prev); n.add(tab.id); return n; }); }}
                    title="Fechar seção"
                    style={{ fontSize: 11, color: tab.color, marginLeft: 2, paddingLeft: 2, flexShrink: 0, opacity: 0.6, fontWeight: 900, lineHeight: 1 }}
                  >×</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d9ceb8] bg-[#fbf7ee] shadow-[0_20px_60px_rgba(90,80,50,0.10)] p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Dados Educacionais</h1>
          <p className="text-sm text-muted-foreground mt-1">Fonte: INEP/MEC, FNDE e Banco do Brasil</p>
        </div>

        {/* ABAS ESTILO CHROME */}
        {schoolTabs.length > 0 && (
          <div className="flex items-end gap-0.5 mt-4 -mb-px overflow-x-auto" style={{scrollbarWidth:'none'}}>
            {/* Aba Visão Geral */}
            <button
              onClick={() => setActiveTabId("overview")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border border-border/60 transition-all shrink-0"
              style={{
                background: activeTabId === "overview" ? "var(--background, #fff)" : "#f1f5f9",
                borderBottom: activeTabId === "overview" ? "2px solid var(--background, #fff)" : "1px solid #e2e8f0",
                color: activeTabId === "overview" ? "#1e3a5f" : "#64748b",
                fontWeight: activeTabId === "overview" ? 700 : 500,
                zIndex: activeTabId === "overview" ? 2 : 1,
                marginBottom: activeTabId === "overview" ? "-1px" : 0,
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Visão Geral
            </button>
            {/* Abas de escolas */}
            {schoolTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className="flex items-center gap-2 pl-4 pr-2 py-2.5 text-sm font-medium rounded-t-xl border border-border/60 transition-all group shrink-0 max-w-[220px]"
                style={{
                  background: activeTabId === tab.id ? "var(--background, #fff)" : "#f1f5f9",
                  borderBottom: activeTabId === tab.id ? "2px solid var(--background, #fff)" : "1px solid #e2e8f0",
                  color: activeTabId === tab.id ? "#1e3a5f" : "#64748b",
                  fontWeight: activeTabId === tab.id ? 700 : 500,
                  zIndex: activeTabId === tab.id ? 2 : 1,
                  marginBottom: activeTabId === tab.id ? "-1px" : 0,
                }}
              >
                <School className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
                <span
                  onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/10 opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        )}
        {/* Linha divisória abaixo das abas */}
        {schoolTabs.length > 0 && (
          <div className="border-b border-border/60 -mt-0.5 mb-2" />
        )}

        <div className="space-y-6">
            {/* BUSCA DE ESCOLA */}
            {!selectedInep && <Card className="card-clay" style={{background:'linear-gradient(135deg,#f0f7ff 0%,#e8f5e9 100%)',border:'1.5px solid #c8dff7',position:'relative',zIndex:20,overflow:'visible',transform:'none'}}>
              <CardContent className="p-5" style={{overflow:'visible'}}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1" style={{color:'#2d5a88',display:'flex',alignItems:'center',gap:'6px'}}>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#2d5a88" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="1.5" y="5.5" width="12" height="8" rx="0.5"/><polyline points="1.5,5.5 7.5,1.5 13.5,5.5"/><rect x="5.5" y="10" width="4" height="3.5"/></svg>
                      Buscar minha escola
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">Digite o nome ou o código INEP (8 dígitos) para ver o painel completo</p>
                    {/* Wrapper com ref para fechar dropdown ao clicar fora */}
                    <div ref={searchContainerRef} className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <input
                            className="w-full pl-9 pr-3 h-10 rounded-xl text-sm border border-border/50 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Nome da escola ou código INEP (8 dígitos)"
                            value={searchQuery}
                            autoComplete="off"
                            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                            onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { handleSearch(); setShowDropdown(false); }
                              if (e.key === 'Escape') { setShowDropdown(false); setSearchQuery(""); }
                            }}
                          />
                        </div>
                        <button
                          onClick={() => { handleSearch(); setShowDropdown(false); }}
                          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold text-white shrink-0"
                          style={{background:'#2d5a88'}}
                        >
                          Buscar <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* DROPDOWN AUTOCOMPLETE */}
                      {showDropdown && searchQuery.length >= 2 && (
                        <div
                          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-2xl overflow-hidden"
                          style={{
                            background: '#fff',
                            border: '1.5px solid #c8dff7',
                            boxShadow: '0 8px 32px 0 rgba(45,90,136,0.13), 0 2px 8px 0 rgba(0,0,0,0.07)',
                          }}
                        >
                          {/* Loading */}
                          {searchLoading && (
                            <div className="flex items-center gap-2.5 px-4 py-3.5 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              <span>Buscando escolas...</span>
                            </div>
                          )}

                          {/* Resultados */}
                          {!searchLoading && searchResults?.dados && searchResults.dados.length > 0 && (
                            <>
                              <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{color:'#2d5a88',opacity:0.7}}>
                                  {searchResults.dados.length} escola(s) encontrada(s)
                                </span>
                                <button
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => { setSearchQuery(""); setShowDropdown(false); }}
                                  className="p-1 rounded-full hover:bg-blue-50 text-muted-foreground"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="max-h-72 overflow-y-auto divide-y divide-blue-50">
                                {searchResults.dados.map((result: any, idx: number) => (
                                  <button
                                    key={result.co_entidade}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => { selectSchool(String(result.co_entidade), result.no_entidade); setShowDropdown(false); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors group"
                                    style={{background: idx % 2 === 0 ? '#fff' : '#f7faff'}}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#eef4ff')}
                                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f7faff')}
                                  >
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:'#e8f0fb'}}>
                                      <School className="w-3.5 h-3.5" style={{color:'#2d5a88'}} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-foreground truncate">{result.no_entidade}</p>
                                      <p className="text-[11px] text-muted-foreground truncate">
                                        {result.no_municipio}/{result.sg_uf} · {result.ds_dependencia}
                                        {result.qt_matriculas > 0 && ` · ${result.qt_matriculas.toLocaleString('pt-BR')} alunos`}
                                      </p>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-300 shrink-0 group-hover:text-blue-500 transition-colors" />
                                  </button>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Sem resultados */}
                          {!searchLoading && searchResults?.dados && searchResults.dados.length === 0 && (
                            <div className="px-4 py-5 text-center text-sm text-muted-foreground">
                              <Search className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                              Nenhuma escola encontrada para "<strong>{searchQuery}</strong>"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* RESUMO EXECUTIVO */}
            {!selectedInep && stats && (
              <section className="section">
                <div className="summary-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
                  <div className="metric theme-blue">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Escolas ativas</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{formatNumber(totalEscolasAtivas)}</strong>
                  </div>
                  <div className="metric theme-yellow">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Matrículas</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{formatNumber(stats.total_matriculas)}</strong>
                  </div>
                  <div className="metric theme-green">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Professores</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{formatNumber(stats.total_docentes)}</strong>
                  </div>
                  <div className="metric theme-purple">
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>Estados</label>
                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{Object.keys(stats.por_uf || {}).length}</strong>
                  </div>
                </div>
              </section>
            )}

            {/* BILHETE DA DIRETORA */}
            {!selectedInep && stats && (
              <section className="section postit-row" style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: '32px',
                width: '100%',
              }}>
                {/* Post-it Bilhete da Diretora */}
                <div
                  className="postit-card postit-card-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #fffbe7 80%, #ffe066 100%)',
                    border: '2.5px solid #ffe066',
                    borderRadius: '22px',
                    boxShadow: '0 4px 18px 0 #ffe06655, 0 1.5px 0 #ffe066 inset',
                    flex: '1 1 0',
                    minWidth: 260,
                    maxWidth: 560,
                    padding: '24px 28px 22px 28px',
                    position: 'relative',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{marginBottom:'10px',textAlign:'center'}}>
                    <span className="scribble" style={{fontSize:'15px',color:'#b59f3b',background:'#fffbe7',padding:'2px 10px',borderRadius:'10px'}}>Bilhete da Diretora</span>
                  </div>
                  <div style={{fontSize:'15px',color:'#4f4126',lineHeight:1.6,textAlign:'center'}}>
                    <strong style={{fontSize:'17px',color:'#4f4126'}}>Diretora, este painel utiliza os dados do Censo Escolar {selectedAno}, realizado pelo INEP/MEC.</strong>
                    <p style={{margin:'8px 0 0',fontSize:'14px',color:'#3d4d5a'}}>
                      É o principal levantamento sobre a educação básica no Brasil. Os números apresentados aqui representam o retrato mais atualizado da educação brasileira e podem ser usados como referência para comparar a realidade da sua escola com o município, o estado e o Brasil.
                    </p>
                  </div>
                  {/* desenho removido */}
                </div>
                {/* Post-it Situação das Escolas */}
                <div
                  className="postit-card postit-card-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #e0f7fa 80%, #b2ebf2 100%)',
                    border: '2.5px solid #4dd0e1',
                    borderRadius: '22px',
                    boxShadow: '0 4px 18px 0 #4dd0e155, 0 1.5px 0 #b2ebf2 inset',
                    flex: '1 1 0',
                    minWidth: 260,
                    maxWidth: 560,
                    padding: '24px 28px 22px 28px',
                    position: 'relative',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{marginBottom:'10px',textAlign:'center'}}>
                    <span className="scribble" style={{fontSize:'15px',color:'#00838f',background:'#e0f7fa',padding:'2px 10px',borderRadius:'10px'}}>Situação das Escolas</span>
                  </div>
                  <div style={{fontSize:'15px',color:'#006064',lineHeight:1.6,textAlign:'center'}}>
                    <p style={{margin:'0',fontSize:'14px',color:'#006064'}}>
                      Nem todas as escolas são iguais. Muitas escolas rurais possuem poucos alunos, enquanto escolas urbanas costumam ter mais matrículas. Por isso, ao comparar escolas, é importante observar também o tamanho da escola, a localização (urbana ou rural) e a rede de ensino. Os dados apresentados aqui ajudam a entender o contexto educacional e não devem ser usados isoladamente para avaliar a qualidade de uma escola.
                    </p>
                  </div>
                  {/* desenho removido */}
                </div>
              </section>
            )}
            {!selectedInep && statsLoading ? (
              <div className="py-20 text-center">
                <p className="text-muted-foreground" style={{ fontSize: 15 }}>Carregando dados nacionais...</p>
              </div>
            ) : !selectedInep && stats ? (
              <>
                {/* ...existing code... */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  <div className="lg:col-span-2 space-y-4">
                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="w-4 h-4 text-accent" />
                          Mapa Interativo do Brasil
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BrazilMap
                          ufStats={ufChartData.reduce((acc, item, idx) => {
                            acc[item.uf] = {
                              name: item.name,
                              escolas: item.escolas,
                              color: STATE_FIXED_COLORS[item.uf] ?? PASTEL_COLORS[idx % PASTEL_COLORS.length]
                            };
                            return acc;
                          }, {} as Record<string, { name: string; escolas: number; color: string }>)}
                          selectedUf={evolucaoData?.escola?.sg_uf ?? null}
                          clickedUf={similarMode ? null : clickedUf}
                          similarMode={similarMode}
                          similarUfCounts={similarMode ? (similarData?.por_uf ?? {}) : undefined}
                          onStateHover={prefetchUfData}
                          onStateClick={(uf) => {
                            if (similarMode) {
                              setSimilarClickedUf(prev => prev === uf ? null : uf);
                            } else {
                              setClickedUf(prev => prev === uf ? null : uf);
                              startTransition(() => {
                                setFilterUf(uf);
                                setFilterDep("");
                                setListPage(1);
                              });
                            }
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Modal flutuante removido daqui — renderizado no nível da página abaixo */}

                  </div>

                  <div className="space-y-4">
                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-accent" />
                          Por Rede
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={depChartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                              outerRadius={60} innerRadius={30} paddingAngle={2}>
                              {depChartData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatNumber(v)} contentStyle={{ borderRadius: "12px" }} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="card-clay">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TreePine className="w-4 h-4 text-accent" />
                          Localização
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {locChartData.map((item, i) => {
                            const pct = stats.total_escolas > 0 ? ((item.value / stats.total_escolas) * 100).toFixed(1) : "0";
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">{formatNumber(item.value)} ({pct}%)</span>
                                </div>
                                <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* card de similares movido para ficha da escola */}
                  </div>
                </div>

                {/* Card: Situação das Escolas */}
                <Card className="card-clay">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-accent" />
                      Situação das Escolas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {sitChartData.map((item, i) => {
                        const pct = stats.total_escolas > 0 ? ((item.value / stats.total_escolas) * 100).toFixed(1) : "0";
                        const colors = ["text-green-700 bg-green-50 border-green-200", "text-amber-700 bg-amber-50 border-amber-200", "text-red-700 bg-red-50 border-red-200"];
                        return (
                          <div key={i} className={`p-4 rounded-xl border ${colors[i] || colors[0]}`}>
                            <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs mt-1 opacity-70">{pct}% do total</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Cards: O que mudou de 2024 para 2025 */}
                {censoInsightsNacional?.campos?.length > 0 && (() => {
                  const campos = censoInsightsNacional.campos as any[];
                  const camposByKey = Object.fromEntries(campos.map((c: any) => [c.key, c]));
                  const todos = campos.filter(c => c.diff_pp !== 0 && c.pct_2025 > 0);
                  const aumentou = todos.filter(c => c.diff_pp > 0).sort((a, b) => b.diff_pp - a.diff_pp).slice(0, 5);
                  const diminuiu = todos.filter(c => c.diff_pp < 0).sort((a, b) => a.diff_pp - b.diff_pp).slice(0, 5);
                  const essenciais = [
                    "in_agua_potavel",
                    "in_agua_rede_publica",
                    "in_esgoto_rede_publica",
                    "in_energia_rede_publica",
                    "in_banheiro",
                    "in_banheiro_pne",
                    "in_internet",
                    "in_laboratorio_informatica",
                    "in_cozinha",
                    "in_refeitorio",
                  ]
                    .map((k) => camposByKey[k])
                    .filter(Boolean)
                    .map((c: any) => ({
                      ...c,
                      faltante_pct: Math.max(0, 100 - Number(c.pct_2025 || 0)),
                      faltante_n: Math.max(0, Number(c.escolas_2025 || 0) - Number(c.total_2025 || 0)),
                    }))
                    .filter((c: any) => c.faltante_pct >= 5)
                    .sort((a: any, b: any) => b.faltante_pct - a.faltante_pct)
                    .slice(0, 5);
                  if (!aumentou.length && !diminuiu.length) return null;

                  const MiniCard = ({ cam }: { cam: any }) => {
                    const ganhou = cam.diff_pp > 0;
                    const abs = Math.abs(cam.diff_pp);
                    const deltaN = Math.round(cam.total_2025 - cam.total_2024);
                    return (
                      <div style={{
                        background: ganhou ? "#f0fdf4" : "#fff5f5",
                        borderRadius: 10,
                        padding: "10px 11px",
                        border: `1px solid ${ganhou ? "#bbf7d0" : "#fecaca"}`,
                        display: "flex", flexDirection: "column", gap: 4,
                        flex: "1 1 0", minWidth: 0,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {cam.label}
                        </span>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: ganhou ? "#16a34a" : "#dc2626", display: "block", lineHeight: 1 }}>
                            {ganhou ? "▲" : "▼"} {abs.toFixed(1)}<span style={{ fontSize: 10, fontWeight: 600 }}>p.p.</span>
                          </span>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {cam.pct_2024}% → <strong style={{ color: "#334155" }}>{cam.pct_2025}%</strong>
                          </span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ganhou ? "#15803d" : "#b91c1c" }}>
                          {ganhou ? "+" : ""}{deltaN.toLocaleString("pt-BR")} escolas
                        </span>
                      </div>
                    );
                  };

                  const EssentialCard = ({ cam }: { cam: any }) => {
                    return (
                      <div style={{
                        background: "#eff6ff",
                        borderRadius: 10,
                        padding: "10px 11px",
                        border: "1px solid #bfdbfe",
                        display: "flex", flexDirection: "column", gap: 4,
                        flex: "1 1 0", minWidth: 0,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {cam.label}
                        </span>
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: "#1d4ed8", display: "block", lineHeight: 1 }}>
                            ▼ {Number(cam.faltante_pct).toFixed(1)}<span style={{ fontSize: 10, fontWeight: 600 }}>%</span>
                          </span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#1e40af" }}>
                          {Number(cam.faltante_n || 0).toLocaleString("pt-BR")} escolas
                        </span>
                      </div>
                    );
                  };

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aumentou.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,11 5,7 8.5,9 14,3"/><polyline points="10,3 14,3 14,7"/></svg>
                            O que aumentou — 2024 → 2025
                          </div>
                          <div style={{ display: "flex", gap: 7 }}>
                            {aumentou.map((cam: any) => <MiniCard key={cam.key} cam={cam} />)}
                          </div>
                          {essenciais.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#1e40af" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 1.5a3 3 0 0 1 1 4.8L4 13.5a1 1 0 0 1-1.4-1.4L10 4.5a3 3 0 0 1 .5-3z"/><circle cx="10.5" cy="4.5" r="1"/></svg>
                                Observações — serviços essenciais que ainda faltam (2025)
                              </div>
                              <div style={{ display: "flex", gap: 7 }}>
                                {essenciais.map((cam: any) => <EssentialCard key={cam.key} cam={cam} />)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {diminuiu.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#b91c1c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 5,8 8.5,6 14,12"/><polyline points="10,12 14,12 14,8"/></svg>
                            O que diminuiu — 2024 → 2025
                          </div>
                          <div style={{ display: "flex", gap: 7 }}>
                            {diminuiu.map((cam: any) => <MiniCard key={cam.key} cam={cam} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}


              </>
            ) : null}


            {false && (
              <>
                <Card className="card-clay">
                  <CardContent className="p-4">
                    {/* Barra de busca */}
                    <div className="flex flex-col md:flex-row gap-3 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Busque por nome ou código INEP (8 dígitos)..."
                          className="pl-10 bg-background border-border/50 h-11 rounded-xl"
                          value={searchQuery}
                          autoFocus
                          onChange={(e) => { setSearchQuery(e.target.value); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (searchQuery.length === 8 && /^\d+$/.test(searchQuery)) {
                                selectSchool(searchQuery);
                              } else {
                                refetchSearch();
                              }
                            }
                          }}
                        />
                      </div>
                      <Button
                        className="h-11 rounded-xl"
                        disabled={searchLoading}
                        onClick={() => {
                          if (searchQuery.length === 8 && /^\d+$/.test(searchQuery)) {
                            selectSchool(searchQuery);
                          } else {
                            refetchSearch();
                          }
                        }}
                      >
                        {searchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                        Buscar
                      </Button>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={filterUf}
                        onChange={(e) => { setFilterUf(e.target.value); setListPage(1); }}
                        className="text-sm bg-background border border-border/50 rounded-lg px-2 py-1.5"
                      >
                        <option value="">Todos os estados</option>
                        {Object.entries(UF_NAMES).sort(([a], [b]) => a.localeCompare(b)).map(([uf, name]) => (
                          <option key={uf} value={uf}>{uf} - {name}</option>
                        ))}
                      </select>
                      <select
                        value={filterDep}
                        onChange={(e) => { setFilterDep(e.target.value); setListPage(1); }}
                        className="text-sm bg-background border border-border/50 rounded-lg px-2 py-1.5"
                      >
                        <option value="">Todas as redes</option>
                        <option value="1">Federal</option>
                        <option value="2">Estadual</option>
                        <option value="3">Municipal</option>
                        <option value="4">Privada</option>
                      </select>
                      {(filterUf || filterDep) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setFilterUf(""); setFilterDep(""); setListPage(1); }}
                          className="text-xs text-muted-foreground"
                        >
                          <X className="w-3 h-3 mr-1" /> Limpar filtros
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Resultados da busca — lista fixa abaixo da barra */}
                {searchLoading && (
                  <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando escolas...
                  </div>
                )}
                {!searchLoading && searchResults && searchResults.dados && searchResults.dados.length > 0 && (
                  <Card className="card-clay">
                    <CardContent className="p-0">
                      <div className="px-4 py-2.5 border-b border-border/20 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {searchResults.dados.length} escola(s) encontrada(s)
                        </span>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="divide-y divide-border/20 max-h-96 overflow-y-auto">
                        {searchResults.dados.map((result: any) => (
                          <button
                            key={result.co_entidade}
                            className="w-full text-left px-4 py-3.5 hover:bg-accent/5 transition-colors flex justify-between items-center group"
                            onClick={() => {
                              selectSchool(String(result.co_entidade));
                              setSearchQuery(result.no_entidade);
                            }}
                          >
                            <div>
                              <p className="font-semibold text-sm group-hover:text-accent transition-colors">{result.no_entidade}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                INEP {result.co_entidade} · {result.no_municipio}/{result.sg_uf} · {result.ds_dependencia}
                                {result.qt_matriculas > 0 && ` · ${result.qt_matriculas.toLocaleString('pt-BR')} alunos`}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2 group-hover:text-accent transition-colors" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!searchLoading && searchQuery.length >= 2 && searchResults && searchResults.dados && searchResults.dados.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhuma escola encontrada para "<strong>{searchQuery}</strong>"
                  </div>
                )}
              </>
            )}

            {selectedInep && (
              <>
            {evolucaoLoading ? (
              <Card className="card-clay">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
                  <p className="text-muted-foreground">Carregando dados da escola...</p>
                </CardContent>
              </Card>
            ) : evolucaoData && censoLatest ? (
              (() => {
                const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                const criticals = alertasPreocupantes.filter(a => a.tipo === 'critical');
                const warnings = alertasPreocupantes.filter(a => a.tipo === 'warning');
                const total = alertasPreocupantes.length;
                const extractVal = (titulo: string) => { const m = titulo.match(/:\s*([\d,\.]+\s*%?)(\s*(?:alunos\/turma|h\/dia|h))?$/); return m ? m[1] + (m[2] || '') : null; };
                const cleanTitle = (titulo: string) => titulo.replace(/:\s*[\d,\.]+\s*(?:%|alunos\/turma|h\/dia|h)?\s*$/, '').replace(/:\s*Nível\s*\d+\s*$/, '');
                const ch = evolutionCharts;
                const anosVisiveis = (evolucaoData.anos_disponiveis as number[]).filter((a: number) => a >= 2020).sort((a, b) => a - b);
                // Detectar etapas que a escola efetivamente oferta
                const _cens = censoLatest as any;
                const oferta = {
                  inf:    (_cens?.qt_mat_inf  ?? 0) > 0 || anosVisiveis.some((a: number) => (evolucaoData.censo_por_ano[a]?.qt_mat_inf  ?? 0) > 0),
                  fund:   (_cens?.qt_mat_fund ?? 0) > 0 || anosVisiveis.some((a: number) => (evolucaoData.censo_por_ano[a]?.qt_mat_fund ?? 0) > 0),
                  med:    (_cens?.qt_mat_med  ?? 0) > 0 || anosVisiveis.some((a: number) => (evolucaoData.censo_por_ano[a]?.qt_mat_med  ?? 0) > 0),
                  eja:    (_cens?.qt_mat_eja  ?? 0) > 0 || anosVisiveis.some((a: number) => (evolucaoData.censo_por_ano[a]?.qt_mat_eja  ?? 0) > 0),
                  fundAI: !!(ch?.ideb?.some((d: any) => d.ideb_ai != null) || ch?.taxasRendimento?.some((d: any) => d.aprovacao_ai != null) || ch?.saeb?.some((d: any) => d.mt_ai != null)),
                  fundAF: !!(ch?.ideb?.some((d: any) => d.ideb_af != null) || ch?.taxasRendimento?.some((d: any) => d.aprovacao_af != null) || ch?.saeb?.some((d: any) => d.mt_af != null)),
                };
                if (oferta.fund && !oferta.fundAI && !oferta.fundAF) { oferta.fundAI = true; oferta.fundAF = true; }
                const available = [
                  { id: 'matriculas', label: 'Matrículas', icon: <Users size={14} />, etapas: true, data: anosVisiveis.map((a: number) => { const c = evolucaoData.censo_por_ano[a]; return { ano: String(a), 'Total': c?.qt_mat_bas || null, 'E. Infantil': c?.qt_mat_inf || null, 'Fundamental': c?.qt_mat_fund || null, 'Médio': c?.qt_mat_med || null, 'EJA': c?.qt_mat_eja || null }; }), lines: [{ key: 'Total', color: '#2d5a88', name: 'Total', etapa: 'total' }, ...(oferta.inf ? [{ key: 'E. Infantil', color: '#7c5cbf', name: 'E. Infantil', etapa: 'inf' }] : []), ...(oferta.fund ? [{ key: 'Fundamental', color: '#2f7a58', name: 'Fundamental', etapa: 'fund' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio', etapa: 'med' }] : []), ...(oferta.eja ? [{ key: 'EJA', color: '#b74f42', name: 'EJA', etapa: 'eja' }] : [])], desc: 'Total de alunos matriculados por etapa de ensino.' },
                  { id: 'docentes', label: 'Docentes', icon: <User size={14} />, etapas: true, data: anosVisiveis.map((a: number) => { const c = evolucaoData.censo_por_ano[a]; return { ano: String(a), 'Total': c?.qt_doc_bas || c?.qt_docentes || null, 'E. Infantil': c?.qt_doc_inf || null, 'Fundamental': c?.qt_doc_fund || null, 'Médio': c?.qt_doc_med || null, 'EJA': c?.qt_doc_eja || null }; }), lines: [{ key: 'Total', color: '#9b6a16', name: 'Total', etapa: 'total' }, ...(oferta.inf ? [{ key: 'E. Infantil', color: '#7c5cbf', name: 'E. Infantil', etapa: 'inf' }] : []), ...(oferta.fund ? [{ key: 'Fundamental', color: '#2f7a58', name: 'Fundamental', etapa: 'fund' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#c47a1f', name: 'Médio', etapa: 'med' }] : []), ...(oferta.eja ? [{ key: 'EJA', color: '#b74f42', name: 'EJA', etapa: 'eja' }] : [])], desc: 'Número de docentes atuando por etapa de ensino.' },
                  { id: 'turmas', label: 'Turmas', icon: <School size={14} />, etapas: true, data: anosVisiveis.map((a: number) => { const c = evolucaoData.censo_por_ano[a]; return { ano: String(a), 'Total': c?.qt_tur_bas || c?.qt_turmas || null, 'E. Infantil': c?.qt_tur_inf || null, 'Fundamental': c?.qt_tur_fund || null, 'Médio': c?.qt_tur_med || null, 'EJA': c?.qt_tur_eja || null }; }), lines: [{ key: 'Total', color: '#2f7a58', name: 'Total', etapa: 'total' }, ...(oferta.inf ? [{ key: 'E. Infantil', color: '#7c5cbf', name: 'E. Infantil', etapa: 'inf' }] : []), ...(oferta.fund ? [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental', etapa: 'fund' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio', etapa: 'med' }] : []), ...(oferta.eja ? [{ key: 'EJA', color: '#b74f42', name: 'EJA', etapa: 'eja' }] : [])], desc: 'Total de turmas por etapa de ensino.' },
                  ...(ch?.ideb && ch.ideb.length > 0 ? [{ id: 'ideb', label: 'IDEB', icon: <Award size={14} />, cadencia: 'Bienal', referenceLines: [{ y: 6, label: 'Meta 6,0', color: '#c0392b' }], data: ch.ideb.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'AI': d.ideb_ai, 'AF': d.ideb_af, 'Médio': d.ideb_em })), lines: [...(oferta.fundAI ? [{ key: 'AI', color: '#2d5a88', name: 'Anos Iniciais' }] : []), ...(oferta.fundAF ? [{ key: 'AF', color: '#9b6a16', name: 'Anos Finais' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#2f7a58', name: 'Ensino Médio' }] : [])], desc: 'IDEB por etapa de ensino (escala 0–10). A linha tracejada indica a meta nacional de 6,0.' }] : []),
                  ...(ch?.taxasRendimento ? [{ id: 'rendimento', label: 'Rendimento', icon: <TrendingUp size={14} />, data: ch.taxasRendimento.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Aprovação': d.aprovacao, 'Reprovação': d.reprovacao, 'Abandono': d.abandono })), lines: [{ key: 'Aprovação', color: '#2f7a58', name: 'Aprovação' },{ key: 'Reprovação', color: '#b74f42', name: 'Reprovação' },{ key: 'Abandono', color: '#c47a1f', name: 'Abandono' }], desc: 'Taxas de aprovação, reprovação e abandono escolar (%).' }] : []),
                  ...(ch?.tdi ? [{ id: 'tdi', label: 'Dist. Idade', icon: <CalendarDays size={14} />, data: ch.tdi.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund_total, 'Médio': d.medio })), lines: [...(oferta.fund ? [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio' }] : [])], desc: 'TDI — % de alunos com 2 ou mais anos de defasagem idade-série.' }] : []),
                  ...(ch?.atu ? [{ id: 'atu', label: 'Alunos/Turma', icon: <Hash size={14} />, data: ch.atu.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.medio, 'EJA Fund.': d.eja_fun, 'EJA Médio': d.eja_med })), lines: [...(oferta.fund ? [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio' }] : []), ...(oferta.eja ? [{ key: 'EJA Fund.', color: '#795548', name: 'EJA Fund.' }, { key: 'EJA Médio', color: '#4e342e', name: 'EJA Médio' }] : [])], desc: 'ATU — Média de alunos por turma.' }] : []),
                  ...(ch?.had ? [{ id: 'had', label: 'Horas/Dia', icon: <Clock size={14} />, data: ch.had.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.medio, 'EJA Fund.': d.eja_fun, 'EJA Médio': d.eja_med })), lines: [...(oferta.fund ? [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio' }] : []), ...(oferta.eja ? [{ key: 'EJA Fund.', color: '#795548', name: 'EJA Fund.' }, { key: 'EJA Médio', color: '#4e342e', name: 'EJA Médio' }] : [])], desc: 'HAD — Horas-aula diárias médias.' }] : []),
                  ...(ch?.dsu ? [{ id: 'dsu', label: 'Doc. c/ Superior', icon: <GraduationCap size={14} />, data: ch.dsu.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.medio })), lines: [...(oferta.fund ? [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio' }] : [])], desc: 'DSU — % de docentes com ensino superior completo.' }] : []),
                  ...(ch?.inse && ch.inse.length > 0 ? [{ id: 'inse', label: 'INSE', icon: <Building2 size={14} />, cadencia: 'Irregular', data: ch.inse.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'INSE': d.media })), lines: [{ key: 'INSE', color: '#7c5cbf', name: 'INSE Médio' }], desc: 'INSE — Índice Socioeconômico médio dos estudantes (escala I–VIII).' }] : []),
                  ...(ch?.saeb && ch.saeb.length > 0 ? [{ id: 'saeb', label: 'SAEB', icon: <BookMarked size={14} />, cadencia: 'Bienal', etapas: true, data: ch.saeb.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Mat.AI': d.mt_ai, 'Port.AI': d.lp_ai, 'Mat.AF': d.mt_af, 'Port.AF': d.lp_af, 'Mat.Med': d.mt_em, 'Port.Med': d.lp_em })), lines: [...(oferta.fundAI ? [{ key: 'Mat.AI', color: '#2d5a88', name: 'Matemática', etapa: 'ai', etapaLabel: 'Anos Iniciais' }, { key: 'Port.AI', color: '#9b6a16', name: 'Língua Port.', etapa: 'ai', etapaLabel: 'Anos Iniciais' }] : []), ...(oferta.fundAF ? [{ key: 'Mat.AF', color: '#2d5a88', name: 'Matemática', etapa: 'af', etapaLabel: 'Anos Finais' }, { key: 'Port.AF', color: '#9b6a16', name: 'Língua Port.', etapa: 'af', etapaLabel: 'Anos Finais' }] : []), ...(oferta.med ? [{ key: 'Mat.Med', color: '#2d5a88', name: 'Matemática', etapa: 'med', etapaLabel: 'Ens. Médio' }, { key: 'Port.Med', color: '#9b6a16', name: 'Língua Port.', etapa: 'med', etapaLabel: 'Ens. Médio' }] : [])], desc: 'SAEB — Proficiência em Matemática e Língua Portuguesa por etapa (escala SAEB).' }] : []),
                  ...(ch?.icg ? [{ id: 'icg', label: 'Complexidade', icon: <Settings size={14} />, data: ch.icg.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'ICG': d.nivel })), lines: [{ key: 'ICG', color: '#c47a1f', name: 'Nível ICG' }], desc: 'ICG — Complexidade de Gestão (1–6). Maior = mais complexo.' }] : []),
                  ...(ch?.ird ? [{ id: 'ird', label: 'Regularidade Doc.', icon: <RefreshCw size={14} />, data: ch.ird.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'IRD': d.media })), lines: [{ key: 'IRD', color: '#2f7a58', name: 'IRD Médio' }], desc: 'IRD — Regularidade Docente (1–5). Maior = mais estável.' }] : []),
                  ...(ch?.tnr && ch.tnr.some((d:any) => d.fund != null || d.med != null) ? [{ id: 'tnr', label: 'Não Resposta', icon: <AlertTriangle size={14} />, data: ch.tnr.slice().sort((a:any,b:any)=>a.ano-b.ano).map((d:any)=>({ ano: String(d.ano), 'Fundamental': d.fund, 'Médio': d.med })), lines: [...(oferta.fund ? [{ key: 'Fundamental', color: '#2d5a88', name: 'Fundamental' }] : []), ...(oferta.med ? [{ key: 'Médio', color: '#9b6a16', name: 'Médio' }] : [])], desc: 'TNR — % de alunos que não participaram da avaliação Prova Brasil/SAEB. Afeta o IDEB.' }] : []),
                ].filter(c => c.data.some((d: Record<string, any>) => Object.values(d).slice(1).some((v: any) => v != null && Number(v) > 0)) && (c as any).lines.length > 0);
                const currentChart = available.find(c => c.id === selectedChart) || available[0];
                return (
              <>
                {/* ── STICKY HEADER — aparece ao rolar ── */}
                {scrolled && selectedInep && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                    background: 'rgba(251,247,238,0.97)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #e0d4b8',
                    padding: '8px 20px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 2px 16px rgba(90,80,50,0.10)',
                    animation: 'fadeSlideDown 0.2s ease',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#3d2b1a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evolucaoData.escola.no_entidade}
                    </div>
                    <span style={{ fontSize: 12, color: '#8a7a6a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <MapPin size={11} style={{display:'inline',verticalAlign:'middle'}} /> {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}
                    </span>
                    <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600, flexShrink: 0 }}>INEP {selectedInep}</span>
                  </div>
                )}

                {/* ── CABEÇALHO APENAS PARA IMPRESSÃO ── */}
                <div className="print-only-header">
                  <div className="print-brand">
                    <span className="print-brand-logo">Chegou a Conta,</span>
                    <span className="print-brand-highlight"> Diretora!</span>
                  </div>
                  <div className="print-school-name">{evolucaoData.escola.no_entidade}</div>
                  <div className="print-meta-row">
                    <span><MapPin size={11} style={{display:'inline',verticalAlign:'middle'}} /> {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}</span>
                    <span>INEP {selectedInep}</span>
                    <span>{evolucaoData.escola.ds_dependencia}</span>
                    <span>{evolucaoData.escola.ds_localizacao}</span>
                    <span>{evolucaoData.escola.ds_situacao}</span>
                  </div>
                  <div className="print-divider" />
                </div>

                {/* ── HERO ── */}
                <section className="hero">
                  <div className="hero-inner">
                    <div style={{minWidth:0}}>
                      <div className="eyebrow">
                        <span className="scribble">Ficha Completa</span>
                      </div>
                      <h1 style={{margin:'12px 0 8px',fontSize:'clamp(20px,3vw,34px)',lineHeight:'1.1',letterSpacing:'-0.04em',wordBreak:'break-word',overflowWrap:'break-word'}}>
                        {evolucaoData.escola.no_entidade}
                      </h1>
                      <p style={{margin:0,color:'var(--m-muted)',fontSize:'14px',lineHeight:'1.6'}}>
                        Aqui você encontra dados públicos da sua escola e o histórico desde 2020, permitindo acompanhar a evolução das matrículas, docentes, infraestrutura, indicadores educacionais e recursos financeiros.
                      </p>
                      <div className="school-meta">
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><MapPin className="w-3.5 h-3.5" style={{flexShrink:0}} /> {evolucaoData.escola.no_municipio}/{evolucaoData.escola.sg_uf}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><Hash className="w-3.5 h-3.5" style={{flexShrink:0}} /> INEP {selectedInep}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><Building2 className="w-3.5 h-3.5" style={{flexShrink:0}} /> {evolucaoData.escola.ds_dependencia}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}>{evolucaoData.escola.ds_localizacao === 'Rural' ? <TreePine className="w-3.5 h-3.5" style={{flexShrink:0}} /> : <Globe className="w-3.5 h-3.5" style={{flexShrink:0}} />} {evolucaoData.escola.ds_localizacao}</div>
                        <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><CheckCircle className="w-3.5 h-3.5" style={{flexShrink:0}} /> {evolucaoData.escola.ds_situacao}</div>
                        {evolucaoData.anos_disponiveis.length > 0 && (
                          <div className="meta-chip" style={{display:'inline-flex',alignItems:'center',gap:5}}><CalendarDays className="w-3.5 h-3.5" style={{flexShrink:0}} /> {Math.min(...evolucaoData.anos_disponiveis)}–{Math.max(...evolucaoData.anos_disponiveis)}</div>
                        )}
                      </div>

                      {/* Botão de escolas similares — sempre visível na ficha */}
                      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { setSimilarMode(true); setSimilarClickedUf(null); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "10px 20px", background: "#0d9488", color: "#fff",
                            border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14,
                            cursor: "pointer", boxShadow: "0 2px 8px rgba(13,148,136,0.3)",
                            transition: "all .2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#0f766e")}
                          onMouseLeave={e => (e.currentTarget.style.background = "#0d9488")}
                        >
                          <Search size={12} style={{display:'inline',verticalAlign:'middle'}} /> Ver escolas com perfil similar
                        </button>
                        <button
                          onClick={() => window.print()}
                          title="Imprimir / Salvar PDF"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", background: "transparent", color: "#b8a899",
                            border: "1px solid #e0d5c0", borderRadius: 10, fontWeight: 500, fontSize: 12,
                            cursor: "pointer", transition: "all .2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#5d4037"; e.currentTarget.style.borderColor = '#c4b49e'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#b8a899"; e.currentTarget.style.borderColor = '#e0d5c0'; }}
                        >
                          <Printer size={12} style={{display:'inline',verticalAlign:'middle'}} /> imprimir
                        </button>
                      </div>
                    </div>
                  </div>
                </section>


                {/* ── PAINÉIS DE CONTEXTO: EQUIPAMENTOS PÚBLICOS + SUPORTE INSTITUCIONAL ── */}
                {(() => {
                  const coMunicipio = censoLatest?.co_municipio || evolucaoData?.escola?.co_municipio;
                  const nomeMunicipio = evolucaoData?.escola?.no_municipio || '';
                  const sgUf = evolucaoData?.escola?.sg_uf || '';

                  const classifyOsmElement = (tags: Record<string, string>): string | null => {
                    const name = (tags.name || '').toLowerCase();
                    const amenity = (tags.amenity || '').toLowerCase();
                    const healthcare = (tags.healthcare || '').toLowerCase();
                    if (/conselho\s+tutelar/.test(name)) return 'conselho_tutelar';
                    if (/\bcras\b/.test(name)) return 'cras';
                    if (/\bcreas\b/.test(name)) return 'creas';
                    if (/centro\s+pop/.test(name)) return 'centro_pop';
                    if (/pronto\s+socorro|pronto-socorro|upa\b/.test(name)) return 'pronto_socorro';
                    if (amenity === 'hospital' || healthcare === 'hospital') return 'hospital';
                    if (/\bubs\b|unidade\s+b[áa]sica|centro\s+de\s+sa[úu]de|posto\s+de\s+sa[úu]de|psf\b|usf\b|esf\b|unidade\s+de\s+sa[úu]de/.test(name)) return 'ubs';
                    if (amenity === 'clinic' || amenity === 'health_centre' || healthcare === 'clinic' || healthcare === 'centre') return 'ubs';
                    if (amenity === 'doctors' || healthcare === 'doctor') return 'ubs';
                    return null;
                  };

                  const classifyCnes = (est: any): string | null => {
                    const tp = (est.descricao_tipo_unidade || '').toLowerCase();
                    const nm = ((est.nome_fantasia || est.nome_razao_social) || '').toLowerCase();
                    const full = nm + ' ' + tp;
                    if (/pronto[- ]socorro|upa\b|upas\b|urgência|urgencia|upa -/.test(full)) return 'pronto_socorro';
                    if (/hospital\b/.test(full)) return 'hospital';
                    if (/cras\b|centro de referência da assist|centro de refer.ncia da assist/.test(full)) return 'cras';
                    if (/creas\b|centro de referência especializ|centro de refer.ncia especializ/.test(full)) return 'creas';
                    if (/centro pop\b|pop de rua/.test(full)) return 'centro_pop';
                    if (/conselho tutelar/.test(full)) return 'conselho_tutelar';
                    if (/abrigo|casa lar|albergue/.test(full)) return 'abrigos';
                    if (/posto de sa[uú]de|unidade b[áa]sica|centro de sa[uú]de|unidade de sa[uú]de|policl[íi]nica|usf\b|psf\b|esf\b|ubsf?\b|ubds\b|unidade mista/.test(full)) return 'ubs';
                    if (/sa[uú]de da fam[íi]lia|saúde da família|estratégia/.test(full)) return 'ubs';
                    return null;
                  };

                  const fetchOsmData = (coMun: string) => {
                    if (!coMun || osmUnidades !== null || osmLoading) return;
                    setOsmLoading(true);

                    const coMunSeis = String(coMun).length === 7 ? String(coMun).slice(0, 6) : String(coMun);

                    const cats: Record<string, any[]> = {
                      conselho_tutelar: [], cras: [], creas: [], centro_pop: [],
                      ubs: [], hospital: [], pronto_socorro: [], abrigos: [],
                    };

                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 32000);

                    // ── 1. CNES (Ministério da Saúde) — endereços oficiais ──
                    const cnesPromise = fetch(
                      `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio=${coMunSeis}&limit=300`,
                      { signal: ctrl.signal }
                    )
                      .then(r => r.ok ? r.json() : null)
                      .then((data: any) => {
                        if (!data?.estabelecimentos) return;
                        for (const est of data.estabelecimentos) {
                          const cat = classifyCnes(est);
                          if (cat && cats[cat]) {
                            const lat = est.latitude ? parseFloat(est.latitude) : null;
                            const lon = est.longitude ? parseFloat(est.longitude) : null;
                            const logr = [est.logradouro, est.numero].filter(Boolean).join(', ');
                            const endStr = [logr, est.bairro, est.municipio, est.cep ? `CEP ${est.cep}` : ''].filter(Boolean).join(' — ');
                            cats[cat].push({
                              source: 'cnes',
                              nome: est.nome_fantasia || est.nome_razao_social || null,
                              endereco: endStr || null,
                              telefone: est.telefone || null,
                              lat, lon,
                              mapsUrl: (lat && lon) ? `https://www.google.com/maps?q=${lat},${lon}` : null,
                            });
                          }
                        }
                      })
                      .catch(() => {});

                    // ── 2. Overpass/OSM — complementa com equipamentos sociais ──
                    const overpassQuery = `[out:json][timeout:25];
(
  rel["ref:IBGE"="${coMun}"]["boundary"="administrative"];
)->.r;
map_to_area(.r)->.mun;
(
  node(area.mun)[amenity~"^(clinic|hospital|doctors|health_centre|social_facility)$"];
  node(area.mun)[healthcare~"^(hospital|clinic|centre|doctor)$"];
  node(area.mun)[social_facility~"^(shelter|emergency|outreach)$"];
  node(area.mun)[office="government"][name~"conselho tutelar|CRAS|CREAS|centro pop",i];
  node(area.mun)[name~"conselho tutelar|CRAS|CREAS|centro pop|pronto socorro|UBS|UPA|posto de saude|centro de saude|unidade de saude|unidade basica|PSF|USF|ESF|abrigo|casa lar|albergue",i];
  way(area.mun)[amenity~"^(clinic|hospital|social_facility)$"];
  way(area.mun)[healthcare~"^(hospital|clinic|centre)$"];
  way(area.mun)[name~"conselho tutelar|CRAS|CREAS|pronto socorro|UBS|UPA|posto de saude|PSF|abrigo",i];
);
out center tags 100;`;
                    const overpassPromise = fetch('https://overpass-api.de/api/interpreter', {
                      method: 'POST',
                      body: new URLSearchParams({ data: overpassQuery }),
                      signal: ctrl.signal,
                    })
                      .then(r => r.json())
                      .then((json: any) => {
                        const elements: any[] = json.elements || [];
                        const seen = new Set<number>();
                        for (const el of elements) {
                          if (seen.has(el.id)) continue;
                          seen.add(el.id);
                          const cat = classifyOsmElement(el.tags || {});
                          if (cat && cats[cat]) {
                            const t = el.tags || {};
                            const lat = el.lat ?? el.center?.lat ?? null;
                            const lon = el.lon ?? el.center?.lon ?? null;
                            const street = t['addr:street'] || t['addr:place'] || '';
                            const num = t['addr:housenumber'] || '';
                            const bairro = t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:district'] || '';
                            const cep = t['addr:postcode'] || '';
                            const city = t['addr:city'] || '';
                            const streetPart = [street, num].filter(Boolean).join(', ');
                            const endStr = [streetPart, bairro, city, cep].filter(Boolean).join(' — ');
                            cats[cat].push({
                              source: 'osm',
                              nome: t.name || t['name:pt'] || null,
                              endereco: endStr || null,
                              telefone: t.phone || t['contact:phone'] || t['contact:mobile'] || null,
                              horario: t.opening_hours || null,
                              website: t.website || t['contact:website'] || null,
                              lat, lon,
                              mapsUrl: (lat && lon) ? `https://www.google.com/maps?q=${lat},${lon}` : null,
                            });
                          }
                        }
                      })
                      .catch(() => {});

                    Promise.allSettled([cnesPromise, overpassPromise]).then(() => {
                      clearTimeout(timer);
                      // dedup: remove OSM duplicates se CNES já cobriu a categoria com nome similar
                      for (const cat of Object.keys(cats)) {
                        const cnesNames = new Set(
                          cats[cat].filter((u: any) => u.source === 'cnes').map((u: any) => (u.nome || '').toLowerCase().slice(0, 20))
                        );
                        cats[cat] = cats[cat].filter((u: any) =>
                          u.source === 'cnes' || !cnesNames.has((u.nome || '').toLowerCase().slice(0, 20))
                        );
                      }
                      setOsmUnidades({ ...cats });
                      setOsmLoading(false);
                    });

                  };

                  const handleToggleEquipamentos = () => {
                    const next = !showEquipamentos;
                    setShowEquipamentos(next);
                    if (next && coMunicipio) {
                      if (!equipamentosData && !equipamentosLoading) {
                        setEquipamentosLoading(true);
                        fetch(`/api/equipamentos-publicos/${coMunicipio}`)
                          .then(r => r.json())
                          .then(d => { setEquipamentosData(d); setEquipamentosLoading(false); })
                          .catch(() => { setEquipamentosData({ ok: false }); setEquipamentosLoading(false); });
                      }
                      if (coMunicipio) fetchOsmData(String(coMunicipio));
                      // Busca equipamentos sociais via Mapa Social MDS
                      if (coMunicipio && !mapaSocialData && !mapaSocialLoading) {
                        setMapaSocialLoading(true);
                        fetch(`/api/mapa-social/${coMunicipio}`)
                          .then(r => r.json())
                          .then(d => { setMapaSocialData(d); setMapaSocialLoading(false); })
                          .catch(() => { setMapaSocialData({ ok: false, equipamentos: [], grouped: {} }); setMapaSocialLoading(false); });
                      }
                      // Busca CRAS/CREAS via cadunicobrasil.com.br
                      if (nomeMunicipio && sgUf && !crasData && !crasLoading) {
                        setCrasLoading(true);
                        Promise.all([
                          fetch(`/api/busca-cras?municipio=${encodeURIComponent(nomeMunicipio)}&uf=${sgUf}&tipo=cras`).then(r => r.json()).catch(() => ({ ok: false, units: [] })),
                          fetch(`/api/busca-cras?municipio=${encodeURIComponent(nomeMunicipio)}&uf=${sgUf}&tipo=creas`).then(r => r.json()).catch(() => ({ ok: false, units: [] })),
                        ]).then(([crasd, creasd]) => {
                          setCrasData({ cras: crasd.units || [], creas: creasd.units || [], ok: crasd.ok || creasd.ok });
                          setCrasLoading(false);
                        });
                      }
                    }
                  };

                  const CAT_META: Record<string, { icon: React.ReactNode; label: string; bg: string; border: string; txt: string; dot: string }> = {
                    conselho_tutelar: { icon: <Scale size={14} />,      label: 'Conselho Tutelar',    bg: '#fff3e0', border: '#ffd180', txt: '#7a3f00', dot: '#ff8f00' },
                    cras:             { icon: <Building2 size={14} />,  label: 'CRAS',                bg: '#e8f5ee', border: '#b8dfc8', txt: '#1f6b45', dot: '#2f7a58' },
                    creas:            { icon: <Shield size={14} />,     label: 'CREAS',               bg: '#e6eef8', border: '#b8cfe8', txt: '#1e4a78', dot: '#2d5a88' },
                    centro_pop:       { icon: <TreePine size={14} />,   label: 'Centro POP',          bg: '#fdf3e0', border: '#f0ddb5', txt: '#7a4a10', dot: '#d4870a' },
                    ubs:              { icon: <Cross size={14} />,      label: 'UBS / Posto de Saúde', bg: '#e3f2fd', border: '#90caf9', txt: '#0d47a1', dot: '#1565c0' },
                    hospital:         { icon: <Building size={14} />,   label: 'Hospital',             bg: '#fce4ec', border: '#f48fb1', txt: '#880e4f', dot: '#c2185b' },
                    pronto_socorro:   { icon: <AlertTriangle size={14} />, label: 'Pronto Socorro / UPA', bg: '#ffebee', border: '#ef9a9a', txt: '#b71c1c', dot: '#d32f2f' },
                    abrigos:          { icon: <Home size={14} />,       label: 'Abrigos / Casa Lar',   bg: '#f3eeff', border: '#d4c4f5', txt: '#5b3fa8', dot: '#7c4dff' },
                  };

                  // Mapa Social tipo → visual meta
                  const MS_META: Record<string, { icon: React.ReactNode; label: string; bg: string; border: string; txt: string; dot: string }> = {
                    CRAS:                   { icon: <Building2 size={14} />,   label: 'CRAS',                                bg: '#e8f5ee', border: '#b8dfc8', txt: '#1f6b45', dot: '#2f7a58' },
                    CREAS:                  { icon: <Shield size={14} />,      label: 'CREAS',                               bg: '#e6eef8', border: '#b8cfe8', txt: '#1e4a78', dot: '#2d5a88' },
                    CAPS:                   { icon: <Droplets size={14} />,    label: 'CAPS',                                bg: '#fff8e1', border: '#ffe082', txt: '#5f4200', dot: '#f9a825' },
                    CONSELHO_TUTELAR:       { icon: <Scale size={14} />,       label: 'Conselho Tutelar',                    bg: '#fff3e0', border: '#ffd180', txt: '#7a3f00', dot: '#ff8f00' },
                    CONSELHO_ASSISTENCIA:   { icon: <Landmark size={14} />,    label: 'Conselho Municipal de Assist. Social', bg: '#f0f4ff', border: '#b8c8f0', txt: '#1a3060', dot: '#2a4a90' },
                    ACOLHIMENTO:            { icon: <Home size={14} />,        label: 'Serviço de Acolhimento',               bg: '#f3eeff', border: '#d4c4f5', txt: '#5b3fa8', dot: '#7c4dff' },
                    CONVIVENCIA:            { icon: <Handshake size={14} />,   label: 'Centro de Convivência',                bg: '#fdf6ff', border: '#e8c8f0', txt: '#6a2080', dot: '#9c27b0' },
                    CENTRO_POP:             { icon: <TreePine size={14} />,    label: 'Centro POP',                          bg: '#fdf3e0', border: '#f0ddb5', txt: '#7a4a10', dot: '#d4870a' },
                    CENTRO_DIA:             { icon: <Sun size={14} />,         label: 'Centro-Dia',                           bg: '#fffde7', border: '#fff176', txt: '#5d4037', dot: '#f9a825' },
                    CMDCA:                  { icon: <User size={14} />,        label: 'CMDCA',                                bg: '#fce4ec', border: '#f48fb1', txt: '#880e4f', dot: '#c2185b' },
                    REPUBLICA:              { icon: <Home size={14} />,        label: 'República',                            bg: '#f1f8e9', border: '#c5e1a5', txt: '#33691e', dot: '#558b2f' },
                    REDE_PARCERIA:          { icon: <Link2 size={14} />,       label: 'Rede de Parceria',                     bg: '#e8eaf6', border: '#9fa8da', txt: '#283593', dot: '#3949ab' },
                  };

                  const UnitCard = ({ u, cat, meta }: { u: any; cat: string; meta?: any }) => {
                    const m = meta || CAT_META[cat] || CAT_META.ubs;
                    const lat = u.lat || u.latitude;
                    const lon = u.lon || u.longitude;
                    const mapsUrl = u.mapsUrl || (lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : null);
                    const mapsSearchUrl = u.nome ? `https://www.google.com/maps/search/${encodeURIComponent(u.nome + (u.municipio ? ' ' + u.municipio : ''))}` : null;
                    return (
                      <div style={{ background: '#fff', border: `1.5px solid ${m.border}`, borderRadius: 12, padding: '12px 14px', borderLeft: `4px solid ${m.dot}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                          <p style={{ fontWeight: 700, fontSize: 12, color: m.txt, margin: 0, lineHeight: 1.3 }}>{u.nome || m.label}</p>
                          {(mapsUrl || mapsSearchUrl) && (
                            <a href={mapsUrl || mapsSearchUrl!} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: '#1a73e8', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#1a73e8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              Maps
                            </a>
                          )}
                        </div>
                        {u.endereco ? (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <MapPin size={11} style={{ flexShrink: 0 }} />
                            <span>
                              {u.endereco}
                              {u.endereco_verificado && (
                                <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, color: '#2f7a58', background: '#d2f0e0', borderRadius: 8, padding: '1px 5px', verticalAlign: 'middle' }}>✓ mapa</span>
                              )}
                            </span>
                          </p>
                        ) : (
                          <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px', fontStyle: 'italic' }}>
                            Endereço não disponível no mapa colaborativo
                          </p>
                        )}
                        {u.telefone && (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} />
                            <a href={`tel:${u.telefone.replace(/\D/g,'')}`} style={{ color: m.txt, textDecoration: 'none', fontWeight: 600 }}>{u.telefone}</a>
                          </p>
                        )}
                        {u.website && (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Globe size={11} />
                            <a href={u.website} target="_blank" rel="noopener noreferrer" style={{ color: m.txt, textDecoration: 'underline' }}>Site oficial</a>
                          </p>
                        )}
                        {u.email && (
                          <p style={{ fontSize: 11, color: '#555', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} />
                            <a href={`mailto:${u.email}`} style={{ color: m.txt, textDecoration: 'none', fontWeight: 600 }}>{u.email}</a>
                          </p>
                        )}
                        {u.horario && (
                          <p style={{ fontSize: 10, color: '#888', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} /> {u.horario}
                          </p>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '10px', alignItems: 'start' }}>
                      {/* Botão 1: Equipamentos Públicos */}
                      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #b8dfc8', background: '#f4fbf7' }}>
                        <button
                          onClick={handleToggleEquipamentos}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#d2f0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Landmark size={18} /></div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#1f6b45', margin: 0 }}>Equipamentos Públicos do Município</p>
                            <p style={{ fontSize: '11px', color: '#4a8a65', margin: 0 }}>CRAS, CREAS, UBS, Pronto Socorro, Conselho Tutelar — {nomeMunicipio || '—'}</p>
                          </div>
                          <span style={{ fontSize: '16px', color: '#4a8a65', transform: showEquipamentos ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                        </button>

                        {showEquipamentos && (
                          <div style={{ padding: '0 18px 16px', borderTop: '1px solid #d2f0e0' }}>
                            {equipamentosLoading && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: '#4a8a65', fontSize: 13 }}>
                                <Loader2 className="w-4 h-4 animate-spin" /> Consultando IBGE e mapa de equipamentos...
                              </div>
                            )}

                            {!equipamentosLoading && equipamentosData && (() => {
                              const totalOsm = osmUnidades ? Object.values(osmUnidades).reduce((s: number, arr: any) => s + arr.length, 0) : 0;
                              return (
                                <>

                                  {/* Mapa Social MDS — equipamentos sociais */}
                                  {mapaSocialLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: '#1f6b45', fontSize: 12 }}>
                                      <Loader2 className="w-3 h-3 animate-spin" /> Consultando Mapa Social (MDS)...
                                    </div>
                                  )}
                                  {!mapaSocialLoading && mapaSocialData?.ok && mapaSocialData.equipamentos?.length > 0 && (() => {
                                    const ORDER = ['CRAS','CREAS','CAPS','CONSELHO_TUTELAR','CONSELHO_ASSISTENCIA','CENTRO_POP','ACOLHIMENTO','CONVIVENCIA','CENTRO_DIA','CMDCA','REPUBLICA','REDE_PARCERIA'];
                                    const grupos = ORDER.filter(t => (mapaSocialData.grouped?.[t]?.length ?? 0) > 0);
                                    return (
                                      <div style={{ marginTop: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1f6b45', margin: 0 }}>
                                            Rede Socioassistencial — Mapa Social MDS
                                          </p>
                                          <span style={{ fontSize: 9, color: '#6b8a74', background: '#d2f0e0', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                                            {mapaSocialData.total} equipamentos
                                          </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
                                          {grupos.map(tipo => {
                                            const items: any[] = mapaSocialData.grouped[tipo] || [];
                                            const meta = MS_META[tipo] || MS_META.CRAS;
                                            return (
                                              <div key={tipo} style={{ marginBottom: 0 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: meta.txt, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                                  {meta.icon} {meta.label} <span style={{ opacity: 0.7 }}>({items.length})</span>
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                                  {items.map((u: any, i: number) => <UnitCard key={i} u={u} cat="" meta={meta} />)}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Unidades individuais (OSM) */}
                                  {osmLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: '#4a8a65', fontSize: 12 }}>
                                      <Loader2 className="w-3 h-3 animate-spin" /> Localizando unidades com endereço...
                                    </div>
                                  )}
                                  {!osmLoading && osmUnidades && totalOsm > 0 && (
                                    <div style={{ marginTop: 6 }}>
                                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a8a65', marginBottom: 8 }}>Unidades localizadas — CNES / Mapa colaborativo</p>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
                                        {Object.entries(CAT_META).map(([cat, meta]) => {
                                          const items: any[] = osmUnidades[cat] || [];
                                          if (items.length === 0) return null;
                                          return (
                                            <div key={cat} style={{ marginBottom: 0 }}>
                                              <p style={{ fontSize: 11, fontWeight: 700, color: meta.txt, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                                {meta.icon} {meta.label} <span style={{ opacity: 0.7 }}>({items.length})</span>
                                              </p>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                                {items.map((u: any, i: number) => <UnitCard key={i} u={u} cat={cat} />)}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Seção cadunicobrasil.com.br — CRAS e CREAS com endereço e telefone */}
                                  {crasLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: '#4a8a65', fontSize: 12 }}>
                                      <Loader2 className="w-3 h-3 animate-spin" /> Consultando relação de CRAS e CREAS...
                                    </div>
                                  )}
                                  {!crasLoading && crasData && ((crasData.cras?.length > 0 || crasData.creas?.length > 0)) && (() => {
                                    const cadu_cras: any[] = (crasData.cras || []).map((u: any) => ({ ...u, source: 'cadunico', mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(u.nome + ' ' + u.endereco + ' ' + nomeMunicipio)}` }));
                                    const cadu_creas: any[] = (crasData.creas || []).map((u: any) => ({ ...u, source: 'cadunico', mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(u.nome + ' ' + u.endereco + ' ' + nomeMunicipio)}` }));
                                    return (
                                      <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a8a65', marginBottom: 8 }}>
                                          Unidades da Assistência Social — CadUnico Brasil
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
                                          {cadu_cras.length > 0 && (
                                            <div style={{ marginBottom: 0 }}>
                                              <p style={{ fontSize: 11, fontWeight: 700, color: CAT_META.cras.txt, background: CAT_META.cras.bg, border: `1px solid ${CAT_META.cras.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                                {CAT_META.cras.icon} {CAT_META.cras.label} <span style={{ opacity: 0.7 }}>({cadu_cras.length})</span>
                                              </p>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                                {cadu_cras.map((u: any, i: number) => <UnitCard key={i} u={u} cat="cras" />)}
                                              </div>
                                            </div>
                                          )}
                                          {cadu_creas.length > 0 && (
                                            <div style={{ marginBottom: 0 }}>
                                              <p style={{ fontSize: 11, fontWeight: 700, color: CAT_META.creas.txt, background: CAT_META.creas.bg, border: `1px solid ${CAT_META.creas.border}`, borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', marginBottom: 6 }}>
                                                {CAT_META.creas.icon} {CAT_META.creas.label} <span style={{ opacity: 0.7 }}>({cadu_creas.length})</span>
                                              </p>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                                {cadu_creas.map((u: any, i: number) => <UnitCard key={i} u={u} cat="creas" />)}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  <p style={{ fontSize: '10px', color: '#6b8a74', marginTop: 10, marginBottom: 6 }}>
                                    {mapaSocialData?.ok && mapaSocialData.total > 0 && <span>Rede socioassistencial: Mapa Social MDS. </span>}
                                    {equipamentosData.ibge_fonte && <span>Contagens históricas: {equipamentosData.ibge_fonte}. </span>}
                                    {osmUnidades && totalOsm > 0 && <span>Saúde: CNES/Min. Saúde e OpenStreetMap. </span>}
                                    {crasData && (crasData.cras?.length > 0 || crasData.creas?.length > 0) && <span>CRAS/CREAS: CadUnico Brasil. </span>}
                                    Dados podem estar desatualizados.
                                  </p>
                                </>
                              );
                            })()}

                            {!equipamentosLoading && !coMunicipio && (
                              <p style={{ fontSize: 12, color: '#888', padding: '12px 0' }}>Código IBGE do município não disponível para esta escola.</p>
                            )}

                          </div>
                        )}
                      </div>

                      {/* Botão 2: Suporte Institucional */}
                      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #d4c4f5', background: '#f9f6ff' }}>
                        <button
                          onClick={() => setShowSuporteInstitucional(v => !v)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#e8deff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Handshake size={18} /></div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#5b3fa8', margin: 0 }}>Suporte Institucional para Gestão</p>
                            <p style={{ fontSize: '11px', color: '#7c5cbf', margin: 0 }}>Programas, recursos e canais de apoio à diretora escolar</p>
                          </div>
                          <span style={{ fontSize: '16px', color: '#7c5cbf', transform: showSuporteInstitucional ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                        </button>

                        {showSuporteInstitucional && (() => {
                          const escolaUF = (evolucaoData?.escola?.sg_uf || pddeData?.uf || pddeData?.uex?.uf || null) as string | null;
                          const escolaDep = evolucaoData?.escola?.ds_dependencia as string | undefined;
                          const secretarioEstadual = escolaUF ? SECRETARIOS_ESTADUAIS[escolaUF] : null;
                          const undimeUF = escolaUF ? UNDIME_UF[escolaUF] : null;
                          const cecampeRegiao = escolaUF ? UF_CECAMPE[escolaUF] : null;
                          const cecampesDaEscola = cecampeRegiao ? CECAMPES.filter(c => c.regiao === cecampeRegiao) : CECAMPES;
                          return (
                          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e8deff' }}>
                            {/* Abas */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                              {([
                                { id: 'contatos', label: 'Contatos' },
                                { id: 'cecampe', label: 'CECAMPE' },
                                { id: 'conselhos', label: 'Conselhos' },
                                { id: 'sistemas', label: 'Sistemas' },
                              ] as const).map(t => (
                                <button key={t.id} onClick={() => setSuporteTab(t.id)}
                                  style={{ padding: '6px 14px', borderRadius: 20, border: suporteTab === t.id ? '1.5px solid #7c5cbf' : '1.5px solid #d4c4f5', background: suporteTab === t.id ? '#7c5cbf' : '#f9f6ff', color: suporteTab === t.id ? '#fff' : '#5b3fa8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                  {t.label}
                                </button>
                              ))}
                            </div>

                            {/* Aba: Contatos */}
                            {suporteTab === 'contatos' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>

                                {/* Secretário Estadual da escola */}
                                {secretarioEstadual && (
                                  <div style={{ borderRadius: 12, border: '1.5px solid #c8d8f5', background: '#eaf0fb', padding: '12px 14px' }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1e4a78', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}><School size={11} /> Secretaria Estadual de Educação — {secretarioEstadual.estado}</p>
                                    <div style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 10, padding: '10px 12px', border: '1px solid #b8cfe8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <p style={{ fontSize: 10, fontWeight: 700, color: '#1e4a78', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secretário(a) de Educação</p>
                                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0d2b50', margin: 0 }}>{secretarioEstadual.nome}</p>
                                      <p style={{ fontSize: 11, color: '#1e4a78', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> <a href={`mailto:${secretarioEstadual.email}`} style={{ color: '#1e4a78' }}>{secretarioEstadual.email}</a></p>
                                      <a href={secretarioEstadual.site} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 700, color: '#1e4a78', background: 'rgba(30,74,120,0.08)', padding: '3px 12px', borderRadius: 20, border: '1px solid #b8cfe8', textDecoration: 'none' }}>Site da Secretaria ↗</a>
                                    </div>
                                    <p style={{ fontSize: 10, color: '#6a8bb5', margin: '8px 0 0' }}>Fonte: CONSED — consed.org.br/secretarios</p>
                                  </div>
                                )}

                                {/* Secretaria Municipal via UNDIME */}
                                <div style={{ borderRadius: 12, border: escolaDep === 'Municipal' ? '2px solid #d4861a' : '1.5px solid #f0ddb5', background: escolaDep === 'Municipal' ? '#fff8ed' : '#fdf3e0', padding: '12px 14px' }}>
                                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7a4a10', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Landmark size={11} /> Secretaria Municipal de Educação
                                    {escolaDep === 'Municipal' && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#d4861a', color: '#fff', borderRadius: 8, padding: '1px 7px' }}>sua rede</span>}
                                  </p>
                                  {escolaDep === 'Municipal' ? (
                                    <p style={{ fontSize: 11, color: '#7a4a10', margin: '0 0 10px', lineHeight: 1.5 }}>
                                      Esta escola pertence à <strong>rede municipal</strong>. A Secretaria Municipal de Educação de <strong>{evolucaoData?.escola?.no_municipio}</strong> é sua supervisora direta. O contato nominal do(a) secretário(a) deve ser obtido junto à prefeitura ou à UNDIME de {escolaUF}.
                                    </p>
                                  ) : (
                                    <p style={{ fontSize: 11, color: '#7a4a10', margin: '0 0 10px', lineHeight: 1.5 }}>
                                      Para escolas municipais, a Secretaria Municipal é a supervisora direta. Para localizá-la no seu município, acesse a UNDIME do seu estado.
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {undimeUF && (
                                      <a href={undimeUF} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: 12, fontWeight: 700, color: '#7a4a10', background: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: 20, border: '1.5px solid #f0ddb5', textDecoration: 'none' }}>
                                        UNDIME {escolaUF} ↗
                                      </a>
                                    )}
                                    <a href="https://undime.org.br" target="_blank" rel="noopener noreferrer"
                                      style={{ fontSize: 12, fontWeight: 700, color: '#7a4a10', background: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: 20, border: '1.5px solid #f0ddb5', textDecoration: 'none' }}>
                                      UNDIME Nacional ↗
                                    </a>
                                  </div>
                                  <p style={{ fontSize: 10, color: '#a06020', margin: '8px 0 0' }}>
                                    A UNDIME não disponibiliza busca pública por município — cada seccional estadual mantém o cadastro dos dirigentes do seu estado.
                                  </p>
                                </div>

                                {/* MEC */}
                                <div style={{ borderRadius: 12, border: '1.5px solid #b8cfe8', background: '#e6eef8', padding: '12px 14px' }}>
                                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1e4a78', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 5 }}><Landmark size={11} /> Ministério da Educação (MEC) — Federal</p>
                                  <p style={{ fontSize: 11, color: '#1e4a78', margin: '0 0 10px', lineHeight: 1.5 }}>
                                    <strong>Ministro:</strong> Camilo Sobreira de Santana — <a href="mailto:gabinetedoministro@mec.gov.br" style={{ color: '#1e4a78' }}>gabinetedoministro@mec.gov.br</a> — <Phone size={11} style={{display:'inline',verticalAlign:'middle'}} /> (61) 2022-7828
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                                    {MEC_SECRETARIAS.map((s, i) => (
                                      <div key={i} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px', border: '1px solid #b8cfe8' }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#1e4a78', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.sigla}</p>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: '#0d2b50', margin: '0 0 4px', lineHeight: 1.3 }}>{s.nome}</p>
                                        {s.titular && <p style={{ fontSize: 11, color: '#1e4a78', margin: '0 0 2px', fontStyle: 'italic' }}>{s.titular}</p>}
                                        <p style={{ fontSize: 10, color: '#4a7aab', margin: '0 0 6px', lineHeight: 1.3 }}>{s.foco}</p>
                                        <p style={{ fontSize: 11, color: '#1e4a78', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {s.tel}</p>
                                        <p style={{ fontSize: 11, color: '#1e4a78', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> <a href={`mailto:${s.email}`} style={{ color: '#1e4a78' }}>{s.email}</a></p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* FNDE */}
                                <div style={{ borderRadius: 12, border: '1.5px solid #b8dfc8', background: '#e8f5ee', padding: '12px 14px' }}>
                                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1f6b45', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}><DollarSign size={11} /> FNDE — Fundo Nacional de Desenvolvimento da Educação</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                                    {[
                                      { cargo: 'Presidente do FNDE', nome: 'Fernanda Mara de Oliveira M C Pacobahyba', tel: '(61) 2022-4806 / 4599', email: 'presidencia@fnde.gov.br' },
                                      { cargo: 'DIGAP — Responsável pelo PDDE', nome: 'Diretoria de Articulação e Projetos Educacionais', tel: '(61) 2022-5908 / 4903', email: 'assessoriadigap@fnde.gov.br' },
                                      { cargo: 'Atendimento FNDE (gratuito)', nome: 'Balcão FNDE / Fala Brasil opção FNDE', tel: '0800-616161', email: 'atend.institucional@fnde.gov.br' },
                                    ].map((c, i) => (
                                      <div key={i} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px', border: '1px solid #b8dfc8' }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: '#1f6b45', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.cargo}</p>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0d3320', margin: '0 0 6px' }}>{c.nome}</p>
                                        <p style={{ fontSize: 11, color: '#1f6b45', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {c.tel}</p>
                                        <p style={{ fontSize: 11, color: '#1f6b45', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> <a href={`mailto:${c.email}`} style={{ color: '#1f6b45' }}>{c.email}</a></p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Aba: CECAMPE */}
                            {suporteTab === 'cecampe' && (
                              <div>
                                <p style={{ fontSize: 11, color: '#5b3fa8', margin: '0 0 12px', lineHeight: 1.5 }}>
                                  Os <strong>CECAMPEs</strong> são universidades federais parceiras do FNDE que oferecem assistência técnica gratuita, formações e monitoramento do PDDE.
                                  {cecampeRegiao && <> Exibindo o CECAMPE da <strong>Região {cecampeRegiao}</strong>, que atende esta escola.</>}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
                                  {cecampesDaEscola.map((c, i) => (
                                    <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${c.bd}`, background: c.bg, padding: '14px 16px' }}>
                                      <p style={{ fontSize: 10, fontWeight: 800, color: c.cor, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Região {c.regiao}</p>
                                      <p style={{ fontSize: 13, fontWeight: 700, color: c.cor, margin: '0 0 10px', lineHeight: 1.3 }}>{c.uni}</p>
                                      <p style={{ fontSize: 12, color: c.cor, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> <a href={`mailto:${c.email}`} style={{ color: c.cor, fontWeight: 600 }}>{c.email}</a></p>
                                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <a href={c.site} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: c.cor, background: 'rgba(255,255,255,0.7)', padding: '5px 14px', borderRadius: 20, border: `1px solid ${c.bd}`, textDecoration: 'none' }}>Site ↗</a>
                                        {c.painel && <a href={c.painel} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: c.cor, background: 'rgba(255,255,255,0.7)', padding: '5px 14px', borderRadius: 20, border: `1px solid ${c.bd}`, textDecoration: 'none' }}>Painel de Dados ↗</a>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p style={{ fontSize: 10, color: '#9b7fcf', margin: '10px 0 0', lineHeight: 1.4 }}>
                                  Fonte: FNDE — atualizado em abril/2025.
                                </p>
                              </div>
                            )}

                            {/* Aba: Conselhos de Educação */}
                            {suporteTab === 'conselhos' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>

                                {/* CNE */}
                                <div style={{ borderRadius: 12, border: '1.5px solid #b8cfe8', background: '#e6eef8', padding: '14px 16px' }}>
                                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1e4a78', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}><Landmark size={11} /> Conselho Nacional de Educação (CNE) — Federal</p>
                                  <p style={{ fontSize: 11, color: '#1e4a78', margin: '0 0 10px', lineHeight: 1.5 }}>Órgão colegiado do MEC com funções normativas e deliberativas. Responsável pelas Diretrizes Curriculares Nacionais (BNCC, DCNs) e políticas de qualidade do ensino.</p>
                                  <div style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 10, padding: '10px 12px', border: '1px solid #b8cfe8', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: '#1e4a78', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presidente</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0d2b50', margin: 0 }}>{CNE_INFO.presidente}</p>
                                    <p style={{ fontSize: 11, color: '#1e4a78', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {CNE_INFO.tel}</p>
                                    <p style={{ fontSize: 11, color: '#1e4a78', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> <a href={`mailto:${CNE_INFO.email}`} style={{ color: '#1e4a78' }}>{CNE_INFO.email}</a></p>
                                    <p style={{ fontSize: 11, color: '#1e4a78', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {CNE_INFO.endereco}</p>
                                  </div>
                                  <a href={CNE_INFO.site} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#1e4a78', background: 'rgba(255,255,255,0.7)', padding: '5px 14px', borderRadius: 20, border: '1px solid #b8cfe8', textDecoration: 'none', display: 'inline-block' }}>Portal do CNE ↗</a>
                                </div>

                                {/* CEE da escola */}
                                {escolaUF && CEE_ESTADUAIS[escolaUF] && (() => {
                                  const cee = CEE_ESTADUAIS[escolaUF]!;
                                  return (
                                    <div style={{ borderRadius: 12, border: '1.5px solid #d4c4f5', background: '#f3eeff', padding: '14px 16px' }}>
                                      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5b3fa8', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}><Landmark size={11} /> Conselho Estadual de Educação — {escolaUF}</p>
                                      <p style={{ fontSize: 11, color: '#5b3fa8', margin: '0 0 10px', lineHeight: 1.5 }}>Responsável pela normatização e supervisão do sistema estadual de ensino, incluindo autorização e credenciamento de escolas privadas e municipais.</p>
                                      <div style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 10, padding: '10px 12px', border: '1px solid #d4c4f5', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                        {cee.presidente && <>
                                          <p style={{ fontSize: 10, fontWeight: 700, color: '#5b3fa8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presidente</p>
                                          <p style={{ fontSize: 13, fontWeight: 700, color: '#3a2070', margin: 0 }}>{cee.presidente}</p>
                                        </>}
                                        {cee.tel && <p style={{ fontSize: 11, color: '#5b3fa8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {cee.tel}</p>}
                                        {cee.email && <p style={{ fontSize: 11, color: '#5b3fa8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> <a href={`mailto:${cee.email}`} style={{ color: '#5b3fa8' }}>{cee.email}</a></p>}
                                        {cee.endereco && <p style={{ fontSize: 11, color: '#5b3fa8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {cee.endereco}</p>}
                                      </div>
                                      <a href={cee.site} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#5b3fa8', background: 'rgba(255,255,255,0.7)', padding: '5px 14px', borderRadius: 20, border: '1px solid #d4c4f5', textDecoration: 'none', display: 'inline-block' }}>Site do CEE-{escolaUF} ↗</a>
                                    </div>
                                  );
                                })()}

                                {/* CME — nota */}
                                <div style={{ borderRadius: 12, border: '1.5px solid #b8dfc8', background: '#e8f5ee', padding: '14px 16px' }}>
                                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1f6b45', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={11} /> Conselho Municipal de Educação (CME)</p>
                                  <p style={{ fontSize: 11, color: '#1f6b45', margin: '0 0 10px', lineHeight: 1.5 }}>
                                    O CME é o órgão de controle social do sistema municipal de ensino. Cada município tem o seu — fiscaliza as políticas educacionais locais, delibera sobre normas e aprova o Plano Municipal de Educação (PME).
                                    Para localizar o CME do seu município, consulte a Secretaria Municipal de Educação ou a UNDIME do seu estado.
                                  </p>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {undimeUF && (
                                      <a href={undimeUF} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: 12, fontWeight: 700, color: '#1f6b45', background: 'rgba(255,255,255,0.7)', padding: '5px 14px', borderRadius: 20, border: '1px solid #b8dfc8', textDecoration: 'none' }}>
                                        UNDIME {escolaUF} ↗
                                      </a>
                                    )}
                                    <a href="https://www.uncme.org.br" target="_blank" rel="noopener noreferrer"
                                      style={{ fontSize: 12, fontWeight: 700, color: '#1f6b45', background: 'rgba(255,255,255,0.7)', padding: '5px 14px', borderRadius: 20, border: '1px solid #b8dfc8', textDecoration: 'none' }}>
                                      UNCME Nacional ↗
                                    </a>
                                  </div>
                                </div>

                                <p style={{ fontSize: 10, color: '#9b7fcf', margin: 0, lineHeight: 1.4 }}>
                                  Fonte: dados compilados de sites oficiais dos órgãos. Presidências sujeitas a alteração. Verifique nos sites oficiais.
                                </p>
                              </div>
                            )}

                            {/* Aba: Sistemas */}
                            {suporteTab === 'sistemas' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                                {([
                                  { icon: <BarChart3 size={18} />, titulo: 'Painel PDDE — FNDE', desc: 'Execução financeira do PDDE por escola — PowerBI oficial do FNDE', url: 'https://app.powerbi.com/view?r=eyJrIjoiMDU1ODMyMmEtNzMxNi00NGI1LWIwMTctMTc5OWEzYWMwMDY3IiwidCI6ImNmODQ1NGQzLWUwMTItNGE5ZC05NWIzLTcwYmRiNmY0NTlkNSJ9', cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
                                  { icon: <BookOpen size={18} />, titulo: 'PDDE Interativo', desc: 'Elaboração do PDE Escola e gestão financeira (MEC)', url: 'https://pddeinterativo.mec.gov.br', cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
                                  { icon: <FileText size={18} />, titulo: 'SIGPC — Prestação de Contas', desc: 'Consulta pública à prestação de contas do PDDE e programas FNDE', url: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/sigpc-acesso-publico', cor: '#1e4a78', bg: '#e6eef8', bd: '#b8cfe8' },
                                  { icon: <ClipboardList size={18} />, titulo: 'SIMEC / PAR', desc: 'Plano de Ações Articuladas — monitoramento e planejamento municipal', url: 'https://simec.mec.gov.br', cor: '#1e4a78', bg: '#e6eef8', bd: '#b8cfe8' },
                                  { icon: <Link2 size={18} />, titulo: 'Balcão FNDE', desc: 'Atendimento virtual do FNDE — dúvidas sobre programas e repasses', url: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/acoes/balcao-fnde-1', cor: '#1f6b45', bg: '#e8f5ee', bd: '#b8dfc8' },
                                ] as const).map((item, i) => (
                                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: item.bg, border: `1.5px solid ${item.bd}`, textDecoration: 'none' }}>
                                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingTop: 2 }}>{item.icon}</span>
                                    <div>
                                      <p style={{ fontSize: 12, fontWeight: 700, color: item.cor, margin: '0 0 2px' }}>{item.titulo} ↗</p>
                                      <p style={{ fontSize: 11, color: item.cor, opacity: 0.8, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* ── FICHA GERAL + CARDS COLORIDOS — lado a lado ── */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '22px' }}>

                  {/* FICHA GERAL */}
                  <section id="sec-ficha" className="section section-pauta" style={{ flex: '1 1 0', minWidth: '220px', marginTop: 0, scrollMarginTop: 70 }}>
                    <div className="section-title">
                      <div><h2>Ficha geral da escola</h2><p>Identidade e vida organizacional</p></div>
                    </div>
                    <div className="organic-divider" />
                    <div className="soft-card theme-blue" style={{ margin: 0 }}>
                      <div className="attention-head"><School size={16} /><strong>Identidade</strong></div>
                      <div className="row-list" style={{marginTop:'8px'}}>
                        {[
                          ['Situação', censoLatest.ds_situacao],
                          ['Dependência', censoLatest.ds_dependencia],
                          ['Localização', censoLatest.ds_localizacao],
                          ['Localização diferenciada', (() => {
                            const d = censoLatest.tp_localizacao_diferenciada;
                            if (d == null || d === 0) return null;
                            const dMap: Record<number,string> = { 1: 'Área indígena', 2: 'Quilombola', 3: 'Assentamento', 4: 'Área rural diferenciada', 5: 'Área de ilha', 6: 'Reserva extrativista' };
                            return dMap[d] ?? null;
                          })()],
                          ['Região', censoLatest.no_regiao],
                          ['Município', censoLatest.no_municipio],
                          ['UF', censoLatest.sg_uf],
                          ['Código IBGE', censoLatest.co_municipio],
                          ['Regulamentação', censoLatest.tp_regulamentacao === 1 ? 'Sim' : censoLatest.tp_regulamentacao === 2 ? 'Em tramitação' : censoLatest.tp_regulamentacao === 3 ? 'Não' : null],
                          ['Prédio escolar', censoLatest.in_local_func_predio_escolar === 1 ? 'Sim' : censoLatest.in_local_func_predio_escolar === 0 ? 'Não' : null],
                          ['Início do ano letivo', censoLatest.dt_ano_letivo_inicio ?? null],
                          ['Término do ano letivo', censoLatest.dt_ano_letivo_termino ?? null],
                        ].filter(([,v]) => v != null).map(([k, v], i) => (
                          <div key={i} className="row-item" style={{padding:'7px 14px'}}>
                            <span style={{color:'var(--m-muted)',fontSize:'12px'}}>{k}</span>
                            <strong style={{fontSize:'12px'}}>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* CARDS COLORIDOS — ao lado da ficha */}
                  {(() => {
                    const THEMES = ['theme-blue','theme-yellow','theme-green','theme-purple','theme-pink','theme-teal'];
                    const temComparacaoHistorica = !!censoBaseComparacao && !!baseAnoComparacao && baseAnoComparacao < latestAno;
                    const METRICS = [
                      { label: `Matrículas ${latestAno ?? ''}`, val: censoLatest.qt_mat_bas || 0, prev: temComparacaoHistorica ? (censoBaseComparacao?.qt_mat_bas || 0) : null, icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 3 2 8 12 13 22 8 12 3"/><polyline points="6.5 10.5 6.5 17 12 20 17.5 17 17.5 10.5"/><line x1="2" y1="8" x2="2" y2="14"/></svg>) },
                      { label: `Docentes ${latestAno}`, val: censoLatest.qt_doc_bas || censoLatest.qt_docentes || 0, prev: temComparacaoHistorica ? (censoBaseComparacao ? (censoBaseComparacao.qt_doc_bas || censoBaseComparacao.qt_docentes || 0) : 0) : null, icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="8" y1="17" x2="7" y2="20"/><line x1="16" y1="17" x2="17" y2="20"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="11" x2="13" y2="11"/></svg>) },
                      { label: `Turmas ${latestAno}`, val: censoLatest.qt_tur_bas || censoLatest.qt_turmas || 0, prev: temComparacaoHistorica ? (censoBaseComparacao ? (censoBaseComparacao.qt_tur_bas || censoBaseComparacao.qt_turmas || 0) : 0) : null, icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20c0-3.9 3.1-7 7-7h5c3.9 0 7 3.1 7 7"/></svg>) },
                      { label: 'Salas utilizadas', val: censoLatest.qt_salas_utilizadas || 0, prev: temComparacaoHistorica ? (censoBaseComparacao?.qt_salas_utilizadas || 0) : null, icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="15" cy="14" r="1"/></svg>) },
                      { label: 'Status PDDE', ...(() => {
                          if (!pddeData?.ok) return { val: '—', extra: 'Sem dados' };
                          const _dests: any[] = pddeData.destinacoes || [];
                          const _dadosCad = pddeData?.situacao_uex?.dados_cadastrais || '';
                          const _semUex = !pddeData.uex && _dests.length > 0 && _dests.every((d:any) => (d.pago_total ?? 0) === 0);
                          const _fimStr = cadastralData?.itens?.[0]?.data_fim_mandato || pddeData?.situacao_uex?.mandato_fim || null;
                          const _fimDate = _fimStr ? (() => { const [dd,mm,aa] = _fimStr.split('/'); return aa ? new Date(+aa,+mm-1,+dd) : null; })() : null;
                          const _mandatoVencido = cadastralData?.itens?.[0]?.mandato_dirigente === 'VENCIDO' || (_fimDate ? _fimDate < new Date() : false);
                          const _pendentes: any[] = pddeData?.situacao_uex?.programas_pendentes || [];
                          const _pcInadimpl = prestacaoContaData?.itens?.some((it:any) => it.situacao_pc_uex?.toLowerCase().includes('inadimp') || it.situacao_pc_eex?.toLowerCase().includes('inadimp'));
                          const _uexTodosZero = pddeData.uex && !_mandatoVencido && _pendentes.length === 0 && !_pcInadimpl && _dests.length > 0 && _dests.every((d:any) => (d.pago_total ?? 0) === 0);
                          const _algumBloqueado = pddeData.uex && !_mandatoVencido && _pendentes.length === 0 && !_pcInadimpl && !_uexTodosZero && _dests.some((d:any) => (d.pago_total ?? 0) === 0 && (d.devido_total ?? 0) > 0);
                          const _warnIcon = (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
                          const _okIcon = (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2f7a58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="7.5 12 10.5 15 16.5 9"/></svg>);
                          if (_semUex) return { val: _warnIcon, extra: /eex|entidade executora/i.test(_dadosCad) ? '⚠ Via EEX' : '⚠ Sem UEx' };
                          if (_mandatoVencido) return { val: _warnIcon, extra: '⚠ Sem dirigente' };
                          if (_pendentes.length > 0 || _pcInadimpl) return { val: _warnIcon, extra: '⚠ Inadimplente' };
                          if (_uexTodosZero) return { val: _warnIcon, extra: '⚠ Bloqueado' };
                          if (_algumBloqueado) return { val: _warnIcon, extra: '⚠ Repasse parcial' };
                          if (prestacaoContaData?.ok && prestacaoContaData.itens.every((it:any) => it.situacao_pc_uex?.toLowerCase().includes('adimpl'))) return { val: _okIcon, extra: `${prestacaoContaData.itens.length} programa(s)` };
                          return { val: 'Ver', extra: prestacaoContaData?.ok && prestacaoContaData.itens.length > 0 ? `${prestacaoContaData.itens.length} programa(s)` : 'Ativo' };
                        })(), prev: null, icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="12" cy="13.5" r="2.5"/></svg>) },
                    ];
                    return (
                      <div style={{ flex: '1 1 0', minWidth: '260px', marginTop: 0 }}>
                        <div className="section-title" style={{ marginBottom: 0 }}>
                          <div><h2>Painel da escola</h2><p>Números essenciais</p></div>
                        </div>
                        <div className="organic-divider" />
                        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                          {METRICS.map((m, i) => {
                            const delta = m.prev !== null && typeof m.val === 'number' ? (m.val as number) - (m.prev as number) : null;
                            const pctDelta = delta !== null && typeof m.prev === 'number' && m.prev > 0
                              ? (delta / m.prev) * 100
                              : null;
                            return (
                              <div key={i} className={`metric ${THEMES[i]}`}>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{color:'#6b7785'}}>{m.label}</label>
                                    <strong className="block text-3xl font-bold leading-none" style={{letterSpacing:'-0.04em'}}>{typeof m.val === 'number' ? m.val.toLocaleString('pt-BR') : m.val}</strong>
                                  </div>
                                  <div className="w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0" style={{background:'rgba(255,255,255,0.72)',border:'1px solid rgba(255,255,255,0.9)'}}>{m.icon}</div>
                                </div>
                                {(m as any).extra ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold bg-white/60 text-gray-600">{(m as any).extra}</span>
                                ) : delta !== null && delta !== 0 ? (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold ${delta > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {delta > 0 ? '▲' : '▼'}
                                    {pctDelta !== null ? ` ${Math.abs(pctDelta).toFixed(1).replace('.', ',')}% desde ${baseAnoComparacao}` : ` ${Math.abs(delta)} desde ${baseAnoComparacao}`}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                </div>{/* fim flex ficha+cards */}

                {/* ── INDICADORES + DIAGNÓSTICO — largura total ── */}
                <section className="section">
                  {(() => {
                    const obs = alertasPreocupantes;
                    return (
                      <>
                        {obs.length === 0 ? (
                          <div style={{padding:'14px 18px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, display:'flex', alignItems:'center', gap:12}}>
                            <CheckCircle size={20} style={{flexShrink:0, color:'#166534'}} />
                            <p style={{fontSize:13, color:'#166534', margin:0, lineHeight:1.5}}>Os indicadores desta escola estão dentro das faixas de referência.</p>
                          </div>
                        ) : (
                          <div style={{padding:'14px 18px', background:'#faf7f2', border:'1px solid #e8dfc8', borderRadius:12}}>
                            <div style={{fontSize:11, fontWeight:800, color:'#9a7a5a', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12}}>
                              <span style={{display:'flex',alignItems:'center',gap:5}}><ClipboardList size={11} /> Indicadores em observação</span>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:10}}>
                              {obs.map((alerta: any, i: number) => (
                                <div key={i} style={{display:'flex', gap:10, alignItems:'flex-start'}}>
                                  <span style={{fontSize:13, marginTop:1, flexShrink:0}}>◌</span>
                                  <div>
                                    <div style={{fontSize:12, fontWeight:700, color:'#5d4037', marginBottom:2}}>{alerta.titulo.replace(/:\s*[\d,.]+$/, '').replace(/:\s*[\d,.]+\s*$/, '')}</div>
                                    <p style={{fontSize:12, color:'#8a7a6a', margin:0, lineHeight:1.5}}>{alerta.descricao}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {Object.keys(indicadoresLatest).length > 0 && (
                          <div style={{marginTop:24}}>
                            <div style={{fontSize:11,fontWeight:800,color:'#9a7a5a',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:14}}>
                              <span style={{display:'flex',alignItems:'center',gap:5}}><TrendingUp size={11} /> Evolução da escola — com referências nacionais</span>
                            </div>
                            <IndicatorPanel indicadores={indicadoresLatest} mediasNacionais={mediasNacionais} comparativo={comparativoData} microregiao={microregiaoData} historico={historicoIndicadores} />
                          </div>
                        )}

                        {diagnosticoData && (diagnosticoData.pontos_fortes.length > 0 || diagnosticoData.leituras.length > 0) && (
                          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'14px',marginTop:'16px'}}>
                            {diagnosticoData.pontos_fortes.length > 0 && (
                              <div className="soft-card" style={{padding:'16px 18px',borderLeft:'3px solid #2f7a58'}}>
                                <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'#2f7a58',display:'flex',alignItems:'center',gap:'6px'}}>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#2f7a58" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="7.5" r="6.2"/><polyline points="4.5,7.8 6.5,10 10.5,5"/></svg>
                                  Pontos fortes
                                </div>
                                <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'7px'}}>
                                  {diagnosticoData.pontos_fortes.map((p: string, i: number) => (
                                    <li key={i} style={{fontSize:'13px',lineHeight:1.4,color:'var(--m-text)'}}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {diagnosticoData.leituras.length > 0 && (
                              <div className="soft-card" style={{padding:'16px 18px',borderLeft:'3px solid #2d5a88'}}>
                                <div style={{fontWeight:700,fontSize:'13px',marginBottom:'10px',color:'#2d5a88',display:'flex',alignItems:'center',gap:'6px'}}>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#2d5a88" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="8.5" width="3" height="5" rx="0.5"/><rect x="6" y="5.5" width="3" height="8" rx="0.5"/><rect x="10.5" y="2.5" width="3" height="11" rx="0.5"/><line x1="0.5" y1="14" x2="14.5" y2="14"/></svg>
                                  Leituras dos dados
                                </div>
                                <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'7px'}}>
                                  {diagnosticoData.leituras.map((p: string, i: number) => (
                                    <li key={i} style={{fontSize:'13px',lineHeight:1.4,color:'var(--m-text)'}}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>

                {/* ── DESEMPENHO ESCOLAR: SAEB + RENDIMENTO ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const saebLatest = ch?.saeb?.slice().reverse().find((d: any) => d.mt_af != null || d.lp_af != null || d.mt_ai != null || d.mt_em != null);
                  const rendLatest = ch?.taxasRendimento?.slice().reverse().find((d: any) => d.aprovacao != null || d.aprovacao_ai != null || d.aprovacao_af != null || d.aprovacao_med != null);
                  const allRend = ch?.taxasRendimento?.filter((d: any) => d.aprovacao != null || d.aprovacao_ai != null || d.aprovacao_af != null || d.aprovacao_med != null).slice().sort((a: any, b: any) => a.ano - b.ano) || [];
                  const rendSegmentos = [
                    { key: 'ai', label: 'Anos Iniciais', sub: 'Fund. 1º–5º ano', aprov: 'aprovacao_ai', reprov: 'reprovacao_ai', aband: 'abandono_ai', color: '#2d6a4f' },
                    { key: 'af', label: 'Anos Finais', sub: 'Fund. 6º–9º ano', aprov: 'aprovacao_af', reprov: 'reprovacao_af', aband: 'abandono_af', color: '#1d3557' },
                    { key: 'med', label: 'Ensino Médio', sub: '1ª–3ª série', aprov: 'aprovacao_med', reprov: 'reprovacao_med', aband: 'abandono_med', color: '#6b2d6b' },
                  ].filter(s => rendLatest && rendLatest[s.aprov] != null);
                  if (!saebLatest && !rendLatest) return null;
                  const saebMetrics = [
                    { key: 'mt_ai', label: 'Matemática', sub: 'Anos Iniciais', color: '#2d5a88' },
                    { key: 'lp_ai', label: 'Língua Port.', sub: 'Anos Iniciais', color: '#9b6a16' },
                    { key: 'mt_af', label: 'Matemática', sub: 'Anos Finais', color: '#2d5a88' },
                    { key: 'lp_af', label: 'Língua Port.', sub: 'Anos Finais', color: '#9b6a16' },
                    { key: 'mt_em', label: 'Matemática', sub: 'Ens. Médio', color: '#2d5a88' },
                    { key: 'lp_em', label: 'Língua Port.', sub: 'Ens. Médio', color: '#9b6a16' },
                  ].filter(m => saebLatest && saebLatest[m.key] != null);
                  return (
                    <section id="sec-desempenho" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-desempenho') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div><h2>Desempenho escolar</h2><p>Notas do SAEB e taxas de aprovação, reprovação e abandono</p></div>
                      </div>
                      <div className="organic-divider" />
                      {saebLatest && saebMetrics.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={13} /> Notas SAEB <span style={{ fontWeight: 400, fontSize: 12, color: '#9e8a75' }}>— {saebLatest.ano}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                            {saebMetrics.map(m => (
                              <div key={m.key} className="soft-card" style={{ padding: '14px 16px', borderTop: `3px solid ${m.color}` }}>
                                <div style={{ fontSize: 11, color: '#9e8a75', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.3 }}>{m.label}</div>
                                <div style={{ fontSize: 10, color: '#b8a899', marginBottom: 6 }}>{m.sub}</div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: m.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                                  {saebLatest[m.key] != null ? Number(saebLatest[m.key]).toFixed(1) : '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {allRend.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10 }}>
                            <span style={{display:'flex',alignItems:'center',gap:5}}><BarChart3 size={13} /> Taxas de aprovação, reprovação e abandono (%)</span>
                          </div>

                          {/* ── Cartões de segmento clicáveis ── */}
                          {rendSegmentos.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                              {rendSegmentos.map(s => {
                                const isActive = rendSegmento === s.key;
                                const latestAprov = rendLatest?.[s.aprov];
                                return (
                                  <button
                                    key={s.key}
                                    onClick={() => setRendSegmento(isActive ? null : s.key as any)}
                                    style={{
                                      flex: '1 1 130px', minWidth: 120,
                                      padding: '12px 14px',
                                      border: `2px solid ${isActive ? s.color : '#e7d9bf'}`,
                                      borderRadius: '14px 16px 12px 15px',
                                      background: isActive ? s.color : '#fffef8',
                                      color: isActive ? '#fff' : '#3d4450',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      boxShadow: isActive ? `0 4px 14px ${s.color}44` : '0 2px 8px rgba(83,72,53,0.07)',
                                      transition: 'all .18s',
                                    }}
                                  >
                                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 0.85 : 0.6, marginBottom: 2 }}>{s.sub}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                                    {latestAprov != null && (
                                      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                                        {Number(latestAprov).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                                      </div>
                                    )}
                                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{isActive ? '▼ clique p/ fechar' : 'aprovação · clique'}</div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* ── Tabela: visão geral ou drill-down por segmento ── */}
                          {(() => {
                            const seg = rendSegmento ? rendSegmentos.find(s => s.key === rendSegmento) : null;
                            const rows = allRend.filter((d: any) => seg ? d[seg.aprov] != null : d.aprovacao != null);
                            if (rows.length === 0) return null;

                            // Grades por segmento (dados por série do Railway)
                            const gradesBySeg: Record<string, {label: string, aprov: string, reprov: string, aband: string}[]> = {
                              ai: [
                                { label: '1º ano', aprov: 'aprov_f01', reprov: 'reprov_f01', aband: 'aband_f01' },
                                { label: '2º ano', aprov: 'aprov_f02', reprov: 'reprov_f02', aband: 'aband_f02' },
                                { label: '3º ano', aprov: 'aprov_f03', reprov: 'reprov_f03', aband: 'aband_f03' },
                                { label: '4º ano', aprov: 'aprov_f04', reprov: 'reprov_f04', aband: 'aband_f04' },
                                { label: '5º ano', aprov: 'aprov_f05', reprov: 'reprov_f05', aband: 'aband_f05' },
                              ],
                              af: [
                                { label: '6º ano', aprov: 'aprov_f06', reprov: 'reprov_f06', aband: 'aband_f06' },
                                { label: '7º ano', aprov: 'aprov_f07', reprov: 'reprov_f07', aband: 'aband_f07' },
                                { label: '8º ano', aprov: 'aprov_f08', reprov: 'reprov_f08', aband: 'aband_f08' },
                                { label: '9º ano', aprov: 'aprov_f09', reprov: 'reprov_f09', aband: 'aband_f09' },
                              ],
                              med: [
                                { label: '1ª série', aprov: 'aprov_m01', reprov: 'reprov_m01', aband: 'aband_m01' },
                                { label: '2ª série', aprov: 'aprov_m02', reprov: 'reprov_m02', aband: 'aband_m02' },
                                { label: '3ª série', aprov: 'aprov_m03', reprov: 'reprov_m03', aband: 'aband_m03' },
                              ],
                            };
                            const grades = seg ? gradesBySeg[seg.key] : null;
                            const latestRow = rows[rows.length - 1];
                            const hasGrades = grades && latestRow && grades.some(g => latestRow[g.aprov] != null);

                            return (
                              <>
                                <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                  {seg && (
                                    <div style={{ padding: '9px 14px', background: seg.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11} /> {seg.label} — {seg.sub} — evolução por ano</span>
                                      <button onClick={() => setRendSegmento(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕ ver geral</button>
                                    </div>
                                  )}
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: '#f7f2ea' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#2f7a58', fontSize: 12 }}>✓ Aprovação</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>✗ Reprovação</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#c47a1f', fontSize: 12 }}>⚠ Abandono</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((d: any, i: number) => {
                                        const aprov = seg ? d[seg.aprov] : d.aprovacao;
                                        const reprov = seg ? d[seg.reprov] : d.reprovacao;
                                        const aband = seg ? d[seg.aband] : d.abandono;
                                        return (
                                          <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#2f7a58', fontWeight: 600 }}>{aprov != null ? `${Number(aprov).toFixed(1)}%` : '—'}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#b74f42', fontWeight: 600 }}>{reprov != null ? `${Number(reprov).toFixed(1)}%` : '—'}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#c47a1f', fontWeight: 600 }}>{aband != null ? `${Number(aband).toFixed(1)}%` : '—'}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* ── Por série (último ano disponível) ── */}
                                {hasGrades && seg && (
                                  <div style={{ marginTop: 12 }}>
                                    <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 8 }}>
                                      <span style={{display:'flex',alignItems:'center',gap:4}}><ClipboardList size={11} /> Por série — {latestRow.ano}</span>
                                    </div>
                                    <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                          <tr style={{ background: seg.color + '22' }}>
                                            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: seg.color, fontSize: 12 }}>Série</th>
                                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#2f7a58', fontSize: 12 }}>✓ Aprov.</th>
                                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>✗ Reprov.</th>
                                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#c47a1f', fontSize: 12 }}>⚠ Aband.</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {grades!.filter(g => latestRow[g.aprov] != null || latestRow[g.reprov] != null).map((g, i) => (
                                            <tr key={g.label} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                              <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{g.label}</td>
                                              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#2f7a58', fontWeight: 600 }}>{latestRow[g.aprov] != null ? `${Number(latestRow[g.aprov]).toFixed(1)}%` : '—'}</td>
                                              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#b74f42', fontWeight: 600 }}>{latestRow[g.reprov] != null ? `${Number(latestRow[g.reprov]).toFixed(1)}%` : '—'}</td>
                                              <td style={{ padding: '9px 14px', textAlign: 'right', color: '#c47a1f', fontWeight: 600 }}>{latestRow[g.aband] != null ? `${Number(latestRow[g.aband]).toFixed(1)}%` : '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </section>
                  );
                })()}

                {/* ── TAXA DE NÃO RESPOSTA (TNR) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allTnr = ch?.tnr?.filter((d: any) => d.fund != null || d.med != null).slice().sort((a: any, b: any) => a.ano - b.ano) || [];
                  if (allTnr.length === 0) return null;
                  const latest = allTnr[allTnr.length - 1];
                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';
                  const tnrColor = (v: any) => Number(v) > 20 ? '#b74f42' : Number(v) > 10 ? '#c47a1f' : null;

                  // Segmentos disponíveis (igual ao padrão de Rendimento)
                  const tnrSegmentos = [
                    { key: 'fund',    label: 'Fundamental',  sub: 'Total',          valKey: 'fund',    color: '#2d5a88',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'fund_ai', label: 'Anos Iniciais', sub: 'Fund. 1º–5º',   valKey: 'fund_ai', color: '#2d6a4f',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                      ],
                    },
                    { key: 'fund_af', label: 'Anos Finais',   sub: 'Fund. 6º–9º',   valKey: 'fund_af', color: '#1d3557',
                      grades: [
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'med',     label: 'Ensino Médio', sub: 'Total',           valKey: 'med',     color: '#6b2d6b',
                      grades: [
                        { label: '1ª série', key: 'm01' }, { label: '2ª série', key: 'm02' },
                        { label: '3ª série', key: 'm03' }, { label: '4ª série', key: 'm04' },
                      ],
                    },
                  ].filter(s => latest[s.valKey] != null);

                  const seg = tnrSegmento ? tnrSegmentos.find(s => s.key === tnrSegmento) : null;
                  const tnrRows = allTnr.filter((d: any) => seg ? d[seg.valKey] != null : d.fund != null);
                  const gradesDisponiveis = seg ? seg.grades.filter(g => latest[g.key] != null) : [];

                  return (
                    <section id="sec-tnr" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-tnr') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Taxa de Não Resposta</h2>
                          <p>% de alunos que não participaram da avaliação Prova Brasil/SAEB — afeta diretamente o cálculo do IDEB</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10 }}>
                          <span style={{display:'flex',alignItems:'center',gap:5}}><X size={13} /> Taxa de não resposta ao SAEB/Prova Brasil (%)</span>
                        </div>

                        {/* Cartões de segmento clicáveis — igual ao Rendimento */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                          {tnrSegmentos.map(s => {
                            const isActive = tnrSegmento === s.key;
                            const val = latest[s.valKey];
                            const valColor = tnrColor(val);
                            return (
                              <button
                                key={s.key}
                                onClick={() => setTnrSegmento(isActive ? null : s.key)}
                                style={{
                                  flex: '1 1 130px', minWidth: 120,
                                  padding: '12px 14px',
                                  border: `2px solid ${isActive ? s.color : '#e7d9bf'}`,
                                  borderRadius: '14px 16px 12px 15px',
                                  background: isActive ? s.color : '#fffef8',
                                  color: isActive ? '#fff' : '#3d4450',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  boxShadow: isActive ? `0 4px 14px ${s.color}44` : '0 2px 8px rgba(83,72,53,0.07)',
                                  transition: 'all .18s',
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 0.85 : 0.6, marginBottom: 2 }}>{s.sub}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                                {val != null && (
                                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: isActive ? '#fff' : (valColor ?? s.color) }}>
                                    {Number(val).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                                  </div>
                                )}
                                <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{isActive ? '▼ clique p/ fechar' : 'não resposta · clique'}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tabela e detalhe — só aparece quando um segmento está selecionado */}
                        {seg && tnrRows.length > 0 && (
                          <>
                            <div className="soft-card" style={{ padding: 0, overflow: 'hidden', marginBottom: gradesDisponiveis.length > 0 ? 12 : 0 }}>
                              <div style={{ padding: '9px 14px', background: seg.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11} /> {seg.label} — {seg.sub} — evolução por ano</span>
                                <button onClick={() => setTnrSegmento(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕ fechar</button>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}>Taxa de Não Resposta</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tnrRows.map((d: any, i: number) => {
                                    const v = d[seg.valKey];
                                    return (
                                      <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tnrColor(v) ?? seg.color }}>{pct(v)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Por série — último ano (se houver dados por série) */}
                            {gradesDisponiveis.length > 0 && (
                              <div style={{ marginTop: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 8 }}>
                                  <span style={{display:'flex',alignItems:'center',gap:4}}><ClipboardList size={11} /> Por série — {latest.ano}</span>
                                </div>
                                <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: seg.color + '22' }}>
                                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: seg.color, fontSize: 12 }}>Série / Ano</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}><X size={11} style={{display:'inline',verticalAlign:'middle'}} /> Não Resposta</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gradesDisponiveis.map((g, i) => (
                                        <tr key={g.key} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{g.label}</td>
                                          <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tnrColor(latest[g.key]) ?? seg.color }}>{pct(latest[g.key])}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* ── INSE — DISTRIBUIÇÃO POR NÍVEL ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const inseData = (ch?.inse ?? []).filter((d: any) => d.media != null).sort((a: any, b: any) => a.ano - b.ano);
                  if (inseData.length === 0) return null;
                  const hasLevels = inseData.some((d: any) => d.n1 != null);
                  if (!hasLevels) return null; // Só mostra se tiver distribuição
                  const latest = inseData[inseData.length - 1];
                  const selAnoInse = inseAno && inseData.some((d: any) => d.ano === inseAno) ? inseAno : latest.ano;
                  const rowInse = inseData.find((d: any) => d.ano === selAnoInse) ?? latest;

                  const niveis = [
                    { n: 1, label: 'Nível I',   desc: 'Muito baixo',     color: '#b71c1c' },
                    { n: 2, label: 'Nível II',  desc: 'Baixo',           color: '#d44f2a' },
                    { n: 3, label: 'Nível III', desc: 'Médio-baixo',     color: '#e9a82b' },
                    { n: 4, label: 'Nível IV',  desc: 'Médio',           color: '#c8a228' },
                    { n: 5, label: 'Nível V',   desc: 'Médio-alto',      color: '#7aad3f' },
                    { n: 6, label: 'Nível VI',  desc: 'Alto',            color: '#4caf50' },
                    { n: 7, label: 'Nível VII', desc: 'Muito alto',      color: '#2d8f4e' },
                    { n: 8, label: 'Nível VIII',desc: 'Muito alto (+)',  color: '#1a5c33' },
                  ].filter(nv => rowInse[`n${nv.n}`] != null);

                  if (niveis.length === 0) return null;

                  return (
                    <section id="sec-inse" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-inse') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>INSE — Distribuição dos Estudantes por Nível Socioeconômico</h2>
                          <p>Percentual de alunos em cada um dos 8 níveis do índice socioeconômico INEP</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      {inseData.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {inseData.map(d => (
                            <button key={d.ano} onClick={() => setInseAno(d.ano)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${d.ano === selAnoInse ? '#7c5cbf' : '#e7d9bf'}`,
                                background: d.ano === selAnoInse ? '#7c5cbf' : '#fffef8',
                                color: d.ano === selAnoInse ? '#fff' : '#5d4037',
                              }}>
                              {d.ano}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="soft-card" style={{ padding: 16, marginBottom: 8 }}>
                        <div style={{ marginBottom: 12, fontSize: 13, color: '#5d4037' }}>
                          <strong>INSE Médio {rowInse.ano}:</strong>{' '}
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#7c5cbf' }}>
                            {rowInse.media != null ? Number(rowInse.media).toFixed(2) : '—'}
                          </span>
                          {rowInse.classificacao && (
                            <span style={{ marginLeft: 10, fontSize: 12, background: '#f0eaf8', color: '#7c5cbf', borderRadius: 12, padding: '2px 10px', fontWeight: 700 }}>
                              {rowInse.classificacao}
                            </span>
                          )}
                          {rowInse.qtd_alunos && (
                            <span style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>
                              {Number(rowInse.qtd_alunos).toLocaleString('pt-BR')} alunos
                            </span>
                          )}
                        </div>
                        {niveis.map(nv => {
                          const pct = rowInse[`n${nv.n}`] as number | null;
                          const w = pct != null ? Math.max(2, Math.min(100, pct)) : 0;
                          return (
                            <div key={nv.n} style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                                <span style={{ fontWeight: 700, color: nv.color }}>{nv.label} <span style={{ fontWeight: 400, color: '#888' }}>— {nv.desc}</span></span>
                                <span style={{ fontWeight: 700, color: nv.color }}>{pct != null ? `${pct.toFixed(1)}%` : '—'}</span>
                              </div>
                              <div style={{ height: 10, borderRadius: 6, background: '#f0e8d8', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${w}%`, borderRadius: 6, background: nv.color, transition: 'width 0.4s' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })()}

                {/* ── DISTORÇÃO IDADE-SÉRIE (TDI) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allTdi = ch?.tdi?.filter((d: any) => d.fund_total != null || d.fund_ai != null || d.fund_af != null || d.medio != null).slice().sort((a: any, b: any) => a.ano - b.ano) || [];
                  if (allTdi.length === 0) return null;
                  const latest = allTdi[allTdi.length - 1];
                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';
                  // Vermelho > 30%, laranja > 20%
                  const tdiColor = (v: any) => Number(v) > 30 ? '#b74f42' : Number(v) > 20 ? '#c47a1f' : null;

                  const tdiSegmentos = [
                    { key: 'fund',    label: 'Fundamental',  sub: 'Total',         valKey: 'fund_total', color: '#2d5a88',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'fund_ai', label: 'Anos Iniciais', sub: 'Fund. 1º–5º',  valKey: 'fund_ai',    color: '#2d6a4f',
                      grades: [
                        { label: '1º ano', key: 'f01' }, { label: '2º ano', key: 'f02' }, { label: '3º ano', key: 'f03' },
                        { label: '4º ano', key: 'f04' }, { label: '5º ano', key: 'f05' },
                      ],
                    },
                    { key: 'fund_af', label: 'Anos Finais',   sub: 'Fund. 6º–9º',  valKey: 'fund_af',    color: '#1d3557',
                      grades: [
                        { label: '6º ano', key: 'f06' }, { label: '7º ano', key: 'f07' },
                        { label: '8º ano', key: 'f08' }, { label: '9º ano', key: 'f09' },
                      ],
                    },
                    { key: 'med',     label: 'Ensino Médio', sub: 'Total',          valKey: 'medio',      color: '#6b2d6b',
                      grades: [
                        { label: '1ª série', key: 'm01' }, { label: '2ª série', key: 'm02' },
                        { label: '3ª série', key: 'm03' }, { label: '4ª série', key: 'm04' },
                      ],
                    },
                  ].filter(s => latest[s.valKey] != null);

                  const seg = tdiSegmento ? tdiSegmentos.find(s => s.key === tdiSegmento) : null;
                  const tdiRows = allTdi.filter((d: any) => seg ? d[seg.valKey] != null : d.fund_total != null || d.medio != null);
                  const gradesDisponiveis = seg ? seg.grades.filter(g => latest[g.key] != null) : [];

                  return (
                    <section id="sec-tdi" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-tdi') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Distorção Idade-Série</h2>
                          <p>% de alunos com 2 ou mais anos de defasagem em relação à série esperada para a idade</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#5d4037', marginBottom: 10 }}>
                          <span style={{display:'flex',alignItems:'center',gap:5}}><CalendarDays size={13} /> Taxa de Distorção Idade-Série (TDI)</span>
                        </div>

                        {/* Cartões de segmento clicáveis */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                          {tdiSegmentos.map(s => {
                            const isActive = tdiSegmento === s.key;
                            const val = latest[s.valKey];
                            const valColor = tdiColor(val);
                            return (
                              <button
                                key={s.key}
                                onClick={() => setTdiSegmento(isActive ? null : s.key)}
                                style={{
                                  flex: '1 1 130px', minWidth: 120,
                                  padding: '12px 14px',
                                  border: `2px solid ${isActive ? s.color : '#e7d9bf'}`,
                                  borderRadius: '14px 16px 12px 15px',
                                  background: isActive ? s.color : '#fffef8',
                                  color: isActive ? '#fff' : '#3d4450',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  boxShadow: isActive ? `0 4px 14px ${s.color}44` : '0 2px 8px rgba(83,72,53,0.07)',
                                  transition: 'all .18s',
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 0.85 : 0.6, marginBottom: 2 }}>{s.sub}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                                {val != null && (
                                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: isActive ? '#fff' : (valColor ?? s.color) }}>
                                    {Number(val).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                                  </div>
                                )}
                                <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>{isActive ? '▼ clique p/ fechar' : 'distorção · clique'}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tabela de evolução — aparece só quando um segmento está selecionado */}
                        {seg && tdiRows.length > 0 && (
                          <>
                            <div className="soft-card" style={{ padding: 0, overflow: 'hidden', marginBottom: gradesDisponiveis.length > 0 ? 12 : 0 }}>
                              <div style={{ padding: '9px 14px', background: seg.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11} /> {seg.label} — {seg.sub} — evolução por ano</span>
                                <button onClick={() => setTdiSegmento(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: 0.8 }}>✕ fechar</button>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}><span style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4}}><CalendarDays size={11} /> Distorção Idade-Série</span></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tdiRows.map((d: any, i: number) => {
                                    const v = d[seg.valKey];
                                    return (
                                      <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tdiColor(v) ?? seg.color }}>{pct(v)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Por série — último ano */}
                            {gradesDisponiveis.length > 0 && (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 8 }}>
                                  <span style={{display:'flex',alignItems:'center',gap:4}}><ClipboardList size={11} /> Por série / ano escolar — {latest.ano}</span>
                                </div>
                                <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ background: seg.color + '22' }}>
                                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: seg.color, fontSize: 12 }}>Série / Ano</th>
                                        <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: seg.color, fontSize: 12 }}><span style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4}}><CalendarDays size={11} /> Distorção</span></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gradesDisponiveis.map((g, i) => (
                                        <tr key={g.key} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#5d4037' }}>{g.label}</td>
                                          <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: tdiColor(latest[g.key]) ?? seg.color }}>{pct(latest[g.key])}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* ── MATRÍCULAS POR ETAPA ── */}
                {(() => {
                  const matEtapas = [
                    { label: 'Ed. Infantil',  keyMat: 'qt_mat_inf',     color: '#7b5ea7' },
                    { label: 'Fund. AI',      keyMat: 'qt_mat_fund_ai', color: '#2d5a88' },
                    { label: 'Fund. AF',      keyMat: 'qt_mat_fund_af', color: '#1d3557' },
                    { label: 'Ensino Médio',  keyMat: 'qt_mat_med',     color: '#9b6a16' },
                    { label: 'EJA',           keyMat: 'qt_mat_eja',     color: '#6d4c41' },
                    { label: 'Ed. Especial',  keyMat: 'qt_mat_esp',     color: '#2f7a58' },
                  ].filter(e => ((censoLatest as any)[e.keyMat] || 0) > 0);
                  const totalMat = (censoLatest as any).qt_mat_bas || matEtapas.reduce((s, e) => s + Number((censoLatest as any)[e.keyMat] || 0), 0);
                  if (!matEtapas.length || !totalMat) return null;
                  const anosDisp = (evolucaoData.anos_disponiveis as number[]).filter((a: number) => a >= 2020).sort((a, b) => a - b);
                  const hasHistorico = anosDisp.length > 1;
                  return (
                    <section id="sec-matriculas" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-matriculas') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Matrículas por etapa</h2>
                          <p>Distribuição e evolução histórica das matrículas por etapa de ensino</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      {/* Barra proporcional */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                          Distribuição proporcional — {latestAno}
                        </div>
                        <div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
                          {matEtapas.map(e => {
                            const pct = totalMat > 0 ? (Number((censoLatest as any)[e.keyMat] || 0) / totalMat) * 100 : 0;
                            return <div key={e.keyMat} style={{ flex: pct, background: e.color, minWidth: pct > 0 ? 4 : 0 }} />;
                          })}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {matEtapas.map(e => {
                            const val = Number((censoLatest as any)[e.keyMat] || 0);
                            const pct = totalMat > 0 ? (val / totalMat * 100).toFixed(1) : '0';
                            return (
                              <div key={e.keyMat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color, flexShrink: 0, display: 'inline-block' }} />
                                <span style={{ color: 'var(--m-muted)' }}>{e.label}</span>
                                <strong style={{ color: 'var(--m-text)' }}>{val.toLocaleString('pt-BR')}</strong>
                                <span style={{ color: '#94a3b8' }}>({pct}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tabela por etapa */}
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f0ebe0' }}>
                              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#5d3a1a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Etapa</th>
                              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#5d3a1a', fontSize: 12 }}>Matrículas {latestAno}</th>
                              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#5d3a1a', fontSize: 12 }}>% do total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matEtapas.map((e, i) => {
                              const val = Number((censoLatest as any)[e.keyMat] || 0);
                              const pct = totalMat > 0 ? (val / totalMat * 100).toFixed(1) : '0';
                              return (
                                <tr key={e.keyMat} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                  <td style={{ padding: '10px 16px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                                      <span style={{ fontWeight: 600, color: '#4a3020' }}>{e.label}</span>
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: e.color, fontSize: 14 }}>{val.toLocaleString('pt-BR')}</td>
                                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#888', fontWeight: 500 }}>{pct}%</td>
                                </tr>
                              );
                            })}
                            <tr style={{ borderTop: '2px solid #e0d8cc', background: '#fdf5e6' }}>
                              <td style={{ padding: '10px 16px', fontWeight: 800, color: '#3d2b1a' }}>Total</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color: '#2d5a88', fontSize: 14 }}>{totalMat.toLocaleString('pt-BR')}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', color: '#888' }}>100%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Evolução histórica */}
                      {hasHistorico && (
                        <>
                          <button onClick={() => toggleSection('mat-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {expandedSections['mat-evo'] !== false ? '▼' : '▶'} <CalendarDays size={11} /> Evolução histórica por etapa
                          </button>
                          {expandedSections['mat-evo'] !== false && (
                            <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f0ebe0' }}>
                                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d3a1a', fontSize: 12 }}>Etapa</th>
                                    {anosDisp.map((a: number) => (
                                      <th key={a} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#5d3a1a', fontSize: 12, background: a === latestAno ? '#e8dfc8' : undefined }}>{a}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {matEtapas.map((e, ei) => (
                                    <tr key={e.keyMat} style={{ background: ei % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '9px 14px', fontWeight: 600, color: e.color }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                                          {e.label}
                                        </span>
                                      </td>
                                      {anosDisp.map((a: number, ai: number) => {
                                        const v = (evolucaoData.censo_por_ano[a] as any)?.[e.keyMat] ?? null;
                                        const prev = ai > 0 ? ((evolucaoData.censo_por_ano[anosDisp[ai - 1]] as any)?.[e.keyMat] ?? null) : null;
                                        const delta = v != null && prev != null ? v - prev : null;
                                        return (
                                          <td key={a} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: a === latestAno ? 700 : 500, color: '#2c3e50', background: a === latestAno ? '#fdf5e6' : undefined }}>
                                            {v != null ? v.toLocaleString('pt-BR') : <span style={{ color: '#ccc' }}>—</span>}
                                            {delta != null && delta !== 0 && (
                                              <div style={{ fontSize: 10, lineHeight: 1.3, marginTop: 1, fontWeight: 700, color: delta > 0 ? '#16714a' : '#b74f42' }}>
                                                {delta > 0 ? '▲ ' : '▼ '}{Math.abs(delta).toLocaleString('pt-BR')}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                  <tr style={{ borderTop: '2px solid #e0d8cc', background: '#fdf5e6' }}>
                                    <td style={{ padding: '9px 14px', fontWeight: 800, color: '#3d2b1a' }}>Total</td>
                                    {anosDisp.map((a: number) => {
                                      const v = (evolucaoData.censo_por_ano[a] as any)?.qt_mat_bas ?? null;
                                      return (
                                        <td key={a} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#2d5a88', background: a === latestAno ? '#fdf5e6' : undefined }}>
                                          {v != null ? v.toLocaleString('pt-BR') : <span style={{ color: '#ccc' }}>—</span>}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  );
                })()}

                {/* ── ESTRUTURA E RECURSOS ── */}
                {(() => {
                  const turEI  = censoLatest.qt_tur_inf  ?? null;
                  const turEF  = censoLatest.qt_tur_fund ?? null;
                  const turEM  = censoLatest.qt_tur_med  ?? null;
                  const turEJA = censoLatest.qt_tur_eja ?? null;
                  const turTot = censoLatest.qt_tur_bas  ?? censoLatest.qt_turmas ?? null;
                  const turESP = censoLatest.qt_tur_esp  ?? null;
                  const turPctDen = turTot;
                  // Calcula resto para que o total sempre feche
                  const turSomaEtapas = [turEI, turEF, turEM, turEJA, turESP].reduce((s, v) => s + (v ?? 0), 0);
                  const turResto = turTot != null && turSomaEtapas < turTot ? turTot - turSomaEtapas : null;
                  const docEI  = censoLatest.qt_doc_inf  ?? null;
                  const docEF  = censoLatest.qt_doc_fund ?? null;
                  const docEM  = censoLatest.qt_doc_med  ?? null;
                  const docEJA = censoLatest.qt_doc_eja  ?? null;
                  const docESP = censoLatest.qt_doc_esp  ?? null;
                  const docTot = censoLatest.qt_doc_bas  ?? censoLatest.qt_docentes ?? null;
                  // Docentes: um mesmo professor pode atuar em mais de uma etapa.
                  // Usamos docTot como denominador; se a soma das etapas ultrapassar o total,
                  // não mostramos o resto (a duplicidade é esperada e explicada em nota).
                  const docPctDen = docTot;
                  const docSomaEtapas = [docEI, docEF, docEM, docEJA, docESP].reduce((s, v) => s + (v ?? 0), 0);
                  const docResto = docTot != null && docSomaEtapas < docTot ? docTot - docSomaEtapas : null;
                  const salTot    = censoLatest.qt_salas_utilizadas        ?? null;
                  const salDentro = censoLatest.qt_salas_utilizadas_dentro ?? null;
                  const salFora   = censoLatest.qt_salas_utilizadas_fora   ?? null;
                  const hasTur = [turEI,turEF,turEM,turEJA,turTot].some(v => v != null && v > 0);
                  const hasDoc = [docEI,docEF,docEM,docEJA,docTot].some(v => v != null && v > 0);
                  const hasSal = salTot != null && salTot > 0;
                  if (!hasTur && !hasDoc && !hasSal) return null;
                  const etapaRow = (label: string, val: number | null, tot: number | null) => {
                    const pct = (val != null && tot != null && tot > 0) ? Math.round(val / tot * 100) : null;
                    return (
                      <div key={label} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                        <span style={{minWidth:'90px',fontSize:'12px',color:'var(--m-muted)',fontWeight:600}}>{label}</span>
                        <div style={{flex:1,height:'8px',borderRadius:'4px',background:'#e9ecef',overflow:'hidden'}}>
                          {pct != null && <div style={{height:'100%',width:`${pct}%`,borderRadius:'4px',background:'var(--m-primary)',transition:'width 0.4s'}} />}
                        </div>
                        <span style={{minWidth:'40px',fontSize:'13px',fontWeight:700,textAlign:'right'}}>{val != null ? val.toLocaleString('pt-BR') : '—'}</span>
                        {pct != null && <span style={{minWidth:'32px',fontSize:'11px',color:'var(--m-muted)',textAlign:'right'}}>{pct}%</span>}
                      </div>
                    );
                  };
                  return (
                    <section id="sec-estrutura" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-estrutura') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div><h2>Estrutura e recursos</h2><p>Turmas, equipe docente e espaços físicos por etapa</p></div>
                      </div>
                      <div className="organic-divider" />
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'14px'}}>
                        {hasTur && (
                          <div className="soft-card">
                            <div className="attention-head"><School size={16} /><strong>Turmas por etapa</strong></div>
                            <div style={{marginTop:'14px'}}>
                              {etapaRow('Infantil',  turEI,  turPctDen)}
                              {etapaRow('Fundamental', turEF, turPctDen)}
                              {etapaRow('Médio',     turEM,  turPctDen)}
                              {etapaRow('EJA',       turEJA, turPctDen)}
                              {etapaRow('Especial',  turESP, turPctDen)}
                              {turResto != null && turResto > 0 && etapaRow('Outras', turResto, turPctDen)}
                              <div style={{borderTop:'1px solid #eee',marginTop:'6px',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                                <span style={{color:'var(--m-muted)',fontWeight:600}}>Total</span>
                                <strong>{turTot != null ? turTot.toLocaleString('pt-BR') : '—'} turmas</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {hasDoc && (
                          <div className="soft-card">
                            <div className="attention-head"><GraduationCap size={16} /><strong>Docentes por etapa</strong></div>
                            <div style={{marginTop:'14px'}}>
                              {etapaRow('Infantil',  docEI,  docPctDen)}
                              {etapaRow('Fundamental', docEF, docPctDen)}
                              {etapaRow('Médio',     docEM,  docPctDen)}
                              {etapaRow('EJA',       docEJA, docPctDen)}
                              {etapaRow('Especial',  docESP, docPctDen)}
                              {docResto != null && docResto > 0 && etapaRow('Outras', docResto, docPctDen)}
                              <div style={{borderTop:'1px solid #eee',marginTop:'6px',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                                <span style={{color:'var(--m-muted)',fontWeight:600}}>Total</span>
                                <strong>{docTot != null ? docTot.toLocaleString('pt-BR') : '—'} docentes</strong>
                              </div>
                              {docSomaEtapas > (docTot ?? 0) && (
                                <p style={{fontSize:'11px',color:'var(--m-muted)',margin:'6px 0 0',lineHeight:1.4}}>* Um mesmo docente pode atuar em mais de uma etapa.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* ── ESFORÇO DOCENTE (IED) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allIed = (ch?.ied ?? []).filter((d: any) =>
                    [1,2,3,4,5,6].some(n => d[`nivel_${n}`] != null)
                  ).sort((a: any, b: any) => a.ano - b.ano);
                  if (allIed.length === 0) return null;

                  const anos = allIed.map((d: any) => d.ano);
                  const selectedAno = iedAno && anos.includes(iedAno) ? iedAno : anos[anos.length - 1];
                  const row = allIed.find((d: any) => d.ano === selectedAno) ?? allIed[allIed.length - 1];

                  const etapas = [
                    { key: 'nivel',   label: 'Total',        prefix: 'nivel_',        color: '#4a5568' },
                    { key: 'fund_ai', label: 'Fund. AI',      prefix: 'fund_ai_nivel_', color: '#2d6a4f' },
                    { key: 'fund_af', label: 'Fund. AF',      prefix: 'fund_af_nivel_', color: '#1d3557' },
                    { key: 'med',     label: 'Ens. Médio',    prefix: 'med_nivel_',    color: '#6b2d6b' },
                  ].filter(e => [1,2,3,4,5,6].some(n => row[`${e.prefix}${n}`] != null));

                  const niveis = [
                    { n: 1, desc: '1 escola · 1 ou 2 turmas · 1 turno' },
                    { n: 2, desc: '1 escola · 3–4 turmas · 1 ou 2 turnos' },
                    { n: 3, desc: '1 escola · 5+ turmas · 1 ou 2 turnos' },
                    { n: 4, desc: '2 escolas · até 4 turmas · 2 turnos' },
                    { n: 5, desc: '2 escolas · 5+ turmas · 2 ou 3 turnos' },
                    { n: 6, desc: '3+ escolas · 3 turnos · maior esforço' },
                  ];

                  const nivelColor = (n: number) =>
                    n >= 6 ? '#b74f42' : n >= 5 ? '#c47a1f' : n >= 4 ? '#8a6e3b' : null;

                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';

                  return (
                    <section id="sec-ied" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-ied') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Esforço Docente (IED)</h2>
                          <p>Percentual de docentes por nível de esforço e etapa de ensino — quanto maior o nível, maior a sobrecarga</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      {/* Seletor de ano */}
                      {anos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {anos.map(a => (
                            <button key={a} onClick={() => setIedAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selectedAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selectedAno ? '#5d4037' : '#fffef8',
                                color: a === selectedAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Legenda de níveis */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                          <span style={{display:'flex',alignItems:'center',gap:5}}><GraduationCap size={12} /> Percentual de docentes por nível de esforço — {selectedAno}</span>
                        </div>
                        <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                            <thead>
                              <tr style={{ background: '#f7f2ea' }}>
                                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12, whiteSpace: 'nowrap' }}>
                                  Nível de esforço
                                </th>
                                {etapas.map(e => (
                                  <th key={e.key} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {e.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {niveis.map(({ n, desc }, i) => {
                                const cor = nivelColor(n);
                                return (
                                  <tr key={n} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                    <td style={{ padding: '9px 14px' }}>
                                      <span style={{
                                        display: 'inline-block', width: 24, height: 24, lineHeight: '24px', textAlign: 'center',
                                        borderRadius: '50%', fontWeight: 800, fontSize: 12, marginRight: 8,
                                        background: cor ?? '#e8dfd0', color: cor ? '#fff' : '#5d4037',
                                      }}>{n}</span>
                                      <span style={{ fontSize: 12, color: '#7a6651' }}>{desc}</span>
                                    </td>
                                    {etapas.map(e => {
                                      const val = row[`${e.prefix}${n}`];
                                      return (
                                        <td key={e.key} style={{
                                          padding: '9px 12px', textAlign: 'right', fontWeight: 700,
                                          color: val != null ? (cor ?? e.color) : '#bbb',
                                          fontSize: 13,
                                        }}>
                                          {pct(val)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                          * Níveis 5 e 6 indicam sobrecarga docente: atuação em múltiplas escolas e turnos.
                        </div>
                      </div>

                      {/* Mini evolução N5+N6 se houver múltiplos anos */}
                      {allIed.length > 1 && (() => {
                        const evoRows = allIed.filter((d: any) => d.nivel_5 != null || d.nivel_6 != null);
                        if (evoRows.length < 2) return null;
                        const iedEvoOpen = expandedSections['ied-evo'] !== false;
                        return (
                          <div>
                            <button onClick={() => toggleSection('ied-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#b74f42', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {iedEvoOpen ? '▼' : '▶'} ⚠️ Evolução da sobrecarga docente (Níveis 5 e 6) — Total
                            </button>
                            {!iedEvoOpen && null}
                            {iedEvoOpen && <div>
                            <div className="soft-card" style={{ padding: 0, overflow: 'hidden' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#fdf2f2' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>Ano</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#c47a1f', fontSize: 12 }}>Nível 5</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>Nível 6</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#b74f42', fontSize: 12 }}>N5 + N6</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {evoRows.map((d: any, i: number) => {
                                    const n5 = d.nivel_5 != null ? Number(d.nivel_5) : null;
                                    const n6 = d.nivel_6 != null ? Number(d.nivel_6) : null;
                                    const soma = n5 != null && n6 != null ? n5 + n6 : (n5 ?? n6);
                                    return (
                                      <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fff8f8', borderTop: '1px solid #f0e8e8' }}>
                                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#5d4037' }}>{d.ano}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#c47a1f', fontWeight: 600 }}>{n5 != null ? `${n5.toFixed(1)}%` : '—'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#b74f42', fontWeight: 600 }}>{n6 != null ? `${n6.toFixed(1)}%` : '—'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: soma != null && soma > 50 ? '#b74f42' : '#5d4037' }}>
                                          {soma != null ? `${soma.toFixed(1)}%` : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── ADEQUAÇÃO DA FORMAÇÃO DOCENTE (AFD) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allAfd = (ch?.afd ?? [])
                    .filter((d: any) => d.fun_g1 != null || d.fun_g2 != null || d.med_g1 != null)
                    .sort((a: any, b: any) => a.ano - b.ano);
                  if (allAfd.length === 0) return null;

                  const afdAnos = allAfd.map((d: any) => d.ano);
                  const selAno  = afdAno && afdAnos.includes(afdAno) ? afdAno : afdAnos[afdAnos.length - 1];
                  const row     = allAfd.find((d: any) => d.ano === selAno) ?? allAfd[allAfd.length - 1];

                  const pct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—';

                  // Grupos como colunas (1=melhor, 5=pior)
                  const grupos = [
                    { n: 1, label: 'Grupo 1', color: '#2d6a4f', desc: 'Licenciatura na disciplina' },
                    { n: 2, label: 'Grupo 2', color: '#40916c', desc: 'Bacharelado na disciplina' },
                    { n: 3, label: 'Grupo 3', color: '#e9a82b', desc: 'Licenciatura em outra área' },
                    { n: 4, label: 'Grupo 4', color: '#d46b2a', desc: 'Outra formação superior' },
                    { n: 5, label: 'Grupo 5', color: '#b71c1c', desc: 'Sem formação superior adequada' },
                  ];

                  // Etapas como linhas
                  type AfdEtapa = { key: string; label: string; color: string; hasData: boolean };
                  const etapas: AfdEtapa[] = [
                    { key: 'inf',     label: 'Educação Infantil',          color: '#7b5ea7', hasData: allAfd.some((d: any) => d.inf_g1 != null) },
                    { key: 'fun',     label: 'Ensino Fundamental (Total)', color: '#2d5a88', hasData: allAfd.some((d: any) => d.fun_g1 != null) },
                    { key: 'fun_ai',  label: '↳ Anos Iniciais',            color: '#3a7bd5', hasData: allAfd.some((d: any) => d.fun_ai_g1 != null) },
                    { key: 'fun_af',  label: '↳ Anos Finais',              color: '#1d3557', hasData: allAfd.some((d: any) => d.fun_af_g1 != null) },
                    { key: 'med',     label: 'Ensino Médio',               color: '#6b2d6b', hasData: allAfd.some((d: any) => d.med_g1 != null) },
                    { key: 'eja_fun', label: 'EJA — Fundamental',          color: '#795548', hasData: allAfd.some((d: any) => d.eja_fun_g1 != null) },
                    { key: 'eja_med', label: 'EJA — Médio',                color: '#4e342e', hasData: allAfd.some((d: any) => d.eja_med_g1 != null) },
                  ].filter(e => e.hasData);

                  return (
                    <section id="sec-afd" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-afd') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Adequação da Formação Docente (AFD)</h2>
                          <p>Percentual de docentes por grupo de adequação à disciplina e etapa de ensino</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      {/* Legenda dos grupos */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        {grupos.map(g => (
                          <div key={g.n} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                            <span style={{ width: 12, height: 12, borderRadius: 3, background: g.color, display: 'inline-block' }} />
                            <span style={{ fontWeight: 700, color: g.color }}>{g.label}:</span>
                            <span style={{ color: '#5d4037' }}>{g.desc}</span>
                          </div>
                        ))}
                      </div>

                      {/* Seletor de ano */}
                      {afdAnos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {afdAnos.map(a => (
                            <button key={a} onClick={() => setAfdAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selAno ? '#5d4037' : '#fffef8',
                                color: a === selAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tabela Etapas × Grupos */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                        <span style={{display:'flex',alignItems:'center',gap:5}}><BarChart3 size={12} /> % de docentes por grupo de adequação — {selAno}</span>
                      </div>
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f7f2ea' }}>
                              <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12, whiteSpace: 'nowrap' }}>
                                Etapa / Modalidade
                              </th>
                              {grupos.map(g => (
                                <th key={g.n} style={{
                                  padding: '8px 10px', textAlign: 'center', fontWeight: 800,
                                  color: '#fff', background: g.color, fontSize: 11, whiteSpace: 'nowrap',
                                  borderLeft: '2px solid #fff',
                                }}>
                                  {g.label}
                                </th>
                              ))}
                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#888', fontSize: 11, borderLeft: '1px solid #e0d8cc' }}>
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {etapas.map((e, i) => {
                              const vals = grupos.map(g => row[`${e.key}_g${g.n}`] as number | null);
                              const total = vals.every(v => v == null) ? null : vals.reduce((s, v) => (s ?? 0) + (v ?? 0), 0 as number | null);
                              return (
                                <tr key={e.key} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                  <td style={{ padding: '9px 14px', fontWeight: 700, color: e.color, whiteSpace: 'nowrap', fontSize: 12 }}>
                                    {e.label}
                                  </td>
                                  {grupos.map((g, gi) => {
                                    const v = vals[gi];
                                    const isG1 = g.n === 1;
                                    const isG5 = g.n === 5;
                                    const alert5 = isG5 && v != null && Number(v) > 20;
                                    const good1  = isG1 && v != null && Number(v) > 70;
                                    return (
                                      <td key={g.n} style={{
                                        padding: '9px 10px', textAlign: 'center', fontWeight: v != null ? 700 : 400,
                                        color: alert5 ? '#b71c1c' : good1 ? '#2d6a4f' : v != null ? g.color : '#bbb',
                                        borderLeft: '1px solid #f0e8d8',
                                        background: alert5 ? '#fff5f5' : good1 ? '#f0faf4' : undefined,
                                      }}>
                                        {pct(v)}{alert5 ? ' ⚠️' : good1 ? ' ✓' : ''}
                                      </td>
                                    );
                                  })}
                                  <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600, color: '#888', borderLeft: '1px solid #e0d8cc', fontSize: 12 }}>
                                    {total != null ? `${total.toFixed(1)}%` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Evolução de Grupo 1 por etapa */}
                      {allAfd.length > 1 && (() => {
                        const evoEtapas = etapas.filter(e => allAfd.some((d: any) => d[`${e.key}_g1`] != null));
                        if (evoEtapas.length === 0) return null;
                        return (
                          <div>
                            <button onClick={() => toggleSection('afd-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {expandedSections['afd-evo'] !== false ? '▼' : '▶'} <CalendarDays size={11} /> Evolução do Grupo 1 (formação adequada) por etapa
                            </button>
                            {expandedSections['afd-evo'] !== false && <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    {evoEtapas.map(e => (
                                      <th key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {e.label.replace('↳ ', '')}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allAfd.map((d: any, i: number) => (
                                    <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '8px 14px', fontWeight: 700, color: d.ano === selAno ? '#2d5a88' : '#5d4037' }}>
                                        {d.ano === selAno ? `▶ ${d.ano}` : d.ano}
                                      </td>
                                      {evoEtapas.map(e => {
                                        const v = d[`${e.key}_g1`];
                                        return (
                                          <td key={e.key} style={{
                                            padding: '8px 10px', textAlign: 'center', fontWeight: 600,
                                            color: v != null ? (Number(v) > 70 ? '#2d6a4f' : Number(v) > 50 ? e.color : '#d46b2a') : '#ccc',
                                          }}>
                                            {pct(v)}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── MÉDIA DE ALUNOS POR TURMA (ATU) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allAtu = (ch?.atu ?? [])
                    .filter((d: any) => d.fund != null || d.fund_ai != null || d.fund_af != null || d.medio != null || d.eja_fun != null || d.eja_med != null || d.inf_total != null)
                    .sort((a: any, b: any) => a.ano - b.ano);
                  if (allAtu.length === 0) return null;

                  const atuAnos = allAtu.map((d: any) => d.ano);
                  const selAno  = atuAno && atuAnos.includes(atuAno) ? atuAno : atuAnos[atuAnos.length - 1];
                  const row     = allAtu.find((d: any) => d.ano === selAno) ?? allAtu[allAtu.length - 1];

                  const fmt = (v: any) => v != null ? Number(v).toFixed(1) : '—';

                  const hasAnyInf    = allAtu.some((d: any) => d.inf_total != null || d.inf_cre != null || d.inf_pre != null);
                  const hasSeries    = allAtu.some((d: any) => d.fun_01 != null);
                  const hasMul       = allAtu.some((d: any) => d.fun_mul != null);
                  const hasMedSeries = allAtu.some((d: any) => d.med_01 != null);
                  const hasAnyEja = allAtu.some((d: any) => d.eja_fun != null || d.eja_med != null);

                  type AtuCol   = { key: string; label: string };
                  type AtuGroup = { label: string; color: string; cols: AtuCol[] };
                  const grupos: AtuGroup[] = [
                    ...(hasAnyInf ? [{
                      label: 'Educação Infantil', color: '#7b5ea7',
                      cols: [
                        { key: 'inf_total', label: 'Total' },
                        { key: 'inf_cre',   label: 'Creche' },
                        { key: 'inf_pre',   label: 'Pré-Escola' },
                      ] as AtuCol[],
                    }] : []),
                    {
                      label: 'Ensino Fundamental', color: '#2d5a88',
                      cols: [
                        { key: 'fund',    label: 'Total' },
                        { key: 'fund_ai', label: 'Anos Iniciais' },
                        { key: 'fund_af', label: 'Anos Finais' },
                        ...(hasSeries ? [
                          { key: 'fun_01', label: '1º Ano' }, { key: 'fun_02', label: '2º Ano' },
                          { key: 'fun_03', label: '3º Ano' }, { key: 'fun_04', label: '4º Ano' },
                          { key: 'fun_05', label: '5º Ano' }, { key: 'fun_06', label: '6º Ano' },
                          { key: 'fun_07', label: '7º Ano' }, { key: 'fun_08', label: '8º Ano' },
                          { key: 'fun_09', label: '9º Ano' },
                        ] as AtuCol[] : []),
                        ...(hasMul ? [{ key: 'fun_mul', label: 'Multietapa / Correção de Fluxo' }] as AtuCol[] : []),
                      ] as AtuCol[],
                    },
                    {
                      label: 'Ensino Médio', color: '#6b2d6b',
                      cols: [
                        { key: 'medio',  label: 'Total' },
                        ...(hasMedSeries ? [
                          { key: 'med_01', label: '1ª Série' }, { key: 'med_02', label: '2ª Série' },
                          { key: 'med_03', label: '3ª Série' }, { key: 'med_04', label: '4ª Série' },
                          { key: 'med_ns', label: 'Não-Seriado' },
                        ] as AtuCol[] : []),
                      ] as AtuCol[],
                    },
                    ...(hasAnyEja ? [{
                      label: 'EJA', color: '#6d4c41',
                      cols: [
                        { key: 'eja_fun', label: 'Fundamental' },
                        { key: 'eja_med', label: 'Médio' },
                      ] as AtuCol[],
                    }] : []),
                  ].filter(g => g.cols.some(c => row[c.key] != null || allAtu.some((d: any) => d[c.key] != null)));

                  const allCols = grupos.flatMap(g => g.cols);

                  // Aviso INEP se turma tiver acima de 35 alunos (referência comum)
                  const atuAlert = (v: any) => v != null && Number(v) > 35;

                  return (
                    <section id="sec-atu" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-atu') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Média de Alunos por Turma (ATU)</h2>
                          <p>Número médio de alunos por turma, por etapa e ano de ensino</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      {/* Seletor de ano */}
                      {atuAnos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {atuAnos.map(a => (
                            <button key={a} onClick={() => setAtuAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selAno ? '#5d4037' : '#fffef8',
                                color: a === selAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tabela agrupada */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                        <span style={{display:'flex',alignItems:'center',gap:5}}><Users size={12} /> Alunos por turma — {selAno}</span>
                      </div>
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr>
                              {grupos.map(g => (
                                <th key={g.label} colSpan={g.cols.length}
                                  style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800,
                                    color: '#fff', background: g.color, borderRight: '2px solid #fff',
                                    whiteSpace: 'nowrap', fontSize: 11 }}>
                                  {g.label}
                                </th>
                              ))}
                            </tr>
                            <tr style={{ background: '#f7f2ea' }}>
                              {allCols.map((c) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                return (
                                  <th key={c.key} style={{
                                    padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontSize: 11,
                                    color: grp.color, whiteSpace: 'nowrap',
                                    borderRight: '1px solid #ede5d5',
                                  }}>
                                    {c.label}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ background: '#fff' }}>
                              {allCols.map((c) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                const val = row[c.key];
                                const alert = atuAlert(val);
                                return (
                                  <td key={c.key} style={{
                                    padding: '9px 10px', textAlign: 'center',
                                    fontWeight: val != null ? 700 : 400,
                                    color: alert ? '#b71c1c' : val != null ? grp.color : '#bbb',
                                    borderRight: '1px solid #f0e8d8',
                                    fontSize: 13, background: alert ? '#fff5f5' : undefined,
                                  }}>
                                    {fmt(val)}
                                    {alert && <AlertTriangle size={10} style={{ marginLeft: 3, display:'inline', verticalAlign:'middle', color:'#b71c1c' }} />}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {allAtu.some((d: any) => allCols.some(c => atuAlert(d[c.key]))) && (
                        <p style={{ fontSize: 11, color: '#b71c1c', marginBottom: 12 }}>
                          <span style={{display:'flex',alignItems:'flex-start',gap:5}}><AlertTriangle size={12} style={{flexShrink:0,marginTop:1}} /> Valores acima de 35 alunos/turma podem indicar superlotação (referência INEP/MEC).</span>
                        </p>
                      )}

                      {/* Evolução histórica */}
                      {allAtu.length > 1 && (() => {
                        const evoEtapas = [
                          { key: 'inf_total', label: 'Ed. Infantil',  color: '#7b5ea7' },
                          { key: 'fund',      label: 'Fund. Total',   color: '#2d5a88' },
                          { key: 'fund_ai',   label: 'Fund. AI',      color: '#2d6a4f' },
                          { key: 'fund_af',   label: 'Fund. AF',      color: '#1d3557' },
                          { key: 'medio',     label: 'Ensino Médio',  color: '#6b2d6b' },
                          { key: 'eja_fun',   label: 'EJA Fundamental', color: '#795548' },
                          { key: 'eja_med',   label: 'EJA Médio',       color: '#4e342e' },
                        ].filter(e => allAtu.some((d: any) => d[e.key] != null));
                        if (evoEtapas.length === 0) return null;
                        return (
                          <div>
                            <button onClick={() => toggleSection('atu-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {expandedSections['atu-evo'] !== false ? '▼' : '▶'} <CalendarDays size={11} /> Evolução histórica — médias por etapa
                            </button>
                            {expandedSections['atu-evo'] !== false && <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    {evoEtapas.map(e => (
                                      <th key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {e.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allAtu.map((d: any, i: number) => (
                                    <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '8px 14px', fontWeight: 700, color: d.ano === selAno ? '#2d5a88' : '#5d4037' }}>
                                        {d.ano === selAno ? `▶ ${d.ano}` : d.ano}
                                      </td>
                                      {evoEtapas.map(e => {
                                        const v = d[e.key];
                                        return (
                                          <td key={e.key} style={{
                                            padding: '8px 10px', textAlign: 'center', fontWeight: 600,
                                            color: atuAlert(v) ? '#b71c1c' : v != null ? e.color : '#ccc',
                                            background: atuAlert(v) ? '#fff5f5' : undefined,
                                          }}>
                                            {fmt(v)}{atuAlert(v) ? ' ⚠️' : ''}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── HORAS-AULA DIÁRIAS (HAD) ── */}
                {(() => {
                  const ch = evolutionCharts;
                  const allHad = (ch?.had ?? [])
                    .filter((d: any) => d.fund != null || d.fund_ai != null || d.fund_af != null || d.medio != null || d.eja_fun != null || d.eja_med != null || d.inf_total != null)
                    .sort((a: any, b: any) => a.ano - b.ano);
                  if (allHad.length === 0) return null;

                  const hadAnos = allHad.map((d: any) => d.ano);
                  const selAno = hadAno && hadAnos.includes(hadAno) ? hadAno : hadAnos[hadAnos.length - 1];
                  const row = allHad.find((d: any) => d.ano === selAno) ?? allHad[allHad.length - 1];

                  const hr = (v: any) => v != null ? `${Number(v).toFixed(1)}h` : '—';

                  // Define grupos e colunas — mostra coluna só se ALGUM ano tem dado
                  const hasAnyInf = allHad.some((d: any) => d.inf_total != null || d.inf_cre != null || d.inf_pre != null);
                  const hasSeries = allHad.some((d: any) => d.fun_01 != null);
                  const hasMedSeries = allHad.some((d: any) => d.med_01 != null);
                  const hasAnyEja = allHad.some((d: any) => d.eja_fun != null || d.eja_med != null);

                  type HadCol = { key: string; label: string };
                  type HadGroup = { label: string; color: string; cols: HadCol[] };
                  const grupos: HadGroup[] = [
                    ...(hasAnyInf ? [{
                      label: 'Educação Infantil', color: '#7b5ea7',
                      cols: [
                        { key: 'inf_total', label: 'Total' },
                        { key: 'inf_cre',   label: 'Creche' },
                        { key: 'inf_pre',   label: 'Pré-Escola' },
                      ] as HadCol[],
                    }] : []),
                    {
                      label: 'Ensino Fundamental', color: '#2d5a88',
                      cols: [
                        { key: 'fund',    label: 'Total' },
                        { key: 'fund_ai', label: 'Anos Iniciais' },
                        { key: 'fund_af', label: 'Anos Finais' },
                        ...(hasSeries ? [
                          { key: 'fun_01', label: '1º Ano' }, { key: 'fun_02', label: '2º Ano' },
                          { key: 'fun_03', label: '3º Ano' }, { key: 'fun_04', label: '4º Ano' },
                          { key: 'fun_05', label: '5º Ano' }, { key: 'fun_06', label: '6º Ano' },
                          { key: 'fun_07', label: '7º Ano' }, { key: 'fun_08', label: '8º Ano' },
                          { key: 'fun_09', label: '9º Ano' },
                        ] as HadCol[] : []),
                      ] as HadCol[],
                    },
                    {
                      label: 'Ensino Médio', color: '#6b2d6b',
                      cols: [
                        { key: 'medio',  label: 'Total' },
                        ...(hasMedSeries ? [
                          { key: 'med_01', label: '1ª Série' }, { key: 'med_02', label: '2ª Série' },
                          { key: 'med_03', label: '3ª Série' }, { key: 'med_04', label: '4ª Série' },
                          { key: 'med_ns', label: 'Não-Seriado' },
                        ] as HadCol[] : []),
                      ] as HadCol[],
                    },
                    ...(hasAnyEja ? [{
                      label: 'EJA', color: '#6d4c41',
                      cols: [
                        { key: 'eja_fun', label: 'Fundamental' },
                        { key: 'eja_med', label: 'Médio' },
                      ] as HadCol[],
                    }] : []),
                  ].filter(g => g.cols.some(c => row[c.key] != null || allHad.some((d: any) => d[c.key] != null)));

                  const allCols = grupos.flatMap(g => g.cols);

                  return (
                    <section id="sec-had" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-had') ? 'none' : undefined }}>
                      <div className="section-title">
                        <div>
                          <h2>Horas-Aula Diárias (HAD)</h2>
                          <p>Média de horas-aula diárias por etapa de ensino e ano escolar</p>
                        </div>
                      </div>
                      <div className="organic-divider" />

                      {/* Seletor de ano */}
                      {hadAnos.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {hadAnos.map(a => (
                            <button key={a} onClick={() => setHadAno(a)}
                              style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${a === selAno ? '#5d4037' : '#e7d9bf'}`,
                                background: a === selAno ? '#5d4037' : '#fffef8',
                                color: a === selAno ? '#fff' : '#5d4037',
                              }}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tabela agrupada por etapa — scroll horizontal */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6 }}>
                        <span style={{display:'flex',alignItems:'center',gap:5}}><Clock size={12} /> Média de horas-aula diárias — {selAno}</span>
                      </div>
                      <div className="soft-card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            {/* Linha dos grupos */}
                            <tr style={{ background: '#f7f2ea' }}>
                              {grupos.map(g => (
                                <th key={g.label} colSpan={g.cols.length}
                                  style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: '#fff',
                                    background: g.color, borderRight: '2px solid #fff', whiteSpace: 'nowrap', fontSize: 11 }}>
                                  {g.label}
                                </th>
                              ))}
                            </tr>
                            {/* Linha das sub-colunas */}
                            <tr style={{ background: '#f7f2ea' }}>
                              {allCols.map((c, i) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                const isLast = i === allCols.length - 1 || !grupos.find(g => g.cols.includes(allCols[i+1]))?.cols.includes(allCols[i+1]);
                                return (
                                  <th key={c.key} style={{
                                    padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontSize: 11,
                                    color: grp.color, whiteSpace: 'nowrap',
                                    borderRight: isLast ? '2px solid #e0d8cc' : '1px solid #ede5d5',
                                  }}>
                                    {c.label}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ background: '#fff' }}>
                              {allCols.map((c, i) => {
                                const grp = grupos.find(g => g.cols.includes(c))!;
                                const isLast = i === allCols.length - 1 || grupos.find(g => g.cols.includes(allCols[i+1])) !== grp;
                                const val = row[c.key];
                                return (
                                  <td key={c.key} style={{
                                    padding: '9px 10px', textAlign: 'center', fontWeight: val != null ? 700 : 400,
                                    color: val != null ? grp.color : '#bbb',
                                    borderRight: isLast ? '2px solid #e0d8cc' : '1px solid #f0e8d8',
                                    fontSize: 13,
                                  }}>
                                    {hr(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Evolução histórica — apenas etapas disponíveis */}
                      {allHad.length > 1 && (() => {
                        const evoEtapas = [
                          { key: 'inf_total', label: 'Ed. Infantil',  color: '#7b5ea7' },
                          { key: 'fund',      label: 'Fund. Total',   color: '#2d5a88' },
                          { key: 'fund_ai',   label: 'Fund. AI',      color: '#2d6a4f' },
                          { key: 'fund_af',   label: 'Fund. AF',      color: '#1d3557' },
                          { key: 'medio',     label: 'Ensino Médio',  color: '#6b2d6b' },
                          { key: 'eja_fun',   label: 'EJA Fundamental', color: '#795548' },
                          { key: 'eja_med',   label: 'EJA Médio',       color: '#4e342e' },
                        ].filter(e => allHad.some((d: any) => d[e.key] != null));
                        if (evoEtapas.length === 0) return null;
                        return (
                          <div>
                            <button onClick={() => toggleSection('had-evo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#5d4037', marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {expandedSections['had-evo'] !== false ? '▼' : '▶'} <CalendarDays size={11} /> Evolução histórica por etapa (em horas/dia)
                            </button>
                            {expandedSections['had-evo'] !== false && <div className="soft-card" style={{ padding: 0, overflow: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f7f2ea' }}>
                                    <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#5d4037', fontSize: 12 }}>Ano</th>
                                    {evoEtapas.map(e => (
                                      <th key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: e.color, fontSize: 12, whiteSpace: 'nowrap' }}>
                                        {e.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allHad.map((d: any, i: number) => (
                                    <tr key={d.ano} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f2', borderTop: '1px solid #f0e8d8' }}>
                                      <td style={{ padding: '8px 14px', fontWeight: 700, color: d.ano === selAno ? '#2d5a88' : '#5d4037' }}>
                                        {d.ano === selAno ? `▶ ${d.ano}` : d.ano}
                                      </td>
                                      {evoEtapas.map(e => (
                                        <td key={e.key} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: d[e.key] != null ? e.color : '#ccc' }}>
                                          {hr(d[e.key])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </div>
                        );
                      })()}
                    </section>
                  );
                })()}

                {/* ── WRAPPER FLEX para ordenação visual (Evolução antes de Retrato) ── */}
                <div style={{display:'flex', flexDirection:'column'}}>
                {/* ── RETRATO DA ESCOLA — GRÁFICOS ── */}
                <section id="sec-retrato" className="section section-pauta" style={{ scrollMarginTop: 70, order: 2, display: hiddenSecs.has('sec-retrato') ? 'none' : undefined }}>
                  <div className="section-title">
                    <div><h2>Retrato da escola</h2><p>Perfil visual dos estudantes e evolução dos indicadores</p></div>
                  </div>
                  <div className="organic-divider" />

                  {/* ── GALERIA DE GRÁFICOS (integrada) ── */}
                  {currentChart && available.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      {/* Accent color from the first line of the current chart */}
                      {(() => {
                        const _firstLine = (currentChart.lines as any[])[0];
                        const _chartAccent: string = _firstLine?.color || '#2d5a88';

                        const pillGroups = [
                          { label: 'Censo', ids: ['matriculas', 'docentes', 'turmas'] },
                          { label: 'Qualidade', ids: ['ideb', 'saeb', 'rendimento', 'tdi', 'inse'] },
                          { label: 'Condições', ids: ['atu', 'had', 'dsu', 'icg', 'ird', 'tnr'] },
                        ];

                        return (
                          <>
                            {/* Section header — cor acompanha a dimensão ativa */}
                            <div className="cg-section-head">
                              <span className="cg-section-head-label" style={{ color: _chartAccent }}>
                                Evolução visual dos indicadores
                              </span>
                              <div
                                className="cg-section-head-line"
                                style={{ background: `linear-gradient(to right, ${_chartAccent}55, transparent)` }}
                              />
                            </div>

                            {/* Grouped pill selector */}
                            <div className="chart-pill-groups">
                              {pillGroups.map(group => {
                                const groupCharts = available.filter(c => group.ids.includes(c.id));
                                if (groupCharts.length === 0) return null;
                                return (
                                  <div className="cpg-row" key={group.label}>
                                    <span className="cpg-group-label">{group.label}</span>
                                    <div className="cpg-pills">
                                      {groupCharts.map(c => {
                                        const isActive = selectedChart === c.id;
                                        const cad = (c as any).cadencia as string | undefined;
                                        const pillAccent: string = ((c.lines as any[])[0])?.color || '#2d5a88';
                                        return (
                                          <button
                                            key={c.id}
                                            onClick={() => { setSelectedChart(c.id); setChartEtapa('total'); }}
                                            className={`cpg-pill${isActive ? ' active' : ''}`}
                                            style={isActive ? {
                                              borderColor: pillAccent,
                                              color: pillAccent,
                                              background: `${pillAccent}18`,
                                              boxShadow: `0 2px 10px ${pillAccent}30`,
                                            } : {}}
                                          >
                                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{c.icon}</span>
                                            <span>{c.label}</span>
                                            {cad && (
                                              <span className={`cpg-pill-cadencia ${cad.toLowerCase()}`}>
                                                {cad.toLowerCase()}
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}

                      {/* Chart card */}
                      {(() => {
                        const hasEtapas = !!(currentChart as any).etapas;
                        const cadencia: string | undefined = (currentChart as any).cadencia;
                        const refLines: Array<{ y: number; label: string; color?: string }> = (currentChart as any).referenceLines || [];
                        // Deduplicate available etapas by etapa key (e.g. SAEB has 2 lines per etapa)
                        const seenEtapas = new Set<string>();
                        const availableEtapas = hasEtapas ? currentChart.lines.filter((l: any) => {
                          if (!l.etapa || seenEtapas.has(l.etapa)) return false;
                          const hasVal = currentChart.data.some((d: Record<string,any>) => d[l.key] != null && Number(d[l.key]) > 0);
                          if (hasVal) { seenEtapas.add(l.etapa); return true; }
                          return false;
                        }) : [];
                        // filteredLines: by selected etapa; fallback to first available etapa if 'total' missing
                        let activeEtapa = chartEtapa;
                        let filteredLines = hasEtapas
                          ? currentChart.lines.filter((l: any) => activeEtapa === 'total' ? l.etapa === 'total' : l.etapa === activeEtapa)
                          : currentChart.lines;
                        if (hasEtapas && filteredLines.length === 0 && availableEtapas.length > 0) {
                          activeEtapa = availableEtapas[0].etapa;
                          filteredLines = currentChart.lines.filter((l: any) => l.etapa === activeEtapa);
                        }
                        const activeKeys = new Set(filteredLines.map((l: any) => l.key));
                        const yearsWithData = currentChart.data.filter((d: Record<string,any>) =>
                          Object.entries(d).some(([k, v]) => k !== 'ano' && activeKeys.has(k) && v != null && Number(v) > 0)
                        );
                        // Big stat + delta
                        const firstKey = filteredLines[0]?.key;
                        const pointsWithVal = firstKey
                          ? yearsWithData.filter((d: Record<string,any>) => d[firstKey] != null && Number(d[firstKey]) > 0)
                          : [];
                        const lastPoint = pointsWithVal[pointsWithVal.length - 1];
                        const prevPoint = pointsWithVal[pointsWithVal.length - 2];
                        const bigVal = lastPoint ? lastPoint[firstKey] : null;
                        const bigAno = lastPoint ? lastPoint.ano : latestAno;
                        const delta = bigVal != null && prevPoint ? Number(bigVal) - Number(prevPoint[firstKey]) : null;
                        const deltaYear = prevPoint ? prevPoint.ano : null;
                        const accentColor = filteredLines[0]?.color || '#2d5a88';
                        // Etapa label for chart subtitle
                        const etapaLabelEntry = availableEtapas.find((l: any) => l.etapa === activeEtapa);
                        const etapaDisplay = etapaLabelEntry ? (etapaLabelEntry.etapaLabel || etapaLabelEntry.name) : '';
                        return (
                          <div className="census-chart-card" style={{ borderLeftColor: accentColor }}>
                            {/* Header */}
                            <div className="ccc-header">
                              <div className="ccc-meta">
                                <div className="ccc-title-row">
                                  <span className="ccc-label">
                                    {currentChart.icon} {currentChart.label}{hasEtapas && etapaDisplay && activeEtapa !== 'total' ? ` — ${etapaDisplay}` : ''}
                                  </span>
                                  {cadencia && (
                                    <span style={{fontSize:'10px',fontWeight:700,padding:'2px 9px',borderRadius:'20px',background: cadencia === 'Bienal' ? '#fff3cd' : '#f3e8ff',color: cadencia === 'Bienal' ? '#7a5a00' : '#5b21b6',border: cadencia === 'Bienal' ? '1px solid #ffd97d' : '1px solid #c4b5fd',letterSpacing:'0.04em',textTransform:'uppercase'}}>
                                      {cadencia}
                                    </span>
                                  )}
                                </div>
                                <p className="ccc-desc">{currentChart.desc}</p>
                                <div className="ccc-year-chips">
                                  {yearsWithData.map((d: Record<string,any>) => (
                                    <span key={d.ano} className="ccc-year-chip">{d.ano}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="ccc-stat-box">
                                <strong className="ccc-val" style={{ color: accentColor }}>
                                  {bigVal != null ? (typeof bigVal === 'number' ? Number(bigVal).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : bigVal) : '—'}
                                </strong>
                                <span className="ccc-val-year">{bigAno}</span>
                                {delta != null && (
                                  <span className={`ccc-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'}`}>
                                    {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {Math.abs(delta).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} vs {deltaYear}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Etapa bar */}
                            {availableEtapas.length > 1 && (
                              <div className="ccc-etapa-bar">
                                <span className="ccc-etapa-bar-label">Etapa</span>
                                {availableEtapas.map((l: any) => {
                                  const isActive = activeEtapa === l.etapa;
                                  return (
                                    <button
                                      key={l.etapa}
                                      onClick={() => setChartEtapa(l.etapa)}
                                      className={`ccc-etapa-btn${isActive ? ' active' : ''}`}
                                      style={isActive ? { background: l.color } : {}}
                                    >
                                      {l.etapaLabel || l.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {/* Chart area */}
                            <div className="ccc-chart-wrap">
                              <EvolutionChart data={currentChart.data} lines={filteredLines} referenceLines={refLines} large />
                            </div>
                            {/* Footer */}
                            <div className="ccc-footer">
                              <span>Dados INEP/MEC · {selectedInep}</span>
                              {cadencia && <span className="ccc-footer-cadencia">publicação {cadencia.toLowerCase()}</span>}
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  )}
                  {/* ── PERFIL EM PIZZA — CRUZAMENTOS DO CENSO ── */}
                  {evolucaoData && (evolucaoData.anos_disponiveis as number[]).length > 0 && (() => {
                    const anosDisp = [...(evolucaoData.anos_disponiveis as number[])]
                      .filter(a => a >= 2020)
                      .sort((a,b)=>b-a);
                    const anoEfetivo = anosDisp.includes(pieAno) ? pieAno : anosDisp[0];
                    const cd = (evolucaoData.censo_por_ano as Record<number,any>)[anoEfetivo] ?? {};

                    const pct = (v: number, total: number) => total > 0 ? +((v/total)*100).toFixed(1) : 0;

                    // ── 1. ETAPAS ──
                    const etapasRaw = [
                      { name:'Ed. Infantil — Creche', v: cd.qt_mat_inf_cre ?? 0, cor:'#7eb8f7' },
                      { name:'Ed. Infantil — Pré-escola', v: cd.qt_mat_inf_pre ?? 0, cor:'#4d9de0' },
                      { name:'Fund. — Anos Iniciais', v: cd.qt_mat_fund_ai ?? 0, cor:'#3a7abf' },
                      { name:'Fund. — Anos Finais', v: cd.qt_mat_fund_af ?? 0, cor:'#2d5a88' },
                      { name:'Ensino Médio', v: cd.qt_mat_med ?? 0, cor:'#1e3d5c' },
                      { name:'EJA', v: cd.qt_mat_eja ?? 0, cor:'#e07b39' },
                      { name:'Ed. Profissional', v: cd.qt_mat_prof ?? 0, cor:'#c25e1b' },
                      { name:'Ed. Especial', v: cd.qt_mat_esp ?? 0, cor:'#9b6a16' },
                    ].filter(x => x.v > 0);
                    const etapasTotal = etapasRaw.reduce((s,x)=>s+x.v, 0);
                    const etapasData = etapasRaw.map(x=>({...x, pct:pct(x.v,etapasTotal)}));

                    // ── 2. COR/RAÇA (incluindo não declarada) ──
                    const racaNd = cd.qt_mat_bas_nd ?? cd.qt_mat_nd ?? 0;
                    const racaRaw = [
                      { name:'Branca',          v: cd.qt_mat_bas_branca  ?? cd.qt_mat_branca  ?? 0, cor:'#f5c842' },
                      { name:'Parda',           v: cd.qt_mat_bas_parda   ?? cd.qt_mat_parda   ?? 0, cor:'#c0855a' },
                      { name:'Preta',           v: cd.qt_mat_bas_preta   ?? cd.qt_mat_preta   ?? 0, cor:'#6b3a2a' },
                      { name:'Amarela',         v: cd.qt_mat_bas_amarela ?? cd.qt_mat_amarela ?? 0, cor:'#e8a030' },
                      { name:'Indígena',        v: cd.qt_mat_bas_indigena ?? cd.qt_mat_indigena ?? 0, cor:'#4a7c59' },
                      { name:'Não Declarado',   v: racaNd, cor:'#aaaaaa' },
                    ].filter(x => x.v > 0);
                    const racaTotal = racaRaw.reduce((s,x)=>s+x.v, 0);
                    const racaData = racaRaw.map(x=>({...x, pct:pct(x.v,racaTotal)}));

                    // ── 3. SEXO ──
                    const sexoRaw = [
                      { name:'Feminino', v: cd.qt_mat_bas_fem ?? 0, cor:'#9b6a16' },
                      { name:'Masculino', v: cd.qt_mat_bas_masc ?? 0, cor:'#2f7a58' },
                    ].filter(x => x.v > 0);
                    const sexoTotal = sexoRaw.reduce((s,x)=>s+x.v, 0);
                    const sexoData = sexoRaw.map(x=>({...x, pct:pct(x.v,sexoTotal)}));

                    // ── 4. FAIXA ETÁRIA ──
                    const etariaRaw = [
                      { name:'0 a 3 anos', v: cd.qt_mat_bas_0_3 ?? 0, cor:'#b5d7f5' },
                      { name:'4 a 5 anos', v: cd.qt_mat_bas_4_5 ?? 0, cor:'#7eb8f7' },
                      { name:'6 a 10 anos', v: cd.qt_mat_bas_6_10 ?? 0, cor:'#4d9de0' },
                      { name:'11 a 14 anos', v: cd.qt_mat_bas_11_14 ?? 0, cor:'#2d70c0' },
                      { name:'15 a 17 anos', v: cd.qt_mat_bas_15_17 ?? 0, cor:'#1a4a8a' },
                      { name:'18 anos ou mais', v: cd.qt_mat_bas_18_mais ?? 0, cor:'#0f2f5c' },
                    ].filter(x => x.v > 0);
                    const etariaTotal = etariaRaw.reduce((s,x)=>s+x.v, 0);
                    const etariaData = etariaRaw.map(x=>({...x, pct:pct(x.v,etariaTotal)}));

                    // ── 5. TURNO ──
                    const turnoRaw = [
                      { name:'Diurno', v: cd.qt_mat_bas_d ?? 0, cor:'#f5c842' },
                      { name:'Noturno', v: cd.qt_mat_bas_n ?? 0, cor:'#2d3a70' },
                      { name:'EAD', v: cd.qt_mat_bas_ead ?? 0, cor:'#7b9a6a' },
                    ].filter(x => x.v > 0);
                    const turnoTotal = turnoRaw.reduce((s,x)=>s+x.v, 0);
                    const turnoData = turnoRaw.map(x=>({...x, pct:pct(x.v,turnoTotal)}));

                    // ── 6. TEMPO INTEGRAL ──
                    const totalMat = etapasTotal;
                    const totalInt = (cd.qt_mat_inf_int ?? 0) + (cd.qt_mat_fund_ai_int ?? 0) + (cd.qt_mat_fund_af_int ?? 0) + (cd.qt_mat_med_int ?? 0);
                    const totalParcial = totalMat - totalInt;
                    const integralRaw = [
                      { name:'Tempo integral', v: totalInt, cor:'#2f7a58' },
                      { name:'Parcial', v: totalParcial > 0 ? totalParcial : 0, cor:'#cce4d8' },
                    ].filter(x => x.v > 0);
                    const integralTotal = integralRaw.reduce((s,x)=>s+x.v,0);
                    const integralData = integralRaw.map(x=>({...x, pct:pct(x.v,integralTotal)}));

                    // ── 7. TEMPO INTEGRAL POR ETAPA ──
                    const intEtapasRaw = [
                      { name:'Ed. Infantil', v: cd.qt_mat_inf_int ?? 0, cor:'#b5d7f5' },
                      { name:'Fund. Anos Iniciais', v: cd.qt_mat_fund_ai_int ?? 0, cor:'#4d9de0' },
                      { name:'Fund. Anos Finais', v: cd.qt_mat_fund_af_int ?? 0, cor:'#2d5a88' },
                      { name:'Ensino Médio', v: cd.qt_mat_med_int ?? 0, cor:'#1e3d5c' },
                    ].filter(x => x.v > 0);
                    const intEtapasTotal = intEtapasRaw.reduce((s,x)=>s+x.v,0);
                    const intEtapasData = intEtapasRaw.map(x=>({...x, pct:pct(x.v,intEtapasTotal)}));

                    // ── 8. SALAS CLIMATIZADAS ──
                    const qtSalas = cd.qt_salas_utilizadas ?? 0;
                    const qtClim = cd.qt_salas_utiliza_climatizadas ?? 0;
                    const salaClimRaw = [
                      { name:'Climatizadas', v: qtClim, cor:'#4d9de0' },
                      { name:'Não climatizadas', v: qtSalas - qtClim > 0 ? qtSalas - qtClim : 0, cor:'#e8dfc8' },
                    ].filter(x => x.v > 0);
                    const salaClimTotal = salaClimRaw.reduce((s,x)=>s+x.v,0);
                    const salaClimData = salaClimRaw.map(x=>({...x, pct:pct(x.v,salaClimTotal)}));

                    // ── 9. SALAS ACESSÍVEIS ──
                    const qtAcess = cd.qt_salas_utilizadas_acessiveis ?? 0;
                    const salaAcessRaw = [
                      { name:'Acessíveis', v: qtAcess, cor:'#2f7a58' },
                      { name:'Não acessíveis', v: qtSalas - qtAcess > 0 ? qtSalas - qtAcess : 0, cor:'#e8dfc8' },
                    ].filter(x => x.v > 0);
                    const salaAcessTotal = salaAcessRaw.reduce((s,x)=>s+x.v,0);
                    const salaAcessData = salaAcessRaw.map(x=>({...x, pct:pct(x.v,salaAcessTotal)}));

                    // ── 10. EJA POR ETAPA ──
                    const ejaRaw = [
                      { name:'EJA Fundamental', v: cd.qt_mat_eja_fund ?? 0, cor:'#6d4c41' },
                      { name:'EJA Médio', v: cd.qt_mat_eja_med ?? 0, cor:'#4e342e' },
                    ].filter(x => x.v > 0);
                    const ejaTotal = ejaRaw.reduce((s,x)=>s+x.v,0);
                    const ejaData = ejaRaw.map(x=>({...x, pct:pct(x.v,ejaTotal)}));

                    // ── 11. ED. ESPECIAL — MODALIDADE (inclusão vs exclusiva) ──
                    const espRaw = [
                      { name:'Classes comuns (inclusão)', v: cd.qt_mat_esp_cc ?? 0, cor:'#5c8a6e' },
                      { name:'Classes exclusivas', v: cd.qt_mat_esp_ce ?? 0, cor:'#9b6a16' },
                    ].filter(x => x.v > 0);
                    const espTotal = espRaw.reduce((s,x)=>s+x.v,0);
                    const espData = espRaw.map(x=>({...x, pct:pct(x.v,espTotal)}));


                    // ── 12. ZONA DE RESIDÊNCIA DO ALUNO ──
                    const zonaRaw = [
                      { name:'Zona urbana', v: cd.qt_mat_zr_urba ?? 0, cor:'#4d9de0' },
                      { name:'Zona rural',  v: cd.qt_mat_zr_rura ?? 0, cor:'#7b9a6a' },
                    ].filter(x => x.v > 0);
                    const zonaTotal = zonaRaw.reduce((s,x)=>s+x.v,0);
                    const zonaData = zonaRaw.map(x=>({...x, pct:pct(x.v,zonaTotal)}));

                    // ── BADGES DE MODALIDADE ESPECIAL ──
                    const isActive = (v: any) => v === 1 || v === true || v === 'Sim';
                    const modalBadges = [
                      { key: 'in_educacao_indigena',   label: 'Escola Indígena',   cor:'#4a7c59', bg:'#e8f4ec' },
                      { key: 'in_educacao_quilombola', label: 'Escola Quilombola', cor:'#6b3a2a', bg:'#f4ece8' },
                      { key: 'in_educacao_campo',      label: 'Educação do Campo', cor:'#7b9a6a', bg:'#eff4eb' },
                    ].filter(b => isActive(cd[b.key]));

                    // ── BADGES DE IDIOMAS OFERTADOS ──
                    const idiomaBadges = [
                      { key: 'in_lingua_ingles',        label: 'Inglês' },
                      { key: 'in_lingua_espanhol',      label: 'Espanhol' },
                      { key: 'in_lingua_frances',       label: 'Francês' },
                      { key: 'in_lingua_libras',        label: 'Libras' },
                      { key: 'in_lingua_indigena',      label: 'Língua Indígena' },
                      { key: 'in_lingua_outra_estrang', label: 'Outro idioma' },
                    ].filter(b => isActive(cd[b.key]));

                    type PieSlice = { name:string; v:number; cor:string; pct:number };

                    const PizzaCard = ({ title, data, noDataMsg, nota }: { title:string; data:PieSlice[]; noDataMsg?:string; nota?:string }) => {
                      if (data.length === 1) return null;
                      if (data.length === 0 || data.every(d=>d.v===0)) return (
                        <div style={{ background:'#faf7f2', border:'1px solid #ede8df', borderRadius:12, padding:'18px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:220, gap:8 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#b0a090' }}>{title}</span>
                          <span style={{ fontSize:12, color:'#c0b0a0' }}>{noDataMsg ?? 'Sem dados para este ano'}</span>
                        </div>
                      );
                      const RADIAN = Math.PI / 180;
                      const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct: p }: any) => {
                        if (p < 4) return null;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{p}%</text>;
                      };
                      return (
                        <div style={{ background:'white', border:'1px solid #ede8df', borderRadius:12, padding:'16px 18px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:'#4a3020', letterSpacing:'-0.01em' }}>{title}</div>
                          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                            <div style={{ flexShrink:0 }}>
                              <PieChart width={150} height={150}>
                                <Pie data={data} dataKey="v" cx="50%" cy="50%" outerRadius={68} labelLine={false} label={renderLabel}>
                                  {data.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                                </Pie>
                                <Tooltip formatter={(val: any, name: string) => [`${val.toLocaleString('pt-BR')} (${data.find(d=>d.name===name)?.pct}%)`, name]} />
                              </PieChart>
                            </div>
                            <div style={{ flex:1, minWidth:120, display:'flex', flexDirection:'column', gap:5 }}>
                              {data.map((d,i) => (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                                  <div style={{ width:10, height:10, borderRadius:2, background:d.cor, flexShrink:0 }} />
                                  <span style={{ fontSize:12, color:'#5a4030', flex:1, lineHeight:1.3 }}>{d.name}</span>
                                  <span style={{ fontSize:12, fontWeight:700, color:'#2c3e50', flexShrink:0 }}>{d.pct}%</span>
                                </div>
                              ))}
                              {nota && <div style={{ fontSize:10, color:'#a09080', marginTop:4, lineHeight:1.4 }}>{nota}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div style={{ marginBottom:24 }}>
                        <div className="cg-section-head" style={{ marginBottom:14 }}>
                          <span className="cg-section-head-label" style={{ color:'#5d4037' }}>
                            Perfil dos estudantes — {anoEfetivo}
                          </span>
                          <div className="cg-section-head-line" style={{ background:'linear-gradient(to right,#5d403744,transparent)' }} />
                          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                            {anosDisp.map(a => (
                              <button key={a}
                                onClick={() => setPieAno(a)}
                                style={{
                                  padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight: a===anoEfetivo ? 700 : 500, cursor:'pointer',
                                  border: `1.5px solid ${a===anoEfetivo ? '#5d4037' : '#ddd6c8'}`,
                                  background: a===anoEfetivo ? '#5d4037' : 'white',
                                  color: a===anoEfetivo ? 'white' : '#9a7a5a',
                                  transition:'all 0.12s',
                                }}
                              >{a}</button>
                            ))}
                          </div>
                        </div>
                        {(modalBadges.length > 0 || idiomaBadges.length > 0) && (
                          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                            {modalBadges.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                                {modalBadges.map(b => (
                                  <span key={b.key} style={{ display:'inline-flex', alignItems:'center', gap:5, background:b.bg, color:b.cor, border:`1.5px solid ${b.cor}55`, borderRadius:20, padding:'4px 14px', fontSize:13, fontWeight:700 }}>
                                    ★ {b.label}
                                  </span>
                                ))}
                              </div>
                            )}
                            {idiomaBadges.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center' }}>
                                <span style={{ fontSize:11, fontWeight:700, color:'#9a8070', textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0 }}>Idiomas ofertados:</span>
                                {idiomaBadges.map(b => (
                                  <span key={b.key} style={{ display:'inline-flex', alignItems:'center', background:'#f0ebf8', color:'#5b3fa0', border:'1.5px solid #c4aee855', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:600 }}>
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
                          <PizzaCard title="Matrículas por etapa de ensino" data={etapasData} />
                          <PizzaCard title="Cor / Raça dos estudantes" data={racaData} />
                          <PizzaCard title="Distribuição por sexo" data={sexoData} />
                          <PizzaCard title="Faixa etária" data={etariaData} />
                          <PizzaCard title="Turno de atendimento" data={turnoData} />
                          <PizzaCard title="Tempo integral vs parcial" data={integralData}
                            noDataMsg="Escola sem dados de tempo integral" />
                          <PizzaCard title="Tempo integral por etapa" data={intEtapasData}
                            noDataMsg="Escola sem alunos em tempo integral" />
                          <PizzaCard title="Salas de aula — climatização" data={salaClimData}
                            noDataMsg="Sem dados de salas para este ano" />
                          <PizzaCard title="Salas de aula — acessibilidade" data={salaAcessData}
                            noDataMsg="Sem dados de salas para este ano" />
                          <PizzaCard title="EJA — Fundamental vs Médio" data={ejaData}
                            noDataMsg="Escola sem matrícula EJA" />
                          <PizzaCard title="Ed. Especial — modalidade de atendimento" data={espData}
                            noDataMsg="Escola sem dados de Ed. Especial" />
                          <PizzaCard title="Zona de residência dos alunos" data={zonaData}
                            noDataMsg="Dado não disponível no Censo importado" />
                        </div>
                      </div>
                    );
                  })()}

                </section>

                {/* ── EVOLUÇÃO DO CENSO ESCOLAR ── */}
                <section id="sec-evolucao-censo" className="section section-pauta" style={{ scrollMarginTop: 70, order: 1, display: hiddenSecs.has('sec-evolucao-censo') ? 'none' : undefined }}>
                  <div className="section-title">
                    <div><h2>Evolução do Censo Escolar</h2><p>Dados detalhados por dimensão — infraestrutura, tecnologia, equidade e mais</p></div>
                  </div>
                  <div className="organic-divider" />

                  <div className="soft-card" style={{padding:0,overflow:'hidden'}}>
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, 'censo-dims': !prev['censo-dims'] }))}
                      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#faf7f2', border:'none', borderBottom: expandedSections['censo-dims'] ? '2px solid #e8e0d0' : '1px solid #ede8df', cursor:'pointer' }}
                    >
                      <span style={{fontWeight:700, fontSize:14, color:'#5d4037', display:'flex', alignItems:'center', gap:8}}>
                        <ClipboardList size={14} /> Dados detalhados por dimensão
                      </span>
                      {expandedSections['censo-dims'] ? <ChevronUp size={16} color="#9a7a5a" /> : <ChevronDown size={16} color="#9a7a5a" />}
                    </button>
                    {expandedSections['censo-dims'] && (
                    <>

                    {/* ── NAVEGAÇÃO: 3 CAMADAS × 10 DIMENSÕES ── */}
                    <div style={{background:'#faf7f2', borderBottom:'2px solid #e8e0d0'}}>
                      {([
                        {
                          label: 'Camada 1 — Estrutura da Escola',
                          color: '#e8f0fb', activeColor: '#2d5a88', borderColor:'#b8cde8',
                          dims: [
                            { key:'dim1', label:'Infraestrutura' },
                            { key:'dim2', label:'Tecnologia' },
                            { key:'dim3', label:'Segurança' },
                            { key:'dim4', label:'Sustentabilidade' },
                          ],
                        },
                        {
                          label: 'Camada 2 — Pessoas e Inclusão',
                          color: '#edf7ee', activeColor: '#2f7a58', borderColor:'#b8dcca',
                          dims: [
                            { key:'dim5', label:'Inclusão' },
                            { key:'dim6', label:'Equidade Social' },
                            { key:'dim7', label:'Participação' },
                          ],
                        },
                        {
                          label: 'Camada 3 — Organização e Funcionamento',
                          color: '#faf3e8', activeColor: '#9b6a16', borderColor:'#dfc99a',
                          dims: [
                            { key:'dim8', label:'Gestão' },
                            { key:'dim9', label:'Docentes' },
                            { key:'dim10', label:'Oferta' },
                          ],
                        },
                      ] as const).map((camada, ci) => {
                        const isActive = camada.dims.some(d => d.key === activeSchoolTab);
                        return (
                          <div key={ci} style={{
                            background: isActive ? camada.color : '#faf7f2',
                            borderBottom: ci < 2 ? '1px solid #e8e0d0' : 'none',
                            padding:'8px 16px 10px',
                            transition:'background 0.15s',
                          }}>
                            <div style={{fontSize:10,fontWeight:800,color:'#9a7a5a',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{camada.label}</div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                              {camada.dims.map(dim => {
                                const active = activeSchoolTab === dim.key;
                                return (
                                  <button key={dim.key} onClick={() => setActiveSchoolTab(dim.key as any)} style={{
                                    padding:'6px 14px',
                                    border:`1.5px solid ${active ? camada.activeColor : camada.borderColor}`,
                                    borderRadius:20,
                                    fontSize:13,
                                    fontWeight: active ? 700 : 500,
                                    background: active ? camada.activeColor : 'white',
                                    color: active ? 'white' : '#5d4037',
                                    cursor:'pointer',
                                    transition:'all 0.12s',
                                    whiteSpace:'nowrap',
                                  }}>{dim.label}</button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const anos = evolucaoData.anos_disponiveis.slice().sort((a: number, b: number) => a - b).filter((a: number) => a >= 2020);
                      const c = evolucaoData.censo_por_ano;
                      type Row = { label: string; key: string; header?: boolean };

                      // ── COR DA CAMADA ATIVA ──
                      const dimColorMap: Record<string, string> = {
                        dim1: '#2d5a88', dim2: '#2d5a88', dim3: '#2d5a88', dim4: '#2d5a88',
                        dim5: '#2f7a58', dim6: '#2f7a58', dim7: '#2f7a58',
                        dim8: '#9b6a16', dim9: '#9b6a16', dim10: '#9b6a16',
                      };
                      const dimColor = dimColorMap[activeSchoolTab as string] || '#2d5a88';

                      // ── COMPONENTE: cabeçalho da dimensão ──
                      const DimHeader = ({ num, icon, title, desc, index: idx2 }: { num: number; icon: React.ReactNode; title: string; desc: string; index: string }) => (
                        <div style={{ padding: '14px 20px 14px 22px', borderBottom: '1px solid #eee8db', background: `${dimColor}0f`, borderLeft: `5px solid ${dimColor}`, display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
                          <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: dimColor, letterSpacing: '-0.02em' }}>Dimensão {num} — {title}</div>
                            <div style={{ fontSize: 12, color: '#8a7a6a', marginTop: 2 }}>{desc} · <span style={{ fontWeight: 600 }}>Índice: {idx2}</span></div>
                          </div>
                        </div>
                      );

                      // ── ESTILOS DE SUMMARY COMPARTILHADOS ──
                      const summaryStyle: React.CSSProperties = {
                        padding: '11px 20px', fontWeight: 700, fontSize: 13, color: dimColor,
                        background: `${dimColor}0d`, borderBottom: '1px solid #ede8df',
                        cursor: 'pointer', userSelect: 'none', listStyle: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      };

                      // ── COMPONENTE: tabela numérica (evoluções quantitativas) ──
                      const NumTable = ({ rows, title }: { rows: Row[]; title?: string }) => {
                        const tableBody = (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                              <thead>
                                <tr style={{ background: `${dimColor}18` }}>
                                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 700, color: dimColor, fontSize: 12, minWidth: 220, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Indicador</th>
                                  {anos.map((a: number, ai: number) => (
                                    <th key={a} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: dimColor, fontSize: 12, minWidth: 70, background: ai === anos.length - 1 ? `${dimColor}28` : undefined }}>
                                      {a}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, rowIdx) => {
                                  if (row.header) return (
                                    <tr key={rowIdx}>
                                      <td colSpan={anos.length + 1} style={{ padding: '8px 20px', background: `${dimColor}20`, fontWeight: 800, fontSize: 11, color: dimColor, textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: `2px solid ${dimColor}40` }}>
                                        {row.label}
                                      </td>
                                    </tr>
                                  );
                                  const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                                  if (vals.every((v: any) => v == null || v === 0)) return null;
                                  return (
                                    <tr key={rowIdx} style={{ borderTop: '1px solid #f0e8d8', background: rowIdx % 2 === 0 ? '#fff' : '#fdf9f4' }}>
                                      <td style={{ padding: '9px 20px', color: '#4a3020', fontWeight: 500, fontSize: 13 }}>{row.label}</td>
                                      {vals.map((v: any, vi: number) => {
                                        const prev = vi > 0 ? vals[vi - 1] : null;
                                        const delta = v != null && prev != null ? v - prev : null;
                                        const isLatest = vi === anos.length - 1;
                                        return (
                                          <td key={vi} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: isLatest ? 700 : 500, color: '#2c3e50', verticalAlign: 'top', background: isLatest ? '#fdf5e6' : undefined }}>
                                            {v != null ? v.toLocaleString('pt-BR') : <span style={{ color: '#ccc' }}>—</span>}
                                            {delta != null && delta !== 0 && (
                                              <div style={{ fontSize: 10, lineHeight: 1.3, marginTop: 1, fontWeight: 700, color: delta > 0 ? '#16714a' : '#b74f42' }}>
                                                {delta > 0 ? '▲ ' : '▼ '}{Math.abs(delta).toLocaleString('pt-BR')}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                        const hasData = rows.some(row => {
                          if (row.header) return false;
                          const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                          return !vals.every((v: any) => v == null || v === 0);
                        });
                        if (title) {
                          if (!hasData) {
                            const noDataLabels = rows.filter(r => !r.header).map(r => r.label);
                            return (
                              <div style={{ padding:'10px 20px', background:'#f7f6f3', borderBottom:'1px dashed #ddd6c8', marginBottom:4, opacity:0.6, cursor:'default' }}>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: noDataLabels.length > 0 ? 5 : 0 }}>
                                  <span style={{ fontWeight:700, fontSize:13, color:'#c0b8ae' }}>{title}</span>
                                  <span style={{ fontSize:10, fontWeight:700, color:'#c8c0b8', background:'#eae8e4', padding:'2px 9px', borderRadius:20, letterSpacing:'0.05em', textTransform:'uppercase' }}>sem dados</span>
                                </div>
                                {noDataLabels.length > 0 && (
                                  <p style={{ margin:0, fontSize:11, color:'#c0b8ae', lineHeight:'1.6' }}>
                                    {noDataLabels.join(' · ')}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return (
                            <details style={{ borderBottom:'1px solid #ede8df', marginBottom:4 }}>
                              <summary style={summaryStyle}><span>{title}</span><span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>clique para ver ▾</span></summary>
                              {tableBody}
                            </details>
                          );
                        }
                        if (!hasData) return null;
                        return <div style={{ borderBottom:'1px solid #ede8df', marginBottom:4 }}>{tableBody}</div>;
                      };

                      // ── COMPONENTE: tabela binária (sim/não) ──
                      const BinTable = ({ rows, title }: { rows: Row[]; title?: string }) => {
                        // Pre-process: separate rows the school HAS (latest=1) from those it DOESN'T HAVE (latest=0)
                        // Group "sem" items into compact summary lines, flushed before each new section header
                        type EnrichedRow =
                          | { kind: 'header'; label: string }
                          | { kind: 'data'; row: Row; vals: (number | null)[] }
                          | { kind: 'sem'; labels: string[] };
                        const enriched: EnrichedRow[] = [];
                        let semBuf: string[] = [];
                        const flushSem = () => {
                          if (semBuf.length > 0) { enriched.push({ kind: 'sem', labels: [...semBuf] }); semBuf = []; }
                        };
                        for (const row of rows) {
                          if (row.header) { flushSem(); enriched.push({ kind: 'header', label: row.label }); continue; }
                          const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                          if (vals.every((v: any) => v == null)) continue;
                          const latestVal = [...vals].reverse().find((v: any) => v != null);
                          if (latestVal === 1) {
                            enriched.push({ kind: 'data', row, vals });
                          } else {
                            semBuf.push(row.label);
                          }
                        }
                        flushSem();

                        const tableBody = (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                              <thead>
                                <tr style={{ background: `${dimColor}18` }}>
                                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 700, color: dimColor, fontSize: 12, minWidth: 220, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Indicador</th>
                                  {anos.map((a: number, ai: number) => (
                                    <th key={a} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: dimColor, fontSize: 12, minWidth: 70, background: ai === anos.length - 1 ? `${dimColor}28` : undefined }}>{a}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {enriched.map((er, idx) => {
                                  if (er.kind === 'header') return (
                                    <tr key={idx}>
                                      <td colSpan={anos.length + 1} style={{ padding: '8px 20px', background: `${dimColor}20`, fontWeight: 800, fontSize: 11, color: dimColor, textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: `2px solid ${dimColor}40` }}>
                                        {er.label}
                                      </td>
                                    </tr>
                                  );
                                  if (er.kind === 'sem') return (
                                    <tr key={idx} style={{ borderTop: '1px solid #f0e8d8', background: '#faf8f4' }}>
                                      <td colSpan={anos.length + 1} style={{ padding: '7px 20px', fontSize: 12, color: '#9a8878' }}>
                                        <span style={{ fontWeight: 700, color: '#7a6858', marginRight: 4 }}>Sem:</span>
                                        {er.labels.map((lbl, li) => {
                                          const clean = lbl.replace(/^.*?—\s*/, '');
                                          return <span key={li}>{li > 0 && <span style={{ color: '#ccc', margin: '0 4px' }}>·</span>}{clean}</span>;
                                        })}
                                      </td>
                                    </tr>
                                  );
                                  const { vals } = er;
                                  return (
                                    <tr key={idx} style={{ borderTop: '1px solid #f0e8d8', background: idx % 2 === 0 ? '#fff' : '#fdf9f4' }}>
                                      <td style={{ padding: '9px 20px', color: '#4a3020', fontWeight: 500, fontSize: 13 }}>{er.row.label}</td>
                                      {vals.map((v: any, vi: number) => {
                                        const isLatest = vi === anos.length - 1;
                                        return (
                                          <td key={vi} style={{ padding: '9px 12px', textAlign: 'center', verticalAlign: 'middle', background: isLatest && v === 1 ? '#f0faf4' : undefined }}>
                                            {v === 1 ? (
                                              <span style={{ fontSize: 18, color: '#16714a', lineHeight: 1 }}>✓</span>
                                            ) : v === 0 ? (
                                              <span style={{ fontSize: 15, color: '#ddd5c8', lineHeight: 1 }}>✗</span>
                                            ) : (
                                              <span style={{ color: '#ddd', fontSize: 13 }}>—</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                        const hasData = enriched.some(er => er.kind === 'data');
                        const semLabels = enriched.filter(er => er.kind === 'sem').flatMap((er: any) => er.labels as string[]);
                        if (title) {
                          if (!hasData) return (
                            <div style={{ padding:'10px 20px', background:'#f7f6f3', borderBottom:'1px dashed #ddd6c8', marginBottom:4, opacity:0.6, cursor:'default' }}>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: semLabels.length > 0 ? 5 : 0 }}>
                                <span style={{ fontWeight:700, fontSize:13, color:'#c0b8ae' }}>{title}</span>
                                <span style={{ fontSize:10, fontWeight:700, color:'#c8c0b8', background:'#eae8e4', padding:'2px 9px', borderRadius:20, letterSpacing:'0.05em', textTransform:'uppercase' }}>sem dados</span>
                              </div>
                              {semLabels.length > 0 && (
                                <p style={{ margin:0, fontSize:11, color:'#c0b8ae', lineHeight:'1.6' }}>
                                  <span style={{ fontWeight:700 }}>Sem: </span>{semLabels.join(' · ')}
                                </p>
                              )}
                            </div>
                          );
                          return (
                            <details style={{ borderBottom:'1px solid #ede8df', marginBottom:4 }}>
                              <summary style={summaryStyle}><span>{title}</span><span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>clique para ver ▾</span></summary>
                              {tableBody}
                            </details>
                          );
                        }
                        if (!hasData) return null;
                        return <div style={{ borderBottom:'1px solid #ede8df', marginBottom:4 }}>{tableBody}</div>;
                      };

                      // ── COMPONENTE: tabela de texto (campos descritivos, ex.: perfil do gestor) ──
                      const TextTable = ({ rows, title }: { rows: Row[]; title?: string }) => {
                        const tableBody = (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                              <thead>
                                <tr style={{ background: `${dimColor}18` }}>
                                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 700, color: dimColor, fontSize: 12, minWidth: 220, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Campo</th>
                                  {anos.map((a: number, ai: number) => (
                                    <th key={a} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: dimColor, fontSize: 12, minWidth: 120, background: ai === anos.length - 1 ? `${dimColor}28` : undefined }}>{a}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, rowIdx) => {
                                  const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                                  if (vals.every((v: any) => v == null)) return null;
                                  return (
                                    <tr key={rowIdx} style={{ borderTop: '1px solid #f0e8d8', background: rowIdx % 2 === 0 ? '#fff' : '#fdf9f4' }}>
                                      <td style={{ padding: '9px 20px', color: '#4a3020', fontWeight: 500, fontSize: 13 }}>{row.label}</td>
                                      {vals.map((v: any, vi: number) => (
                                        <td key={vi} style={{ padding: '9px 12px', fontWeight: vi === anos.length - 1 ? 700 : 400, color: '#2c3e50', background: vi === anos.length - 1 ? '#fdf5e6' : undefined }}>
                                          {v != null ? String(v) : <span style={{ color: '#ccc' }}>—</span>}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                        const hasData = rows.some(row => {
                          const vals = anos.map((a: number) => c[a]?.[row.key] ?? null);
                          return !vals.every((v: any) => v == null);
                        });
                        if (title) {
                          if (!hasData) {
                            const noDataLabels = rows.map(r => r.label);
                            return (
                              <div style={{ padding:'10px 20px', background:'#f7f6f3', borderBottom:'1px dashed #ddd6c8', marginBottom:4, opacity:0.6, cursor:'default' }}>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: noDataLabels.length > 0 ? 5 : 0 }}>
                                  <span style={{ fontWeight:700, fontSize:13, color:'#c0b8ae' }}>{title}</span>
                                  <span style={{ fontSize:10, fontWeight:700, color:'#c8c0b8', background:'#eae8e4', padding:'2px 9px', borderRadius:20, letterSpacing:'0.05em', textTransform:'uppercase' }}>sem dados</span>
                                </div>
                                {noDataLabels.length > 0 && (
                                  <p style={{ margin:0, fontSize:11, color:'#c0b8ae', lineHeight:'1.6' }}>
                                    {noDataLabels.join(' · ')}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return (
                            <details style={{ borderBottom:'1px solid #ede8df', marginBottom:4 }}>
                              <summary style={summaryStyle}><span>{title}</span><span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>clique para ver ▾</span></summary>
                              {tableBody}
                            </details>
                          );
                        }
                        if (!hasData) return null;
                        return <div style={{ borderBottom:'1px solid #ede8df', marginBottom:4 }}>{tableBody}</div>;
                      };

                      // ── DIM 1: INFRAESTRUTURA ──
                      if (activeSchoolTab === 'dim1') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={1} icon={<Wrench size={24} />} title="Infraestrutura" desc="Estrutura física, espaços e serviços da escola" index="Índice de Infraestrutura" />
                          <NumTable title="Salas de Aula" rows={[
                            { label: 'Salas utilizadas (total)', key: 'qt_salas_utilizadas' },
                            { label: 'Salas climatizadas', key: 'qt_salas_utiliza_climatizadas' },
                            { label: 'Salas acessíveis (PNE)', key: 'qt_salas_utilizadas_acessiveis' },
                          ]} />
                          <BinTable title="Água e Saneamento" rows={[
                            { label: 'Água potável', key: 'in_agua_potavel' },
                            { label: 'Água — Rede pública', key: 'in_agua_rede_publica' },
                            { label: 'Água — Poço artesiano', key: 'in_agua_poco_artesiano' },
                            { label: 'Água — Cacimba/cisterna', key: 'in_agua_cacimba' },
                            { label: 'Água — Rio/fonte/igarapé', key: 'in_agua_fonte_rio' },
                            { label: 'Água — Carro pipa', key: 'in_agua_carro_pipa' },
                            { label: 'Água — Inexistente', key: 'in_agua_inexistente' },
                            { label: 'Esgoto — Rede pública', key: 'in_esgoto_rede_publica' },
                            { label: 'Esgoto — Fossa séptica', key: 'in_esgoto_fossa_septica' },
                            { label: 'Esgoto — Fossa comum', key: 'in_esgoto_fossa_comum' },
                            { label: 'Esgoto — Inexistente', key: 'in_esgoto_inexistente' },
                            { label: 'Lixo — Coleta pública', key: 'in_lixo_servico_coleta' },
                            { label: 'Lixo — Queima', key: 'in_lixo_queima' },
                            { label: 'Lixo — Enterra', key: 'in_lixo_enterra' },
                          ]} />
                          <BinTable title="Energia" rows={[
                            { label: 'Energia — Rede pública', key: 'in_energia_rede_publica' },
                            { label: 'Energia — Gerador a diesel', key: 'in_energia_gerador_fossil' },
                            { label: 'Energia — Renovável (solar etc.)', key: 'in_energia_renovavel' },
                            { label: 'Energia — Inexistente', key: 'in_energia_inexistente' },
                          ]} />
                          <BinTable title="Banheiros e Higiene" rows={[
                            { label: 'Banheiro', key: 'in_banheiro' },
                            { label: 'Banheiro com chuveiro', key: 'in_banheiro_chuveiro' },
                            { label: 'Banheiro para funcionários', key: 'in_banheiro_funcionarios' },
                            { label: 'Banheiro acessível (PNE)', key: 'in_banheiro_pne' },
                            { label: 'Banheiro para Ed. Infantil', key: 'in_banheiro_ei' },
                          ]} />
                          <BinTable title="Alimentação" rows={[
                            { label: 'Cozinha', key: 'in_cozinha' },
                            { label: 'Refeitório', key: 'in_refeitorio' },
                            { label: 'Despensa', key: 'in_despensa' },
                            { label: 'Almoxarifado', key: 'in_almoxarifado' },
                          ]} />
                          <BinTable title="Espaços de Aprendizagem" rows={[
                            { label: 'Biblioteca', key: 'in_biblioteca' },
                            { label: 'Sala de leitura', key: 'in_biblioteca_sala_leitura' },
                            { label: 'Lab. de informática', key: 'in_laboratorio_informatica' },
                            { label: 'Lab. de ciências', key: 'in_laboratorio_ciencias' },
                            { label: 'Lab. Ed. Profissional', key: 'in_laboratorio_educ_prof' },
                            { label: 'Sala AEE (Atend. Especializado)', key: 'in_sala_atendimento_especial' },
                            { label: 'Sala multiuso', key: 'in_sala_multiuso' },
                            { label: 'Ateliê de artes', key: 'in_sala_atelie_artes' },
                            { label: 'Sala de música/coral', key: 'in_sala_musica_coral' },
                            { label: 'Estúdio de dança', key: 'in_sala_estudio_danca' },
                            { label: 'Estúdio de gravação', key: 'in_sala_estudio_gravacao' },
                            { label: 'Sala de repouso de alunos', key: 'in_sala_repouso_aluno' },
                          ]} />
                          <BinTable title="Espaços Administrativos" rows={[
                            { label: 'Sala dos professores', key: 'in_sala_professor' },
                            { label: 'Sala de diretoria', key: 'in_sala_diretoria' },
                            { label: 'Secretaria', key: 'in_secretaria' },
                          ]} />
                          <BinTable title="Esportes e Lazer" rows={[
                            { label: 'Pátio coberto', key: 'in_patio_coberto' },
                            { label: 'Pátio descoberto', key: 'in_patio_descoberto' },
                            { label: 'Quadra coberta', key: 'in_quadra_esportes_coberta' },
                            { label: 'Quadra descoberta', key: 'in_quadra_esportes_descoberta' },
                            { label: 'Parque infantil', key: 'in_parque_infantil' },
                            { label: 'Piscina', key: 'in_piscina' },
                            { label: 'Auditório', key: 'in_auditorio' },
                            { label: 'Dormitório de alunos (internato)', key: 'in_dormitorio_aluno' },
                            { label: 'Dormitório de professores', key: 'in_dormitorio_professor' },
                          ]} />
                        </div>
                      );

                      // ── DIM 2: TECNOLOGIA E CONECTIVIDADE ──
                      if (activeSchoolTab === 'dim2') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={2} icon={<Laptop size={24} />} title="Tecnologia e Conectividade" desc="Acesso digital e equipamentos tecnológicos" index="Índice de Equidade Digital" />
                          <BinTable title="Conectividade" rows={[
                            { label: 'Internet (qualquer)', key: 'in_internet' },
                            { label: 'Internet para uso administrativo', key: 'in_internet_administrativo' },
                            { label: 'Internet para uso dos alunos', key: 'in_internet_alunos' },
                            { label: 'Banda larga', key: 'in_banda_larga' },
                            { label: 'Rede local (intranet)', key: 'in_rede_local' },
                            { label: 'Wi-Fi', key: 'in_wifi' },
                          ]} />
                          <NumTable title="Dispositivos — Alunos" rows={[
                            { label: 'Desktops para alunos', key: 'qt_desktop_aluno' },
                            { label: 'Notebooks/portáteis para alunos', key: 'qt_comp_portatil_aluno' },
                            { label: 'Tablets para alunos', key: 'qt_tablet_aluno' },
                          ]} />
                          <NumTable title="Dispositivos — Administrativo" rows={[
                            { label: 'Desktops administrativos', key: 'qt_desktop_adm' },
                            { label: 'Notebooks administrativos', key: 'qt_comp_portatil_adm' },
                          ]} />
                          <NumTable title="Equipamentos Multimídia" rows={[
                            { label: 'TVs', key: 'qt_equip_tv' },
                            { label: 'Projetor/Multimídia', key: 'qt_equip_multimidia' },
                            { label: 'Lousa digital', key: 'qt_equip_lousa_digital' },
                            { label: 'Aparelhos de som', key: 'qt_equip_som' },
                            { label: 'Impressoras', key: 'qt_equip_impressora' },
                            { label: 'Impressoras multifuncionais', key: 'qt_equip_impressora_mult' },
                            { label: 'Copiadoras', key: 'qt_equip_copiadora' },
                          ]} />
                          <BinTable title="Materiais Pedagógicos" rows={[
                            { label: 'Material multimídia', key: 'in_material_ped_multimidia' },
                            { label: 'Material Ed. Infantil', key: 'in_material_ped_infantil' },
                            { label: 'Material científico', key: 'in_material_ped_cientifico' },
                            { label: 'Material musical', key: 'in_material_ped_musical' },
                            { label: 'Jogos educativos', key: 'in_material_ped_jogos' },
                            { label: 'Material artístico', key: 'in_material_ped_artisticas' },
                            { label: 'Material esportivo', key: 'in_material_ped_desportiva' },
                            { label: 'Material Ed. Especial', key: 'in_material_ped_edu_esp' },
                          ]} />
                        </div>
                      );

                      // ── DIM 3: SEGURANÇA ESCOLAR ──
                      if (activeSchoolTab === 'dim3') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={3} icon={<Shield size={24} />} title="Segurança Escolar" desc="Ambiente seguro e local de funcionamento" index="Índice de Segurança" />
                          <BinTable title="Local de Funcionamento" rows={[
                            { label: 'Prédio escolar próprio', key: 'in_local_func_predio_escolar' },
                            { label: 'Salas em outra escola', key: 'in_local_func_salas_outra_esc' },
                            { label: 'Galpão/rancho', key: 'in_local_func_galpao' },
                            { label: 'Socioeducativo', key: 'in_local_func_socioeducativo' },
                            { label: 'Unidade prisional', key: 'in_local_func_unid_prisional' },
                            { label: 'Prédio compartilhado', key: 'in_predio_compartilhado' },
                            { label: 'Outros locais', key: 'in_local_func_outros' },
                          ]} />
                          <div style={{ padding: '14px 20px', background: '#fffbf2', borderTop: '1px solid #f0e8d0', fontSize: 13, color: '#8a7040' }}>
                            <span style={{display:'flex',alignItems:'flex-start',gap:6}}><AlertTriangle size={13} style={{flexShrink:0,marginTop:1}} /> <span><strong>Nota:</strong> O Censo Escolar não coleta dados sobre câmeras, portaria, alarmes, extintores ou plano de evacuação. Esses itens compõem o Índice de Segurança proposto, mas dependem de fontes complementares.</span></span>
                          </div>
                        </div>
                      );

                      // ── DIM 4: SUSTENTABILIDADE E MEIO AMBIENTE ──
                      if (activeSchoolTab === 'dim4') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={4} icon={<Leaf size={24} />} title="Sustentabilidade e Meio Ambiente" desc="Uso de recursos naturais e educação ambiental" index="Índice de Sustentabilidade" />
                          <BinTable title="Recursos Naturais e Energia Limpa" rows={[
                            { label: 'Energia renovável (solar etc.)', key: 'in_energia_renovavel' },
                            { label: 'Área verde', key: 'in_area_verde' },
                            { label: 'Área para plantio', key: 'in_area_plantio' },
                            { label: 'Horta escolar', key: 'in_horta' },
                            { label: 'Compostagem', key: 'in_compostagem' },
                            { label: 'Viveiro', key: 'in_viveiro' },
                          ]} />
                          <BinTable title="Gestão de Resíduos" rows={[
                            { label: 'Separação de lixo', key: 'in_tratamento_lixo_separacao' },
                            { label: 'Reciclagem', key: 'in_tratamento_lixo_reciclagem' },
                            { label: 'Reutilização de materiais', key: 'in_tratamento_lixo_reutiliza' },
                            { label: 'Lixo — Coleta pública', key: 'in_lixo_servico_coleta' },
                            { label: 'Lixo — Queima (negativo)', key: 'in_lixo_queima' },
                            { label: 'Lixo — Enterra (negativo)', key: 'in_lixo_enterra' },
                            { label: 'Tratamento — Inexistente', key: 'in_tratamento_lixo_inexistente' },
                          ]} />
                          <BinTable title="Educação Ambiental" rows={[
                            { label: 'Ed. Ambiental', key: 'in_educacao_ambiental' },
                          ]} />
                        </div>
                      );

                      // ── DIM 5: INCLUSÃO E ACESSIBILIDADE ──
                      if (activeSchoolTab === 'dim5') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={5} icon={<Accessibility size={24} />} title="Inclusão e Acessibilidade" desc="Inclusão de estudantes com deficiência e necessidades especiais" index="Índice de Inclusão" />
                          <BinTable title="Acessibilidade Física" rows={[
                            { label: 'Rampas', key: 'in_acessibilidade_rampas' },
                            { label: 'Corrimão', key: 'in_acessibilidade_corrimao' },
                            { label: 'Elevador', key: 'in_acessibilidade_elevador' },
                            { label: 'Piso tátil', key: 'in_acessibilidade_pisos_tateis' },
                            { label: 'Sinalização visual', key: 'in_acessibilidade_sinal_visual' },
                            { label: 'Sinalização sonora', key: 'in_acessibilidade_sinal_sonoro' },
                            { label: 'Telas/leitores (def. visual)', key: 'in_acessibilidade_telas_leitoras' },
                            { label: 'Banheiro acessível (PNE)', key: 'in_banheiro_pne' },
                            { label: 'Dependências acessíveis', key: 'in_dependencias_pne' },
                          ]} />
                          <BinTable title="Recursos Pedagógicos de Inclusão" rows={[
                            { label: 'Sala AEE (Atend. Ed. Especializado)', key: 'in_sala_atendimento_especial' },
                            { label: 'Libras', key: 'in_esp_libras' },
                            { label: 'Braille', key: 'in_esp_braille' },
                            { label: 'Comunicação alternativa', key: 'in_esp_comunicacao_alternativa' },
                            { label: 'Orientação e mobilidade', key: 'in_esp_orient_mobilidade' },
                            { label: 'Enriquecimento curricular', key: 'in_esp_enriquecimento_curricular' },
                            { label: 'Intérprete de Libras', key: 'in_prof_interprete_libras' },
                            { label: 'Profissional de apoio', key: 'in_prof_apoio' },
                          ]} />
                          <NumTable title="Educação Especial — Matrículas" rows={[
                            { label: 'Total Ed. Especial', key: 'qt_mat_esp' },
                            { label: 'Classes comuns (inclusão)', key: 'qt_mat_esp_cc' },
                            { label: 'Classes exclusivas', key: 'qt_mat_esp_ce' },
                          ]} />
                          <NumTable title="Educação Especial — Docentes e Turmas" rows={[
                            { label: 'Docentes Ed. Especial', key: 'qt_doc_esp' },
                            { label: 'Doc. — Classes Comuns', key: 'qt_doc_esp_cc' },
                            { label: 'Doc. — Classes Exclusivas', key: 'qt_doc_esp_ce' },
                            { label: 'Turmas Ed. Especial', key: 'qt_tur_esp' },
                            { label: 'Turmas — Classes Comuns', key: 'qt_tur_esp_cc' },
                            { label: 'Turmas — Classes Exclusivas', key: 'qt_tur_esp_ce' },
                          ]} />
                        </div>
                      );

                      // ── DIM 6: EQUIDADE SOCIAL E EDUCACIONAL ──
                      if (activeSchoolTab === 'dim6') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={6} icon={<Scale size={24} />} title="Equidade Social e Educacional" desc="Perfil social dos estudantes e modalidades de equidade" index="Índice Social" />
                          <NumTable title="Perfil dos Estudantes — por Sexo" rows={[
                            { label: 'Feminino', key: 'qt_mat_bas_fem' },
                            { label: 'Masculino', key: 'qt_mat_bas_masc' },
                          ]} />
                          <NumTable title="por Cor/Raça" rows={[
                            { label: 'Branca', key: 'qt_mat_bas_branca' },
                            { label: 'Preta', key: 'qt_mat_bas_preta' },
                            { label: 'Parda', key: 'qt_mat_bas_parda' },
                            { label: 'Amarela', key: 'qt_mat_bas_amarela' },
                            { label: 'Indígena', key: 'qt_mat_bas_indigena' },
                            { label: 'Não declarada', key: 'qt_mat_bas_nd' },
                          ]} />
                          <NumTable title="por Faixa Etária" rows={[
                            { label: '0 a 3 anos', key: 'qt_mat_bas_0_3' },
                            { label: '4 a 5 anos', key: 'qt_mat_bas_4_5' },
                            { label: '6 a 10 anos', key: 'qt_mat_bas_6_10' },
                            { label: '11 a 14 anos', key: 'qt_mat_bas_11_14' },
                            { label: '15 a 17 anos', key: 'qt_mat_bas_15_17' },
                            { label: '18 anos ou mais', key: 'qt_mat_bas_18_mais' },
                          ]} />
                          <NumTable title="por Zona de Residência e Turno" rows={[
                            { label: 'Zona urbana', key: 'qt_mat_zr_urb' },
                            { label: 'Zona rural', key: 'qt_mat_zr_rur' },
                            { label: 'Turno diurno', key: 'qt_mat_bas_d' },
                            { label: 'Turno noturno', key: 'qt_mat_bas_n' },
                            { label: 'EAD', key: 'qt_mat_bas_ead' },
                          ]} />
                          <BinTable title="Modalidades de Equidade" rows={[
                            { label: 'Ed. Indígena', key: 'in_educacao_indigena' },
                            { label: 'Ed. Quilombola', key: 'in_educacao_quilombola' },
                            { label: 'Ed. do Campo', key: 'in_educacao_campo' },
                            { label: 'EJA', key: 'in_eja' },
                            { label: 'Ed. Profissional', key: 'in_prof' },
                            { label: 'Tempo Integral', key: 'in_tempo_integral' },
                            { label: 'Alimentação escolar', key: 'in_alimentacao' },
                          ]} />
                          <NumTable title="Transporte Escolar" rows={[
                            { label: 'Alunos com transporte público', key: 'qt_transp_publico' },
                            { label: 'Custeado pelo Estado', key: 'qt_transp_resp_est' },
                            { label: 'Custeado pelo Município', key: 'qt_transp_resp_mun' },
                          ]} />
                          <BinTable title="Tipo de Transporte" rows={[
                            { label: 'Van / Veículo leve', key: 'in_equip_transpor_vans_micro' },
                            { label: 'Micro-ônibus', key: 'in_equip_transpor_micro_onibus' },
                            { label: 'Ônibus', key: 'in_equip_transpor_onibus' },
                            { label: 'Bicicleta', key: 'in_equip_transpor_bicicleta' },
                            { label: 'Tração animal', key: 'in_equip_transpor_tracao_animal' },
                            { label: 'Aquaviário (barco/canoa)', key: 'in_equip_transpor_aquaviario' },
                            { label: 'Ferroviário (trem)', key: 'in_equip_transpor_ferroviario' },
                          ]} />
                        </div>
                      );

                      // ── DIM 7: PARTICIPAÇÃO E COMUNIDADE ──
                      if (activeSchoolTab === 'dim7') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={7} icon={<Handshake size={24} />} title="Participação e Comunidade" desc="Gestão democrática, vínculos e participação da comunidade" index="Índice de Participação" />
                          <BinTable title="Gestão Democrática" rows={[
                            { label: 'Conselho escolar', key: 'in_orgao_conselho_escolar' },
                            { label: 'Associação de pais e mestres', key: 'in_orgao_ass_pais_mestres' },
                            { label: 'Grêmio estudantil', key: 'in_orgao_gremio_estudantil' },
                            { label: 'Projeto Político-Pedagógico', key: 'in_ppp' },
                            { label: 'Redes sociais', key: 'in_redes_sociais' },
                            { label: 'Parceria com Poder Público', key: 'in_poder_publico_parceria' },
                          ]} />
                          <BinTable title="Vínculo Institucional" rows={[
                            { label: 'Vínculo — Secretaria de Educação', key: 'in_vinculo_secretaria_educacao' },
                            { label: 'Vínculo — Segurança Pública', key: 'in_vinculo_seguranca_publica' },
                            { label: 'Vínculo — Secretaria de Saúde', key: 'in_vinculo_secretaria_saude' },
                            { label: 'Vínculo — Outro órgão', key: 'in_vinculo_outro_orgao' },
                          ]} />
                          <BinTable title="Idiomas Ofertados" rows={[
                            { label: 'Inglês', key: 'in_lingua_ingles' },
                            { label: 'Espanhol', key: 'in_lingua_espanhol' },
                            { label: 'Francês', key: 'in_lingua_frances' },
                            { label: 'Libras', key: 'in_lingua_libras' },
                            { label: 'Língua indígena', key: 'in_lingua_indigena' },
                            { label: 'Outro idioma estrangeiro', key: 'in_lingua_outra_estrang' },
                          ]} />
                        </div>
                      );

                      // ── DIM 8: GESTÃO ESCOLAR ──
                      if (activeSchoolTab === 'dim8') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={8} icon={<ClipboardList size={24} />} title="Gestão Escolar" desc="Estrutura administrativa e equipe de suporte" index="Índice de Gestão" />
                          <TextTable title="Perfil do(a) Gestor(a)" rows={[
                            { label: 'Sexo', key: 'gest_sexo' },
                            { label: 'Escolaridade', key: 'gest_escolaridade' },
                            { label: 'Pós-graduação', key: 'gest_pos_graduacao' },
                            { label: 'Forma de ingresso', key: 'gest_tipo_gestao' },
                            { label: 'Tempo no cargo', key: 'gest_tempo_gestao' },
                          ]} />
                          <NumTable title="Quantidade de Gestores" rows={[
                            { label: 'Gestores Ed. Básica', key: 'qt_gest_bas' },
                          ]} />
                          <NumTable title="Equipe Não Docente" rows={[
                            { label: 'Coordenadores pedagógicos', key: 'qt_prof_coordenador' },
                            { label: 'Secretários escolares', key: 'qt_prof_secretario' },
                            { label: 'Administrativos', key: 'qt_prof_administrativos' },
                            { label: 'Serviços gerais', key: 'qt_prof_servicos_gerais' },
                            { label: 'Segurança/vigilância', key: 'qt_prof_seguranca' },
                            { label: 'Monitores/Auxiliares', key: 'qt_prof_monitores' },
                            { label: 'Bibliotecários', key: 'qt_prof_bibliotecario' },
                            { label: 'Psicólogos', key: 'qt_prof_psicologo' },
                            { label: 'Assistentes sociais', key: 'qt_prof_assist_social' },
                            { label: 'Nutricionistas', key: 'qt_prof_nutricionista' },
                          ]} />
                        </div>
                      );

                      // ── DIM 9: DOCENTES ──
                      if (activeSchoolTab === 'dim9') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={9} icon={<GraduationCap size={24} />} title="Docentes" desc="Quantidade e distribuição dos professores por etapa" index="Índice Docente" />
                          <NumTable title="Docentes por Etapa de Ensino" rows={[
                            { label: 'Total (Ed. Básica)', key: 'qt_doc_bas' },
                            { label: 'Ed. Infantil', key: 'qt_doc_inf' },
                            { label: '— Creche', key: 'qt_doc_inf_cre' },
                            { label: '— Pré-escola', key: 'qt_doc_inf_pre' },
                            { label: 'Ens. Fundamental', key: 'qt_doc_fund' },
                            { label: '— Anos Iniciais', key: 'qt_doc_fund_ai' },
                            { label: '— Anos Finais', key: 'qt_doc_fund_af' },
                            { label: 'Ensino Médio', key: 'qt_doc_med' },
                            { label: 'EJA', key: 'qt_doc_eja' },
                            { label: '— EJA Fundamental', key: 'qt_doc_eja_fund' },
                            { label: '— EJA Médio', key: 'qt_doc_eja_med' },
                            { label: 'Ed. Profissional', key: 'qt_doc_prof' },
                            { label: 'Ed. Especial', key: 'qt_doc_esp' },
                          ]} />
                          <div style={{ padding: '14px 20px', background: '#fffbf2', borderTop: '1px solid #f0e8d0', fontSize: 13, color: '#8a7040', lineHeight: 1.6 }}>
                            <span style={{display:'flex',alignItems:'flex-start',gap:6}}><Info size={13} style={{flexShrink:0,marginTop:1}} /> <span><strong>Nota:</strong> Esta dimensão registra a <em>quantidade</em> de docentes por etapa (Censo Escolar). Para dados qualitativos de formação e atuação, consulte as seções dedicadas:</span></span>
                            <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: 12 }}>
                              <li><strong>AFD — Adequação da Formação Docente:</strong> percentual de professores com licenciatura na área em que lecionam.</li>
                              <li><strong>IED — Esforço Docente:</strong> índice de intensidade de trabalho (número de escolas, turnos e etapas acumuladas).</li>
                            </ul>
                          </div>
                        </div>
                      );

                      // ── DIM 10: OFERTA EDUCACIONAL ──
                      if (activeSchoolTab === 'dim10') return (
                        <div className="tab-panel-v6 active" style={{ padding: 0 }}>
                          <DimHeader num={10} icon={<BookOpen size={24} />} title="Oferta Educacional" desc="O que a escola oferece — etapas, turmas e matrículas" index="Índice de Oferta Educacional" />
                          <BinTable title="Etapas e Modalidades Oferecidas" rows={[
                            { label: 'Ed. Infantil', key: 'in_inf' },
                            { label: '— Creche', key: 'in_inf_cre' },
                            { label: '— Pré-escola', key: 'in_inf_pre' },
                            { label: 'Ens. Fundamental', key: 'in_fund' },
                            { label: '— Anos Iniciais', key: 'in_fund_ai' },
                            { label: '— Anos Finais', key: 'in_fund_af' },
                            { label: 'Ensino Médio', key: 'in_med' },
                            { label: 'Ed. Profissional', key: 'in_prof' },
                            { label: 'EJA', key: 'in_eja' },
                            { label: 'Ed. Especial', key: 'in_esp' },
                            { label: 'Tempo Integral', key: 'in_tempo_integral' },
                            { label: 'Ed. Indígena', key: 'in_educacao_indigena' },
                            { label: 'Ed. Quilombola', key: 'in_educacao_quilombola' },
                            { label: 'Ed. do Campo', key: 'in_educacao_campo' },
                            { label: 'Ed. Ambiental', key: 'in_educacao_ambiental' },
                          ]} />
                          <NumTable title="Matrículas" rows={[
                            { label: 'Total Ed. Básica', key: 'qt_mat_bas' },
                            { label: 'Ed. Infantil', key: 'qt_mat_inf' },
                            { label: '— Creche', key: 'qt_mat_inf_cre' },
                            { label: '— Pré-escola', key: 'qt_mat_inf_pre' },
                            { label: 'Ens. Fundamental', key: 'qt_mat_fund' },
                            { label: '— Anos Iniciais (1º–5º)', key: 'qt_mat_fund_ai' },
                            { label: '    1º ano', key: 'qt_mat_fund_ai_1' },
                            { label: '    2º ano', key: 'qt_mat_fund_ai_2' },
                            { label: '    3º ano', key: 'qt_mat_fund_ai_3' },
                            { label: '    4º ano', key: 'qt_mat_fund_ai_4' },
                            { label: '    5º ano', key: 'qt_mat_fund_ai_5' },
                            { label: '— Anos Finais (6º–9º)', key: 'qt_mat_fund_af' },
                            { label: '    6º ano', key: 'qt_mat_fund_af_6' },
                            { label: '    7º ano', key: 'qt_mat_fund_af_7' },
                            { label: '    8º ano', key: 'qt_mat_fund_af_8' },
                            { label: '    9º ano', key: 'qt_mat_fund_af_9' },
                            { label: 'Ensino Médio', key: 'qt_mat_med' },
                            { label: '— 1ª série', key: 'qt_mat_med_prop_1' },
                            { label: '— 2ª série', key: 'qt_mat_med_prop_2' },
                            { label: '— 3ª série', key: 'qt_mat_med_prop_3' },
                            { label: '— Médio integrado', key: 'qt_mat_med_int' },
                            { label: 'EJA', key: 'qt_mat_eja' },
                            { label: '— EJA Fundamental', key: 'qt_mat_eja_fund' },
                            { label: '— EJA Médio', key: 'qt_mat_eja_med' },
                            { label: 'Ed. Profissional', key: 'qt_mat_prof' },
                            { label: '— Ed. Prof. Técnica', key: 'qt_mat_prof_tec' },
                            { label: 'Ed. Especial', key: 'qt_mat_esp' },
                            { label: '— Classes comuns (inclusão)', key: 'qt_mat_esp_cc' },
                            { label: '— Classes exclusivas', key: 'qt_mat_esp_ce' },
                          ]} />
                          <NumTable title="Turmas" rows={[
                            { label: 'Total turmas', key: 'qt_tur_bas' },
                            { label: '— Ed. Infantil', key: 'qt_tur_inf' },
                            { label: '— Fundamental', key: 'qt_tur_fund' },
                            { label: '— Ensino Médio', key: 'qt_tur_med' },
                            { label: '— EJA', key: 'qt_tur_eja' },
                            { label: '— Ed. Profissional', key: 'qt_tur_prof' },
                            { label: '— Ed. Especial', key: 'qt_tur_esp' },
                            { label: 'Turmas diurnas', key: 'qt_tur_bas_d' },
                            { label: 'Turmas noturnas', key: 'qt_tur_bas_n' },
                          ]} />
                          <NumTable title="Tempo Integral" rows={[
                            { label: 'Matrículas Infantil integral', key: 'qt_mat_inf_int' },
                            { label: 'Matrículas Fund. AI integral', key: 'qt_mat_fund_ai_int' },
                            { label: 'Matrículas Fund. AF integral', key: 'qt_mat_fund_af_int' },
                            { label: 'Matrículas Médio integral', key: 'qt_mat_med_int' },
                            { label: 'Turmas Infantil integral', key: 'qt_tur_inf_int' },
                            { label: 'Turmas Fund. AI integral', key: 'qt_tur_fund_ai_int' },
                            { label: 'Turmas Fund. AF integral', key: 'qt_tur_fund_af_int' },
                            { label: 'Turmas Médio integral', key: 'qt_tur_med_int' },
                          ]} />
                        </div>
                      );

                      return null;

                    })()}

                    </>
                    )}
                  </div>
                </section>
                </div>{/* ── fim wrapper flex ── */}

                {/* ── DADOS FINANCEIROS PDDE ── */}
                <section id="sec-pdde" className="section section-pauta" style={{ scrollMarginTop: 70, display: hiddenSecs.has('sec-pdde') ? 'none' : undefined }}>
                  <div className="section-title">
                    <div><h2>Dados financeiros PDDE</h2><p>Situação financeira e repasses do Programa Dinheiro Direto na Escola</p></div>
                  </div>
                  <div className="organic-divider" />
                  {/* loading state */}
                  {(pddeLoading || cadastralLoading || prestacaoContaLoading || atendimentoLoading) && (
                    <div className="flex items-center gap-2 py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando dados do FNDE...</span>
                    </div>
                  )}

                  {/* ── BLOCO: SUSPENSÃO REAL FNDE (Relatório de Suspensão) ── */}
                  {pddeData?.ok && suspEscola.loading && (
                    <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'#fef9f0',border:'1px solid #fde68a',borderRadius:'8px',marginBottom:'12px',fontSize:'12px',color:'#92400e'}}>
                      <Loader2 className="w-3 h-3 animate-spin" style={{color:'#b45309'}} />
                      Consultando Relatório de Suspensão do FNDE...
                    </div>
                  )}
                  {pddeData?.ok && !suspEscola.loading && suspEscola.itens.length > 0 && (() => {
                    const MOTIVO_MAP: Record<string, { label: string; acao: string }> = {
                      'Escola sem UEX (escola)':           { label: 'Escola sem UEx cadastrada', acao: 'Constituir e cadastrar uma Unidade Executora (conselho escolar ou APM) no PDDEweb.' },
                      'Inadimplente (UEX)':                { label: 'UEx inadimplente com prestação de contas', acao: 'Regularizar a prestação de contas pendente no PDDE. Prazo final: 31 de outubro.' },
                      'Prazo para resolução de pendências vencido (UEX)': { label: 'Prazo de regularização vencido (UEx)', acao: 'Entrar em contato com o FNDE urgentemente — o prazo legal para regularização foi ultrapassado.' },
                      'Prazo para resolução de pendências vencido (escola)': { label: 'Prazo de regularização vencido (escola)', acao: 'Entrar em contato com o FNDE urgentemente — o prazo legal foi ultrapassado.' },
                      'UEX sem dirigente ativo (UEX)':     { label: 'UEx sem dirigente ativo', acao: 'Eleger novo presidente da UEx e atualizar o cadastro no PDDEweb com ata de eleição e mandato vigente.' },
                      'CNPJ inválido na Receita Federal (UEX)': { label: 'CNPJ da UEx irregular na Receita Federal', acao: 'Regularizar o CNPJ da UEx junto à Receita Federal e atualizar os dados no PDDEweb.' },
                      'Credor sem conta corrente ativa':   { label: 'Conta corrente inativa', acao: 'Verificar se a conta bancária da UEx está ativa. Pode ser necessário reativar a conta ou cadastrar nova conta no PDDEweb.' },
                      'Sem conta ativa dentro do prazo de pagamento': { label: 'Sem conta ativa no prazo de pagamento', acao: 'Garantir que a conta bancária da UEx esteja ativa e regularizada no PDDEweb antes do prazo de pagamento.' },
                      'Credor de ação integrada é uma EEX': { label: 'Ação integrada: credora deve ser UEx', acao: 'Para esta ação integrada o FNDE exige UEx como credora. A escola precisa cadastrar uma UEx própria no PDDEweb.' },
                      'Omissão na prestação de contas (proponente)': { label: 'Omissão na prestação de contas', acao: 'A prestação de contas não foi submetida. Submeter a PC no PDDE/SIGPC imediatamente.' },
                      'O banco sugerido do cadastro da UEX não é o Banco do Brasil (UEX)': { label: 'Banco cadastrado não é o Banco do Brasil', acao: 'Atualizar o cadastro bancário da UEx no PDDEweb com uma conta no Banco do Brasil (PDDE exige Banco do Brasil).' },
                      'Bloqueio CODDE - UEX/Credor (UEX)': { label: 'Bloqueio CODDE', acao: 'Entrar em contato com o FNDE para obter informações sobre o bloqueio CODDE.' },
                      'Entidade não habilitada no exercício atual (EM)': { label: 'Entidade não habilitada no exercício atual', acao: 'Verificar junto ao FNDE os requisitos de habilitação para o exercício corrente.' },
                      'UEX localizada em domicílio diferente do domicílio da escola': { label: 'UEx com endereço divergente', acao: 'Atualizar o endereço cadastrado da UEx no PDDEweb para que coincida com o endereço da escola.' },
                    };
                    const byMotivo = new Map<string, typeof suspEscola.itens>();
                    suspEscola.itens.forEach((it: any) => {
                      const m = it.motivo || 'Desconhecido';
                      if (!byMotivo.has(m)) byMotivo.set(m, []);
                      byMotivo.get(m)!.push(it);
                    });
                    const isRed = Array.from(byMotivo.keys()).some(m =>
                      m.includes('sem UEX') || m.includes('Prazo') || m.includes('CNPJ') || m.includes('Bloqueio')
                    );
                    const borderColor = isRed ? '#fca5a5' : '#fed7aa';
                    const bgColor = isRed ? '#fef2f2' : '#fff7ed';
                    const titleColor = isRed ? '#991b1b' : '#7c2d12';
                    const iconColor = isRed ? '#dc2626' : '#c2410c';
                    const tagBg = isRed ? '#fecaca' : '#fed7aa';
                    const subBg = isRed ? '#fee2e2' : '#ffedd5';
                    return (
                      <div style={{background:bgColor,border:`1.5px solid ${borderColor}`,borderRadius:'10px',padding:'14px 16px',marginBottom:'16px',display:'flex',flexDirection:'column',gap:'8px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <AlertTriangle className="w-4 h-4" style={{color:iconColor,flexShrink:0}} />
                          <span style={{fontSize:'13px',fontWeight:800,color:titleColor}}>
                            Suspensão ativa — dados do Relatório FNDE
                          </span>
                          <span style={{fontSize:'10px',fontWeight:700,color:iconColor,background:tagBg,borderRadius:'9999px',padding:'1px 8px',marginLeft:'auto',whiteSpace:'nowrap'}}>
                            ⚠ {suspEscola.itens.length > 1 ? `${new Set(suspEscola.itens.map((i:any)=>i.motivo)).size} motivo(s)` : 'Ativo'}
                          </span>
                        </div>
                        {Array.from(byMotivo.entries()).map(([motivo, itens]) => {
                          const info = MOTIVO_MAP[motivo] || { label: motivo, acao: 'Consulte o PDDEweb ou entre em contato com o FNDE para regularização.' };
                          const programas = [...new Set((itens as any[]).map((i:any) => i.programa).filter(Boolean))];
                          const acoes = [...new Set((itens as any[]).map((i:any) => i.acao).filter(Boolean))];
                          return (
                            <div key={motivo} style={{display:'flex',alignItems:'flex-start',gap:'8px',background:subBg,borderRadius:'6px',padding:'8px 10px'}}>
                              <span style={{fontSize:'11px',fontWeight:700,color:titleColor,background:tagBg,borderRadius:'4px',padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0,marginTop:'1px'}}>FNDE</span>
                              <span style={{fontSize:'12px',color:titleColor,fontWeight:500,display:'flex',flexDirection:'column',gap:'3px'}}>
                                <strong>{info.label}</strong>
                                {programas.length > 0 && (
                                  <span style={{fontSize:'11px',opacity:0.85}}>
                                    Programa(s): {programas.join(', ')}
                                    {acoes.length > 0 && ` — ações: ${acoes.slice(0,3).join(', ')}${acoes.length > 3 ? '...' : ''}`}
                                  </span>
                                )}
                                <span style={{fontSize:'11px',color:isRed?'#7f1d1d':'#92400e',marginTop:'2px'}}>→ {info.acao}</span>
                              </span>
                            </div>
                          );
                        })}
                        <p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>
                          Fonte: Relatório de Suspensão FNDE — consultado em tempo real para {pddeAno}{suspEscola.anosConsultados.length > 1 ? ` e ${suspEscola.anosConsultados.filter(a => a !== pddeAno)[0]}` : ''}.
                        </p>
                      </div>
                    );
                  })()}

                  {/* ── ALERTA: ESCOLA SEM UEx (só exibe se o FNDE não trouxe dados reais) ── */}
                  {pddeData?.ok && !pddeData?.uex &&
                   !suspEscola.loading && suspEscola.itens.length === 0 &&
                   (pddeData?.destinacoes?.length ?? 0) > 0 &&
                   pddeData.destinacoes!.every((d: any) => (d.pago_total ?? 0) === 0) && (() => {
                    const totalDevido = pddeData.destinacoes!.reduce((s: number, d: any) => s + (d.devido_total ?? 0), 0);
                    return (
                      <div style={{
                        background:'#fef2f2',border:'1.5px solid #fca5a5',borderRadius:'10px',
                        padding:'14px 16px',marginBottom:'16px',
                        display:'flex',flexDirection:'column',gap:'8px'
                      }}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <AlertTriangle className="w-4 h-4" style={{color:'#dc2626',flexShrink:0}} />
                          <span style={{fontSize:'13px',fontWeight:800,color:'#991b1b'}}>
                            Repasses suspensos — Escola sem UEx cadastrada
                          </span>
                          <span style={{fontSize:'10px',fontWeight:700,color:'#991b1b',background:'#fecaca',borderRadius:'9999px',padding:'1px 8px',marginLeft:'auto',whiteSpace:'nowrap'}}>
                            ⚠ Ativo
                          </span>
                        </div>
                        <p style={{fontSize:'12px',color:'#7f1d1d',margin:0,lineHeight:'1.6'}}>
                          Esta escola <strong>não possui Unidade Executora (UEx/EM) registrada no FNDE</strong>.
                          Enquanto a UEx não for criada e cadastrada, os repasses do PDDE ficam bloqueados
                          — mesmo que os recursos estejam previstos.
                        </p>
                        {totalDevido > 0 && (
                          <div style={{background:'#fee2e2',borderRadius:'6px',padding:'6px 10px',display:'inline-flex',alignItems:'center',gap:'8px',alignSelf:'flex-start'}}>
                            <span style={{fontSize:'11px',color:'#7f1d1d',fontWeight:600}}>
                              Valor previsto bloqueado:
                            </span>
                            <span style={{fontSize:'13px',fontWeight:800,color:'#991b1b',fontFamily:'monospace'}}>
                              {totalDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        )}
                        <p style={{fontSize:'11px',color:'#9ca3af',margin:0}}>
                          Para regularizar: a escola precisa constituir uma UEx (conselho escolar ou APM) e cadastrá-la no PDDE/FNDE.
                        </p>
                      </div>
                    );
                  })()}

                  {/* ── ALERTA: UEx COM PENDÊNCIAS (só exibe se o FNDE não trouxe dados reais) ── */}
                  {pddeData?.ok && pddeData?.uex && !suspEscola.loading && suspEscola.itens.length === 0 && (() => {
                    const mandatoFimStr = cadastralData?.itens?.[0]?.data_fim_mandato || pddeData?.situacao_uex?.mandato_fim || null;
                    const fimDate = mandatoFimStr ? (() => {
                      const [dd, mm, aaaa] = mandatoFimStr.split('/');
                      return aaaa ? new Date(+aaaa, +mm - 1, +dd) : null;
                    })() : null;
                    const mandatoVencido =
                      cadastralData?.itens?.[0]?.mandato_dirigente === 'VENCIDO' ||
                      (fimDate ? fimDate < new Date() : false);
                    const pendentes: Array<{ano_exercicio: number; programa: string}> =
                      pddeData?.situacao_uex?.programas_pendentes || [];
                    const pcInadimplente = prestacaoContaData?.itens?.some(
                      (it: any) => it.situacao_pc_uex?.toLowerCase().includes('inadimp') ||
                                   it.situacao_pc_eex?.toLowerCase().includes('inadimp')
                    );
                    const dests: Array<any> = pddeData?.destinacoes || [];
                    const uexTodosPago0 = !mandatoVencido && pendentes.length === 0 && !pcInadimplente &&
                      dests.length > 0 && dests.every((d: any) => (d.pago_total ?? 0) === 0);
                    const destsBloqueadas = (!mandatoVencido && pendentes.length === 0 && !pcInadimplente && !uexTodosPago0)
                      ? dests.filter((d: any) => (d.pago_total ?? 0) === 0 && (d.devido_total ?? 0) > 0)
                      : [];

                    if (!mandatoVencido && pendentes.length === 0 && !pcInadimplente && !uexTodosPago0 && destsBloqueadas.length === 0) return null;

                    return (
                      <div style={{
                        background:'#fff7ed',border:'1.5px solid #fed7aa',borderRadius:'10px',
                        padding:'14px 16px',marginBottom:'16px',
                        display:'flex',flexDirection:'column',gap:'8px'
                      }}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <AlertTriangle className="w-4 h-4" style={{color:'#c2410c',flexShrink:0}} />
                          <span style={{fontSize:'13px',fontWeight:800,color:'#7c2d12'}}>
                            UEx com pendências — repasses podem estar bloqueados
                          </span>
                          <span style={{fontSize:'10px',fontWeight:700,color:'#c2410c',background:'#fed7aa',borderRadius:'9999px',padding:'1px 8px',marginLeft:'auto',whiteSpace:'nowrap'}}>
                            ⚠ Ativo
                          </span>
                        </div>

                        {mandatoVencido && (
                          <div style={{display:'flex',alignItems:'flex-start',gap:'8px',background:'#ffedd5',borderRadius:'6px',padding:'8px 10px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#7c2d12',background:'#fed7aa',borderRadius:'4px',padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>Dirigente</span>
                            <span style={{fontSize:'12px',color:'#7c2d12',fontWeight:500}}>
                              <strong>UEx sem dirigente ativo</strong> — mandato encerrado em {mandatoFimStr}.
                              A UEx precisa eleger novo presidente e atualizar o cadastro no FNDE.
                            </span>
                          </div>
                        )}

                        {pendentes.length > 0 && (
                          <div style={{display:'flex',alignItems:'flex-start',gap:'8px',background:'#ffedd5',borderRadius:'6px',padding:'8px 10px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#7c2d12',background:'#fed7aa',borderRadius:'4px',padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>PC</span>
                            <span style={{fontSize:'12px',color:'#7c2d12',fontWeight:500}}>
                              <strong>Prestação de Contas pendente</strong> —{' '}
                              {pendentes.map((p, i) => (
                                <span key={i}>{p.programa} ({p.ano_exercicio}){i < pendentes.length - 1 ? ', ' : ''}</span>
                              ))}.
                              {' '}Se não regularizar até 31/outubro, o FNDE não repassará recursos.
                            </span>
                          </div>
                        )}

                        {pcInadimplente && pendentes.length === 0 && (
                          <div style={{display:'flex',alignItems:'flex-start',gap:'8px',background:'#ffedd5',borderRadius:'6px',padding:'8px 10px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#7c2d12',background:'#fed7aa',borderRadius:'4px',padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>PC</span>
                            <span style={{fontSize:'12px',color:'#7c2d12',fontWeight:500}}>
                              <strong>Inadimplência registrada no FNDE</strong> — verifique a situação da PC para regularizar.
                            </span>
                          </div>
                        )}

                        {uexTodosPago0 && (
                          <div style={{display:'flex',alignItems:'flex-start',gap:'8px',background:'#ffedd5',borderRadius:'6px',padding:'8px 10px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#7c2d12',background:'#fed7aa',borderRadius:'4px',padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>Cadastro</span>
                            <span style={{fontSize:'12px',color:'#7c2d12',fontWeight:500}}>
                              <strong>Nenhum repasse efetuado</strong> — a UEx existe e o mandato está vigente,
                              mas todos os pagamentos estão zerados. Possíveis causas: CNPJ inválido na Receita Federal,
                              conta corrente inativa ou bloqueio cadastral não visível no PDDEweb.
                              Verifique o <em>Relatório de Suspensão</em> no FNDE.
                            </span>
                          </div>
                        )}

                        {destsBloqueadas.length > 0 && (
                          <div style={{display:'flex',alignItems:'flex-start',gap:'8px',background:'#ffedd5',borderRadius:'6px',padding:'8px 10px'}}>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#7c2d12',background:'#fed7aa',borderRadius:'4px',padding:'1px 6px',whiteSpace:'nowrap',flexShrink:0}}>Repasse</span>
                            <span style={{fontSize:'12px',color:'#7c2d12',fontWeight:500,display:'flex',flexDirection:'column',gap:'4px'}}>
                              <span><strong>Destinação(ões) com pagamento zerado</strong> — possível conta corrente inativa ou bloqueio específico:</span>
                              {destsBloqueadas.map((d: any, i: number) => (
                                <span key={i} style={{fontFamily:'monospace',fontSize:'11px',background:'#fed7aa',borderRadius:'3px',padding:'1px 6px',alignSelf:'flex-start'}}>
                                  {d.destinacao} — previsto: {(d.devido_total ?? 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                                </span>
                              ))}
                              <span style={{fontSize:'11px',color:'#92400e'}}>Verifique o <em>Relatório de Suspensão</em> no FNDE para o motivo específico.</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── GRUPO: QUEM GERENCIA ── */}
                  {(pddeData?.ok || cadastralData?.ok) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'4px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#7c5cbf',background:'#f3eeff',padding:'3px 10px',borderRadius:'20px'}}>Quem gerencia</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#e8e0f5,transparent)'}} />
                    </div>
                  )}

                  {/* ── 1. IDENTIDADE DA UEx ── */}
                  {(pddeData?.ok || cadastralData?.ok) && (() => {
                    const uexNome = pddeData?.uex?.executora || cadastralData?.itens?.[0]?.razao_social || null;
                    const cnpj = pddeData?.uex?.cnpj || null;
                    const cnpjEex = cadastralData?.itens?.[0]?.cnpj_eex || null;
                    const rede = pddeData?.rede || cadastralData?.itens?.[0]?.rede_atendimento || null;
                    const municipio = pddeData?.municipio || pddeData?.uex?.municipio || null;
                    const uf = pddeData?.uf || pddeData?.uex?.uf || null;
                    const localizacao = cadastralData?.itens?.[0]?.localizacao || null;
                    const ddd = cadastralData?.itens?.[0]?.ddd || null;
                    const telefone = cadastralData?.itens?.[0]?.telefone || null;
                    const dataAtualizacao = cadastralData?.itens?.[0]?.data_atualizacao || null;
                    const dirigente = cadastralData?.itens?.[0]?.mandato_dirigente || null;
                    const mandatoFim = cadastralData?.itens?.[0]?.data_fim_mandato || pddeData?.situacao_uex?.mandato_fim || null;
                    const mandatoInicio = pddeData?.situacao_uex?.mandato_inicio || null;
                    const dadosCadastrais = pddeData?.situacao_uex?.dados_cadastrais || null;
                    const now = new Date();
                    const fimDate = mandatoFim ? (() => { const [d,m,a] = mandatoFim.split('/'); return a ? new Date(+a,+m-1,+d) : null; })() : null;
                    const vigente = fimDate ? fimDate >= now : null;
                    return (
                      <div className="soft-card" style={{marginBottom:'16px',padding:'20px'}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:'16px',flexWrap:'wrap'}}>
                          <div style={{flex:'1 1 260px'}}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                              <Landmark className="w-3.5 h-3.5" /> Unidade Executora (UEx)
                            </p>
                            {uexNome && <p style={{fontWeight:700,fontSize:'14px',lineHeight:'1.4',marginBottom:'6px'}}>{uexNome}</p>}
                            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                              {cnpj && <span className="meta-chip">CNPJ UEx: {cnpj}</span>}
                              {cnpjEex && <span className="meta-chip">CNPJ EEx: {cnpjEex}</span>}
                              {municipio && uf && <span className="meta-chip flex items-center gap-0.5"><MapPin size={10} /> {municipio}/{uf}</span>}
                              {rede && <span className="meta-chip flex items-center gap-0.5"><Building2 size={10} /> {rede}</span>}
                              {localizacao && <span className="meta-chip flex items-center gap-0.5"><MapPin size={10} /> {localizacao}</span>}
                              {(ddd || telefone) && <span className="meta-chip flex items-center gap-0.5"><Phone size={10} /> {ddd ? `(${ddd}) ` : ''}{telefone}</span>}
                              {dataAtualizacao && <span className="meta-chip text-muted-foreground">Atualizado: {dataAtualizacao}</span>}
                            </div>
                          </div>
                          <div style={{flex:'1 1 220px',borderLeft:'2px solid #f0ece4',paddingLeft:'16px'}}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Diretoria vigente</p>
                            {dirigente && (
                              <div style={{marginBottom:'6px'}}>
                                <span className="text-xs text-muted-foreground">Presidente / Dirigente</span>
                                <p style={{fontWeight:700,fontSize:'13px'}}>{dirigente}</p>
                              </div>
                            )}
                            {(mandatoInicio || mandatoFim) && (
                              <div style={{marginBottom:'6px'}}>
                                <span className="text-xs text-muted-foreground">Vigência do mandato</span>
                                <p style={{fontSize:'13px',fontWeight:600}}>
                                  {mandatoInicio && mandatoFim ? `${mandatoInicio} → ${mandatoFim}` : mandatoFim ? `até ${mandatoFim}` : mandatoInicio}
                                  {vigente !== null && (
                                    <span className={`ml-2 badge ${vigente ? 'badge-good' : 'badge-attn'}`} style={{verticalAlign:'middle'}}>
                                      {vigente ? 'Vigente' : 'Expirado'}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                            {!dirigente && !mandatoInicio && !mandatoFim && (
                              <p className="text-xs text-muted-foreground">Dados da diretoria não disponíveis</p>
                            )}
                          </div>
                        </div>
                        {dadosCadastrais && (
                          <div style={{marginTop:'14px',paddingTop:'12px',borderTop:'1px solid #f0ece4'}}>
                            <p className="text-xs text-muted-foreground" style={{lineHeight:'1.6'}}>
                              <strong>Situação cadastral:</strong> {dadosCadastrais}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── RESUMO RÁPIDO ── */}
                  {(() => {
                    const totalRepasses = atendimentoData?.ok
                      ? atendimentoData.itens.reduce((s: number, r: any) => s + (r.vl_repasse_custeio || 0) + (r.vl_repasse_capital || 0), 0)
                      : pddeExecFinData?.ok
                        ? pddeExecFinData.repasses.reduce((s: number, r: any) => s + (r.vl_pago_total || 0), 0)
                        : null;
                    // Saldo Atual: só mostramos se vier do dado em tempo real (UEX — saldo bancário live).
                    // pddeSaldosData e pddeData.contas mostram saldo acumulado de repasses, não o saldo atual da conta.
                    const totalSaldo = (pddeUexSaldoData?.ok && pddeUexSaldoData.total_saldo_geral > 0)
                      ? pddeUexSaldoData.total_saldo_geral
                      : null;
                    const hasAny = totalRepasses != null || totalSaldo != null;
                    if (!hasAny) return null;
                    return (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px',marginBottom:'20px'}}>
                        {totalRepasses != null && totalRepasses > 0 && (
                          <div className="soft-card" style={{padding:'16px',borderLeft:'3px solid #2f7a58',display:'flex',flexDirection:'column',gap:'4px'}}>
                            <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#2f7a58'}}>Total Recebido</span>
                            <span style={{fontSize:'20px',fontWeight:800,color:'#2f7a58',fontVariantNumeric:'tabular-nums'}}>{brl(totalRepasses)}</span>
                            <span style={{fontSize:'11px',color:'var(--m-muted)'}}>repasses {atendimentoData?.itens?.[0]?.ano || pddeAno}</span>
                          </div>
                        )}
                        {pddeData?.ok && pddeData.matriculas_total != null && (() => {
                          const pddeAlunos = Number(pddeData.matriculas_total);
                          const cens = censoLatest as any;
                          const censoAlunos = cens ? (Number(cens.qt_mat_bas) || null) : null;
                          const totalDiff = censoAlunos != null ? pddeAlunos - censoAlunos : null;
                          // Mapeamento nível PDDE → campo censo
                          const nivelCenso: Record<string, string | null> = {
                            'ENSINO FUNDAMENTAL': 'qt_mat_fund',
                            'ENSINO MÉDIO':       'qt_mat_med',
                            'EJA':                'qt_mat_eja',
                            'PRÉ-ESCOLAR':        'qt_mat_inf',
                            'CRECHE':             'qt_mat_inf',
                          };
                          const niveis: [string, number][] = pddeData.matriculas_por_nivel
                            ? Object.entries(pddeData.matriculas_por_nivel as Record<string, number>)
                            : [];
                          return (
                            <div className="soft-card" style={{padding:'16px',borderLeft:'3px solid #9b6a16',display:'flex',flexDirection:'column',gap:'4px',gridColumn: niveis.length > 0 ? 'span 2' : undefined}}>
                              <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#9b6a16'}}>Alunos (PDDE)</span>
                              <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
                                <span style={{fontSize:'20px',fontWeight:800,color:'#9b6a16',fontVariantNumeric:'tabular-nums'}}>{pddeAlunos.toLocaleString('pt-BR')}</span>
                                <span style={{fontSize:'11px',color:'var(--m-muted)'}}>base de cálculo {pddeData.ano}</span>
                              </div>
                              {/* Breakdown por nível com comparação Censo */}
                              {niveis.length > 0 && (
                                <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid #f0e8d8'}}>
                                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                                    <thead>
                                      <tr>
                                        <th style={{textAlign:'left',fontWeight:700,fontSize:'9px',textTransform:'uppercase',color:'#9b6a16',paddingBottom:'4px',letterSpacing:'0.06em'}}>Nível</th>
                                        <th style={{textAlign:'right',fontWeight:700,fontSize:'9px',textTransform:'uppercase',color:'#9b6a16',paddingBottom:'4px',letterSpacing:'0.06em'}}>PDDE</th>
                                        <th style={{textAlign:'right',fontWeight:700,fontSize:'9px',textTransform:'uppercase',color:'#7a7a7a',paddingBottom:'4px',letterSpacing:'0.06em'}}>Censo INEP</th>
                                        <th style={{textAlign:'right',fontWeight:700,fontSize:'9px',textTransform:'uppercase',color:'#7a7a7a',paddingBottom:'4px',letterSpacing:'0.06em'}}>Dif.</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {niveis.map(([key, val]) => {
                                        const censoKey = nivelCenso[key.toUpperCase()] ?? null;
                                        const censoVal = (censoKey && cens) ? (Number(cens[censoKey]) || null) : null;
                                        const d = censoVal != null ? val - censoVal : null;
                                        const dColor = d == null ? '#aaa' : d === 0 ? '#2f7a58' : Math.abs(d) > 15 ? '#b74f42' : '#9b6a16';
                                        return (
                                          <tr key={key} style={{borderTop:'1px solid #f5edd8'}}>
                                            <td style={{padding:'3px 0',color:'var(--m-muted)',fontWeight:500}}>{key.replace('ENSINO ','')}</td>
                                            <td style={{textAlign:'right',fontWeight:700,color:'#555',fontVariantNumeric:'tabular-nums',padding:'3px 0'}}>{Number(val).toLocaleString('pt-BR')}</td>
                                            <td style={{textAlign:'right',color:'#555',fontVariantNumeric:'tabular-nums',padding:'3px 0 3px 8px'}}>
                                              {censoVal != null ? censoVal.toLocaleString('pt-BR') : <span style={{color:'#ccc'}}>—</span>}
                                            </td>
                                            <td style={{textAlign:'right',fontWeight:700,color:dColor,fontVariantNumeric:'tabular-nums',padding:'3px 0 3px 8px'}}>
                                              {d != null ? (d === 0 ? '=' : (d > 0 ? `+${d}` : d)) : '—'}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {/* Linha de total */}
                                      <tr style={{borderTop:'2px solid #e8d8c0'}}>
                                        <td style={{padding:'4px 0',fontWeight:700,color:'#9b6a16',fontSize:'11px'}}>TOTAL</td>
                                        <td style={{textAlign:'right',fontWeight:800,color:'#9b6a16',fontVariantNumeric:'tabular-nums',padding:'4px 0'}}>{pddeAlunos.toLocaleString('pt-BR')}</td>
                                        <td style={{textAlign:'right',fontWeight:700,color:'#555',fontVariantNumeric:'tabular-nums',padding:'4px 0 4px 8px'}}>
                                          {censoAlunos != null ? censoAlunos.toLocaleString('pt-BR') : <span style={{color:'#ccc'}}>—</span>}
                                        </td>
                                        <td style={{textAlign:'right',fontWeight:800,fontVariantNumeric:'tabular-nums',padding:'4px 0 4px 8px',
                                            color: totalDiff == null ? '#aaa' : totalDiff === 0 ? '#2f7a58' : Math.abs(totalDiff) > 20 ? '#b74f42' : '#9b6a16'}}>
                                          {totalDiff != null ? (totalDiff === 0 ? '=' : totalDiff > 0 ? `+${totalDiff}` : totalDiff) : '—'}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  {totalDiff != null && Math.abs(totalDiff) > 20 && (
                                    <p style={{fontSize:'10px',color:'#b74f42',marginTop:'6px',marginBottom:0}}>
                                      Diferença expressiva — verifique o Censo e o cadastro FNDE
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Fallback sem breakdown */}
                              {niveis.length === 0 && censoAlunos != null && (
                                <div style={{marginTop:'6px',paddingTop:'6px',borderTop:'1px solid #f0e8d8',display:'flex',flexDirection:'column',gap:'2px'}}>
                                  <span style={{fontSize:'10px',color:'var(--m-muted)'}}>
                                    Censo INEP: <strong style={{color:'#555'}}>{censoAlunos.toLocaleString('pt-BR')}</strong> alunos
                                  </span>
                                  {totalDiff !== null && totalDiff !== 0 && (
                                    <span style={{fontSize:'10px',color: Math.abs(totalDiff) > 20 ? '#b74f42' : '#9b6a16'}}>
                                      {totalDiff > 0 ? `+${totalDiff}` : totalDiff} em relação ao Censo{Math.abs(totalDiff) > 20 ? ' — verifique' : ''}
                                    </span>
                                  )}
                                  {totalDiff === 0 && <span style={{fontSize:'10px',color:'#2f7a58'}}>coincide com o Censo</span>}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                  {/* ── GRUPO: CONTAS E SALDOS ── */}
                  {((pddeData?.contas?.length ?? 0) > 0 || pddeUexSaldoData?.ok || pddeSaldosData?.ok) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'20px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#2d5a88',background:'#e6eef8',padding:'3px 10px',borderRadius:'20px'}}>Contas e saldos</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#b8cfe8,transparent)'}} />
                      {pddeUexSaldoData?.ok && pddeUexSaldoData.total_saldo_geral > 0 && (
                        <span style={{fontSize:'13px',fontWeight:800,color:'#16a34a',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>
                          {brl(pddeUexSaldoData.total_saldo_geral)}
                        </span>
                      )}
                      {pddeUexSaldoData?.mes && (
                        <span style={{fontSize:'10px',color:'#9b8877',fontStyle:'italic',whiteSpace:'nowrap'}}>
                          {(() => {
                            const [mm, aaaa] = (pddeUexSaldoData.mes as string).split('-');
                            const meses = ['','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
                            return `atualizado em ${meses[parseInt(mm)] || mm}/${aaaa}`;
                          })()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── 2. CONTAS BANCÁRIAS ── */}
                  {pddeData?.ok && pddeData.contas && pddeData.contas.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <BanknoteIcon className="w-3.5 h-3.5" /> Contas bancárias
                      </p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'10px'}}>
                        {pddeData.contas.map((c: any, i: number) => {
                          const uexSaldo = pddeUexSaldoData?.saldos?.find((s: any) =>
                            s.conta && c.conta && s.conta.replace(/\D/g,'') === c.conta.replace(/\D/g,'')
                          );
                          const modalidades = uexSaldo ? [
                            { label: 'C/C', value: uexSaldo.saldo_conta },
                            { label: 'Fundos', value: uexSaldo.saldo_fundos },
                            { label: 'Poupança', value: uexSaldo.saldo_poupanca },
                            { label: 'RDB/CDB', value: uexSaldo.saldo_rdb_cdb },
                          ].filter(m => m.value > 0) : [];
                          return (
                          <div key={i} className="soft-card" style={{padding:'14px',borderLeft:'3px solid var(--m-blue)'}}>
                            <p style={{fontWeight:700,fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--m-blue)',marginBottom:'8px'}}>{c.programa}</p>
                            <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                              <div className="row-item" style={{padding:0}}>
                                <span className="text-xs text-muted-foreground">Banco</span>
                                <span className="text-xs font-semibold">{c.banco || '—'}</span>
                              </div>
                              <div className="row-item" style={{padding:0}}>
                                <span className="text-xs text-muted-foreground">Agência</span>
                                <span className="text-xs font-semibold">{c.agencia || '—'}</span>
                              </div>
                              <div className="row-item" style={{padding:0}}>
                                <span className="text-xs text-muted-foreground">Conta</span>
                                <span className="text-xs font-semibold font-mono">{c.conta || '—'}</span>
                              </div>
                              {c.saldo != null && (
                                <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid #f0ece4',display:'flex',flexDirection:'column',gap:'3px'}}>
                                  {modalidades.length > 1 ? (
                                    <>
                                      {modalidades.map(m => (
                                        <div key={m.label} className="row-item" style={{padding:0}}>
                                          <span className="text-xs text-muted-foreground">{m.label}</span>
                                          <span className="text-xs font-semibold font-mono" style={{color:'#16a34a'}}>{brl(m.value)}</span>
                                        </div>
                                      ))}
                                      <div style={{borderTop:'1px solid #f0ece4',paddingTop:'4px',marginTop:'2px'}}>
                                        <span className="text-xs text-muted-foreground">Total</span>
                                        <p style={{fontSize:'16px',fontWeight:800,color:'#16a34a',margin:0}}>{brl(c.saldo)}</p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-xs text-muted-foreground">
                                        {modalidades.length === 1 ? `Saldo em ${modalidades[0].label}` : 'Saldo'}
                                      </span>
                                      <p style={{fontSize:'16px',fontWeight:800,color: c.saldo > 0 ? '#16a34a' : 'var(--m-muted)',margin:0}}>{brl(c.saldo)}</p>
                                    </>
                                  )}
                                </div>
                              )}
                              {c.ocorrencia && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ {c.ocorrencia}</p>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── SALDO UEx POR TIPO ── */}
                  {pddeUexSaldoData?.ok && pddeUexSaldoData.saldos && pddeUexSaldoData.saldos.length > 0 && (() => {
                    const saldos = pddeUexSaldoData.saldos as any[];
                    const temFundos   = saldos.some((s: any) => (s.saldo_fundos   ?? 0) !== 0);
                    const temPoupanca = saldos.some((s: any) => (s.saldo_poupanca ?? 0) !== 0);
                    const temRdb      = saldos.some((s: any) => (s.saldo_rdb_cdb  ?? 0) !== 0);
                    return (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <BanknoteIcon className="w-3.5 h-3.5" /> Saldo bancário UEx — {pddeUexSaldoData.mes}
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Banco</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ag./Conta</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Saldo C/C</th>
                              {temFundos   && <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Fundos</th>}
                              {temPoupanca && <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Poupança</th>}
                              {temRdb      && <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">RDB/CDB</th>}
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {saldos.map((s: any, i: number) => (
                              <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                <td className="py-2 px-3 text-xs font-medium">{s.programa || '—'}</td>
                                <td className="py-2 px-3 text-xs">{s.banco || '—'}</td>
                                <td className="py-2 px-3 text-xs font-mono">{s.agencia || '—'} / {s.conta || '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_conta != null ? brl(s.saldo_conta) : '—'}</td>
                                {temFundos   && <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_fundos != null ? brl(s.saldo_fundos) : '—'}</td>}
                                {temPoupanca && <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_poupanca != null ? brl(s.saldo_poupanca) : '—'}</td>}
                                {temRdb      && <td className="py-2 px-3 text-xs text-right font-mono">{s.saldo_rdb_cdb != null ? brl(s.saldo_rdb_cdb) : '—'}</td>}
                                <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">{s.saldo_total != null ? brl(s.saldo_total) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    );
                  })()}

                  {/* ── 2c. SITUAÇÃO DA EEx ── */}
                  {pddeData?.ok && pddeData.situacao_eex && (pddeData.situacao_eex.adesao || pddeData.situacao_eex.prestacao_contas) && (() => {
                    const rawAdesao = pddeData.situacao_eex!.adesao ?? '';
                    const rawPc    = pddeData.situacao_eex!.prestacao_contas ?? '';
                    // ── Parsear Adesão ──
                    const aderiu = rawAdesao.toLowerCase().includes('aderiu');
                    const naoAderiu = rawAdesao.toLowerCase().includes('não aderiu') || rawAdesao.toLowerCase().includes('nao aderiu');
                    const dataAdesaoMatch = rawAdesao.match(/(\d{2}\/\d{2}\/\d{4})/);
                    const dataAdesao = dataAdesaoMatch ? dataAdesaoMatch[1] : null;
                    // ── Parsear Prestação de Contas ──
                    const semPendencia = rawPc.toLowerCase().includes('não consta') || rawPc.toLowerCase().includes('nao consta');
                    const comPendencia = rawPc.toLowerCase().includes('pendência') && !semPendencia;
                    return (
                      <div style={{marginBottom:'16px'}}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Situação da Entidade Executora (EEx)
                        </p>
                        <div className="soft-card" style={{padding:'14px',display:'flex',gap:'12px',flexWrap:'wrap'}}>
                          {rawAdesao && (
                            <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',borderRadius:'8px',
                              background: aderiu ? '#e8f5ee' : naoAderiu ? '#fdf0ee' : '#f5f5f5',
                              border: `1px solid ${aderiu ? '#b8dfc8' : naoAderiu ? '#f0c8c0' : '#e0e0e0'}`}}>
                              <CheckCircle size={14} style={{color: aderiu ? '#2f7a58' : naoAderiu ? '#b74f42' : '#aaa', flexShrink:0}} />
                              <div>
                                <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',
                                  color: aderiu ? '#2f7a58' : naoAderiu ? '#b74f42' : '#888', display:'block'}}>
                                  Adesão ao PDDE
                                </span>
                                <span style={{fontSize:'12px',fontWeight:600,
                                  color: aderiu ? '#1a5c3a' : naoAderiu ? '#9b2c1a' : '#555'}}>
                                  {aderiu ? 'Aderiu' : naoAderiu ? 'Não aderiu' : 'Verificar'}
                                  {dataAdesao && <span style={{fontWeight:400,color:'#777',marginLeft:'6px'}}>{dataAdesao}</span>}
                                </span>
                              </div>
                            </div>
                          )}
                          {rawPc && (
                            <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',borderRadius:'8px',
                              background: semPendencia ? '#e8f5ee' : comPendencia ? '#fdf0ee' : '#f5f5f5',
                              border: `1px solid ${semPendencia ? '#b8dfc8' : comPendencia ? '#f0c8c0' : '#e0e0e0'}`}}>
                              <FileText size={14} style={{color: semPendencia ? '#2f7a58' : comPendencia ? '#b74f42' : '#aaa', flexShrink:0}} />
                              <div>
                                <span style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',
                                  color: semPendencia ? '#2f7a58' : comPendencia ? '#b74f42' : '#888', display:'block'}}>
                                  Prestação de Contas
                                </span>
                                <span style={{fontSize:'12px',fontWeight:600,
                                  color: semPendencia ? '#1a5c3a' : comPendencia ? '#9b2c1a' : '#555'}}>
                                  {semPendencia ? 'Sem pendências' : comPendencia ? 'Com pendências' : 'Verificar'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── GRUPO: REPASSES E EXECUÇÃO ── */}
                  {(atendimentoData?.ok || pddeExecFinData?.ok || (pddeData?.destinacoes?.length ?? 0) > 0) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'20px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#2f7a58',background:'#e8f5ee',padding:'3px 10px',borderRadius:'20px'}}>Repasses e execução</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#b8e0cc,transparent)'}} />
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{fontSize:'11px',color:'#9b8877'}}>Exercício:</span>
                        <select
                          value={pddeAno}
                          onChange={e => setPddeAno(Number(e.target.value))}
                          style={{
                            fontSize:'12px',fontWeight:600,color:'#4a3728',
                            background:'#fdf6ee',border:'1px solid #e8d8c0',
                            borderRadius:'6px',padding:'3px 8px',cursor:'pointer',
                            appearance:'none',paddingRight:'22px',
                            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239b8877'/%3E%3C/svg%3E")`,
                            backgroundRepeat:'no-repeat',backgroundPosition:'right 7px center'
                          }}
                        >
                          {Array.from({length: new Date().getFullYear() - 2017}, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}


                  {/* ── 4b. DESTINAÇÕES ── */}
                  {pddeData?.ok && pddeData.destinacoes && pddeData.destinacoes.length > 0 && (() => {
                    const allRows: any[] = pddeData.destinacoes;
                    const isAggLabel = (n: string) => { const s = (n||'').trim().toLowerCase(); return s === 'subtotal' || s === 'total geral'; };
                    const isGrandTotal = (n: string) => (n||'').trim().toLowerCase() === 'total geral';

                    // Separa itens normais, subtotais e total geral
                    const itemRows = allRows.filter((d: any) => !isAggLabel(d.destinacao || ''));
                    const subtotalRows = allRows.filter((d: any) => (d.destinacao||'').trim().toLowerCase() === 'subtotal');
                    const grandTotal = allRows.find((d: any) => isGrandTotal(d.destinacao || ''));

                    // Agrupa itens por programa (parte antes do " / ")
                    const groups: Record<string, any[]> = {};
                    itemRows.forEach((d: any) => {
                      const prog = (d.destinacao || '').split(' / ')[0].trim() || 'Outros';
                      if (!groups[prog]) groups[prog] = [];
                      groups[prog].push(d);
                    });

                    const statusBadge = (devido: number, pago: number) => {
                      const ok = Math.abs(devido - pago) < 0.01;
                      return ok
                        ? <span style={{display:'inline-flex',alignItems:'center',gap:'3px',background:'#d1fadf',color:'#166534',borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:700,whiteSpace:'nowrap'}}>✓ OK</span>
                        : <span title="Verifique no FNDE se há informações pendentes ou divergências." style={{display:'inline-flex',alignItems:'center',gap:'3px',background:'#fee2e2',color:'#991b1b',borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:700,whiteSpace:'nowrap',cursor:'help'}}>⚠ Revisar</span>;
                    };

                    const groupColors: string[] = ['#e8f0fb','#e8f5ee','#fdf3e7','#f3e8fb','#e8f9fb'];
                    const groupTextColors: string[] = ['#1e3a6e','#1a5c38','#7a4510','#5c1a7a','#0f5c66'];
                    const groupEntries = Object.entries(groups);

                    return (
                      <div style={{marginBottom:'16px'}}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Destinações e pagamentos — {pddeData.ano}
                        </p>
                        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                          {groupEntries.map(([prog, items], gi) => {
                            const sub = subtotalRows[gi];
                            const subDevido = sub ? (sub.final_devido_total ?? ((sub.devido_custeio||0)+(sub.devido_capital||0))) : 0;
                            const subPago = sub ? (sub.pago_total ?? 0) : 0;
                            const bgColor = groupColors[gi % groupColors.length];
                            const txtColor = groupTextColors[gi % groupTextColors.length];
                            return (
                              <div key={prog} style={{borderRadius:'10px',overflow:'hidden',border:'1px solid #e8e0d4'}}>
                                {/* Cabeçalho do grupo */}
                                <div style={{background:bgColor,padding:'7px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                  <span style={{fontSize:'11px',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',color:txtColor}}>{prog}</span>
                                  {sub && (
                                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                      <span style={{fontSize:'11px',color:'#666'}}>Total:</span>
                                      <span style={{fontSize:'12px',fontWeight:700,fontFamily:'monospace',color: subDevido === subPago ? '#166534' : '#991b1b'}}>{brl(subPago)}</span>
                                      {statusBadge(subDevido, subPago)}
                                    </div>
                                  )}
                                </div>
                                {/* Itens do grupo */}
                                <div style={{background:'#fff'}}>
                                  {items.map((d: any, ii: number) => {
                                    const nome = d.destinacao || '';
                                    const acao = nome.split(' / ').slice(1).join(' / ') || nome;
                                    const devido = d.final_devido_total ?? ((d.devido_custeio||0)+(d.devido_capital||0));
                                    const pagoCusteio = d.pago_custeio ?? 0;
                                    const pagoCapital = d.pago_capital ?? 0;
                                    const pagoTotal = d.pago_total ?? (pagoCusteio + pagoCapital);
                                    const diverge = devido > 0 && Math.abs(devido - pagoTotal) >= 0.01;
                                    return (
                                      <div key={ii} style={{
                                        display:'flex',alignItems:'center',justifyContent:'space-between',
                                        padding:'8px 12px',
                                        borderTop: ii > 0 ? '1px solid #f0ece4' : '1px solid #e8e0d4',
                                        background: diverge ? '#fffaf9' : '#fff',
                                        gap:'8px'
                                      }}>
                                        <div style={{flex:1,minWidth:0}}>
                                          <span style={{fontSize:'12px',fontWeight:600,color:'#2a2018',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{acao}</span>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
                                          <div style={{textAlign:'right'}}>
                                            <div style={{fontSize:'9px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.04em'}}>Devido</div>
                                            <div style={{fontSize:'11px',fontFamily:'monospace',color: diverge ? '#b74f42' : '#666'}}>{brl(devido)}</div>
                                          </div>
                                          <div style={{color:'#ccc',fontSize:'12px'}}>→</div>
                                          <div style={{textAlign:'right'}}>
                                            <div style={{fontSize:'9px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.04em'}}>Pago</div>
                                            <div style={{fontSize:'12px',fontFamily:'monospace',fontWeight:700,color: pagoTotal > 0 ? '#16a34a' : '#999'}}>{brl(pagoTotal)}</div>
                                          </div>
                                          {d.data_ordem_pgto && d.data_ordem_pgto !== '-' && (
                                            <div style={{textAlign:'right'}}>
                                              <div style={{fontSize:'9px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.04em'}}>Data</div>
                                              <div style={{fontSize:'11px',color:'#777',whiteSpace:'nowrap'}}>{d.data_ordem_pgto}</div>
                                            </div>
                                          )}
                                          {statusBadge(devido, pagoTotal)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Total Geral */}
                          {grandTotal && (() => {
                            const gtDevido = grandTotal.final_devido_total ?? ((grandTotal.devido_custeio||0)+(grandTotal.devido_capital||0));
                            const gtPago = grandTotal.pago_total ?? 0;
                            return (
                              <div style={{borderRadius:'10px',background:'#eef6f1',border:'2px solid #b8d4c4',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <span style={{fontSize:'12px',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',color:'#1a5c38'}}>Total Geral</span>
                                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                  <div style={{textAlign:'right'}}>
                                    <div style={{fontSize:'9px',color:'#6b9e82',textTransform:'uppercase',letterSpacing:'0.04em'}}>Devido</div>
                                    <div style={{fontSize:'12px',fontFamily:'monospace',color:'#2f7a58'}}>{brl(gtDevido)}</div>
                                  </div>
                                  <div style={{color:'#a0c8b0',fontSize:'14px'}}>→</div>
                                  <div style={{textAlign:'right'}}>
                                    <div style={{fontSize:'9px',color:'#6b9e82',textTransform:'uppercase',letterSpacing:'0.04em'}}>Pago</div>
                                    <div style={{fontSize:'14px',fontFamily:'monospace',fontWeight:800,color:'#166534'}}>{brl(gtPago)}</div>
                                  </div>
                                  {statusBadge(gtDevido, gtPago)}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── 6. EXECUÇÃO FINANCEIRA ── */}
                  {pddeExecFinData?.ok && pddeExecFinData.repasses.length > 0 && (
                    <div style={{marginBottom:'16px'}}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Execução Financeira PDDE ({pddeExecFinData.anosDisponiveis.join(', ')})
                      </p>
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ano</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Destinação</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pago Custeio</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Pago Capital</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total Pago</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...pddeExecFinData.repasses].sort((a: any, b: any) => b.an_exercicio - a.an_exercicio).map((r: any, i: number) => (
                              <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                <td className="py-2 px-3 text-xs font-medium">{r.an_exercicio}</td>
                                <td className="py-2 px-3 text-xs">{r.sg_destinacao || r.destinacao || '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{r.vl_pago_custeio != null ? brl(r.vl_pago_custeio) : '—'}</td>
                                <td className="py-2 px-3 text-xs text-right font-mono">{r.vl_pago_capital != null ? brl(r.vl_pago_capital) : '—'}</td>
                                <td className={`py-2 px-3 text-xs text-right font-mono ${r.vl_pago_total > 0 ? 'font-bold text-emerald-700' : ''}`}>{brl(r.vl_pago_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── GRUPO: PRESTAÇÃO DE CONTAS ── */}
                  {(prestacaoContaLoading || prestacaoContaData?.ok || sigpcData?.ok) && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',marginTop:'20px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9b6a16',background:'#fdf3e0',padding:'3px 10px',borderRadius:'20px'}}>Prestação de contas</span>
                      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#f0ddb5,transparent)'}} />
                    </div>
                  )}

                  {/* ── 3. PRESTAÇÃO DE CONTAS ── */}
                  {(prestacaoContaLoading || prestacaoContaData?.ok) && (() => {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: currentYear - 2016 }, (_, i) => currentYear - i);
                    const anoExibido = prestacaoContaAno;
                    return (
                      <div style={{marginBottom:'16px'}}>
                        {/* Cabeçalho com seletor de ano */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px',flexWrap:'wrap',gap:'6px'}}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1" style={{margin:0}}>
                            <FileText className="w-3.5 h-3.5" /> Prestação de Contas
                          </p>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <span style={{fontSize:'11px',color:'#9b8877'}}>Exercício:</span>
                            <select
                              value={anoExibido}
                              onChange={e => setPrestacaoContaAno(Number(e.target.value))}
                              style={{
                                fontSize:'12px',fontWeight:600,color:'#4a3728',
                                background:'#fdf6ee',border:'1px solid #e8d8c0',
                                borderRadius:'6px',padding:'3px 8px',cursor:'pointer',
                                appearance:'none',paddingRight:'22px',
                                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239b8877'/%3E%3C/svg%3E")`,
                                backgroundRepeat:'no-repeat',backgroundPosition:'right 7px center'
                              }}
                            >
                              {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                            {prestacaoContaAno !== null && (
                              <button
                                onClick={() => setPrestacaoContaAno(null)}
                                title="Voltar ao ano automático"
                                style={{fontSize:'10px',color:'#9b8877',background:'none',border:'none',cursor:'pointer',padding:'0 2px',textDecoration:'underline'}}
                              >
                                Auto
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Loading */}
                        {prestacaoContaLoading && (
                          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px',color:'#9b8877',fontSize:'12px'}}>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Consultando FNDE para {anoExibido}…
                          </div>
                        )}

                        {/* Sem dados para o ano selecionado */}
                        {!prestacaoContaLoading && (!prestacaoContaData?.ok || prestacaoContaData.itens.length === 0) && (
                          <div style={{padding:'12px',background: pddeData?.ok && !pddeData?.uex ? '#fef2f2' : '#faf7f2',borderRadius:'8px',border:`1px solid ${pddeData?.ok && !pddeData?.uex ? '#fca5a5' : '#ede3d3'}`,fontSize:'12px',color: pddeData?.ok && !pddeData?.uex ? '#991b1b' : '#9b8877',textAlign:'center'}}>
                            {pddeData?.ok && !pddeData?.uex
                              ? <>Sem prestação de contas — <strong>escola sem UEx cadastrada no FNDE</strong>. Não há execução a prestar.</>
                              : <>Nenhum registro encontrado para {anoExibido} no FNDE.</>
                            }
                          </div>
                        )}

                        {/* Cards por programa */}
                        {!prestacaoContaLoading && prestacaoContaData?.ok && prestacaoContaData.itens.length > 0 && (() => {
                          const isNegativo = (v: string) => !v || v === '—' || /^n[aã]o$/i.test(v.trim());

                          // Mapeia valores normalizados do FNDE → rótulo legível em português
                          const suspLabel = (raw: string | null): string => {
                            if (!raw) return '';
                            const v = raw.toUpperCase().replace(/\s+/g,' ').trim();
                            if (/inadimpl.*uex|inadimpl.*prestac/i.test(v))  return 'Inadimplência por prestação de contas (UEx)';
                            if (/omiss.*eex|omiss.*prestac/i.test(v))        return 'Omissão na prestação de contas (EEx)';
                            if (/sem dirigente/i.test(v))                    return 'UEx sem dirigente ativo';
                            if (/nao habilitad|não habilitad|exercicio atual/i.test(v)) return 'Entidade não habilitada no exercício atual (EM)';
                            if (/sem conta corrente/i.test(v))               return 'UEx sem conta corrente ativa';
                            if (/sem uex|sem \/|escola sem/i.test(v))        return 'Escola sem UEx/EM';
                            if (/cnpj irregular|receita federal/i.test(v))   return 'CNPJ irregular na Receita Federal';
                            if (/fora do prazo legal/i.test(v))              return 'Regularização fora do prazo legal';
                            if (/bloqueio|solicitacao da entidade/i.test(v)) return 'Bloqueio por solicitação da entidade ou do FNDE';
                            return raw; // fallback: mostra o texto cru do FNDE
                          };
                          // filtra atendimento do mesmo ano
                          const atenYear = String(anoExibido);
                          const atenItens: any[] = (atendimentoPcData?.itens ?? atendimentoData?.itens ?? []).filter((a: any) => a.ano === atenYear);
                          // qtd_alunos: pega do primeiro item de atendimento (é igual pra todos)
                          const qtdAlunos = atenItens[0]?.qtd_alunos ?? null;

                          return (
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                              {prestacaoContaData.itens.map((item: any, i: number) => {
                                const prog = item.ds_programa || item.programa || 'PDDE';
                                const isOkUex = item.situacao_pc_uex?.toLowerCase().includes('adimpl');
                                const isOkEex = item.situacao_pc_eex?.toLowerCase().includes('adimpl');
                                const hasSuspUex = item.suspensao_uex && !isNegativo(item.suspensao_uex);
                                const hasSuspEex = item.suspensao_eex && !isNegativo(item.suspensao_eex);
                                const temSusp = hasSuspUex || hasSuspEex;
                                // destinações desse programa no atendimento
                                const destsProg = atenItens.filter((a: any) =>
                                  (a.programa || '').toLowerCase() === prog.toLowerCase()
                                );
                                const totalPago = destsProg.reduce((s: number, d: any) => s + (d.valor_total ?? 0), 0);
                                const bgHeader = isOkUex && isOkEex && !temSusp ? '#e8f5ee' : '#fdf3e7';
                                const borderColor = isOkUex && isOkEex && !temSusp ? '#b8dfc8' : '#f0d8b8';
                                const txtHeader = isOkUex && isOkEex && !temSusp ? '#1a5c38' : '#7a4510';

                                return (
                                  <div key={i} style={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${borderColor}`}}>
                                    {/* ── Cabeçalho do programa ── */}
                                    <div style={{background:bgHeader,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'6px'}}>
                                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        <span style={{fontSize:'11px',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',color:txtHeader}}>{prog}</span>
                                        <span style={{fontSize:'10px',color:'#9b6a16',background:'#fdf3e0',borderRadius:'4px',padding:'1px 6px',fontWeight:600}}>
                                          {item.ano || anoExibido}
                                        </span>
                                        {qtdAlunos && (
                                          <span style={{fontSize:'10px',color:'#4a6a8a',background:'#e8f0fb',borderRadius:'4px',padding:'1px 6px',fontWeight:600}}>
                                            {Number(qtdAlunos).toLocaleString('pt-BR')} alunos
                                          </span>
                                        )}
                                        {(() => {
                                          const prevStr = item.valor_previsto || '';
                                          const prevNum = prevStr ? parseFloat(prevStr.replace(/\./g,'').replace(',','.')) : 0;
                                          const match = prevNum > 0 && totalPago > 0 && Math.abs(prevNum - totalPago) < 0.05;
                                          return (
                                            <span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}>
                                              {prevNum > 0 && (
                                                <span style={{fontSize:'11px',color:'#888',fontFamily:'monospace'}}>
                                                  Prev: R$ {prevStr}
                                                </span>
                                              )}
                                              {totalPago > 0 && (
                                                <span style={{fontSize:'11px',color:'#16a34a',fontFamily:'monospace',fontWeight:700}}>
                                                  Pago: {totalPago.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                                                </span>
                                              )}
                                              {match && (
                                                <span title="Valor previsto e pago compatíveis" style={{color:'#16a34a',fontSize:'13px',fontWeight:900,lineHeight:1}}>✓</span>
                                              )}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      {/* Status badges */}
                                      <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap'}}>
                                        {item.situacao_pc_uex && (
                                          <span style={{fontSize:'10px',display:'inline-flex',alignItems:'center',gap:'3px'}}>
                                            <span style={{color:'#888',fontSize:'9px'}}>UEx</span>
                                            <span className={`badge ${isOkUex ? 'badge-good' : 'badge-attn'}`}>{item.situacao_pc_uex}</span>
                                          </span>
                                        )}
                                        {item.situacao_pc_eex && (
                                          <span style={{fontSize:'10px',display:'inline-flex',alignItems:'center',gap:'3px'}}>
                                            <span style={{color:'#888',fontSize:'9px'}}>EEx</span>
                                            <span className={`badge ${isOkEex ? 'badge-good' : 'badge-attn'}`}>{item.situacao_pc_eex}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* ── Alerta de Suspensão ── */}
                                    {(hasSuspUex || hasSuspEex) && (
                                      <div style={{background:'#fef2f2',borderTop:'1px solid #fca5a5',padding:'8px 12px',display:'flex',flexDirection:'column',gap:'4px'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                                          <span style={{fontSize:'10px',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',color:'#991b1b'}}>⚠ Suspensão ativa</span>
                                        </div>
                                        {hasSuspUex && (
                                          <div style={{display:'flex',alignItems:'flex-start',gap:'6px'}}>
                                            <span style={{fontSize:'10px',fontWeight:700,color:'#7f1d1d',background:'#fee2e2',borderRadius:'4px',padding:'1px 5px',whiteSpace:'nowrap',flexShrink:0}}>UEx</span>
                                            <span style={{fontSize:'12px',color:'#7f1d1d',fontWeight:600}}>{suspLabel(item.suspensao_uex)}</span>
                                          </div>
                                        )}
                                        {hasSuspEex && (
                                          <div style={{display:'flex',alignItems:'flex-start',gap:'6px'}}>
                                            <span style={{fontSize:'10px',fontWeight:700,color:'#7f1d1d',background:'#fee2e2',borderRadius:'4px',padding:'1px 5px',whiteSpace:'nowrap',flexShrink:0}}>EEx</span>
                                            <span style={{fontSize:'12px',color:'#7f1d1d',fontWeight:600}}>{suspLabel(item.suspensao_eex)}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* ── Destinações (do atendimento) ── */}
                                    {destsProg.length > 0 ? (
                                      <div style={{background:'#fff'}}>
                                        {destsProg.map((dest: any, di: number) => (
                                          <div key={di} style={{
                                            display:'flex',alignItems:'center',justifyContent:'space-between',
                                            padding:'7px 12px',
                                            borderTop:'1px solid #f0ece4',
                                            gap:'8px',flexWrap:'wrap'
                                          }}>
                                            <span style={{fontSize:'12px',color:'#2a2018',fontWeight:500,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                              {dest.destinacao || '—'}
                                            </span>
                                            <div style={{display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
                                              {dest.data_ordem_pgto && dest.data_ordem_pgto !== '-' && (
                                                <div style={{textAlign:'right'}}>
                                                  <div style={{fontSize:'9px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.04em'}}>Data Pgto</div>
                                                  <div style={{fontSize:'11px',color:'#555',whiteSpace:'nowrap'}}>{dest.data_ordem_pgto}</div>
                                                </div>
                                              )}
                                              {dest.valor_total != null && (
                                                <div style={{textAlign:'right'}}>
                                                  <div style={{fontSize:'9px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.04em'}}>Valor</div>
                                                  <div style={{fontSize:'12px',fontFamily:'monospace',fontWeight:700,color:'#16a34a'}}>
                                                    {dest.valor_total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{padding:'8px 12px',fontSize:'11px',color:'#aaa',background:'#fff',borderTop:'1px solid #f0ece4'}}>
                                        Detalhes de destinação não disponíveis para este exercício.
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* ── 7. SIGPC — PRESTAÇÃO DE CONTAS DETALHADA ── */}
                  {(pddeCnpj || pddeData?.ok === false) && (<div style={{marginBottom:'16px'}}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> SIGPC — Prestação de Contas Detalhada
                      <a
                        href={`https://www.fnde.gov.br/sigpcadm/actionPublico.pu?tilesPublico=ConsultarSituacao`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-normal"
                        style={{textTransform:'none',letterSpacing:0}}
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir no SIGPC
                      </a>
                    </p>

                    {sigpcLoading && (
                      <div className="flex items-center gap-2 py-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Consultando SIGPC/FNDE...</span>
                      </div>
                    )}

                    {!sigpcLoading && sigpcData?.ok && sigpcData.prestacoes.length > 0 && (
                      <div className="table-card" style={{overflowX:'auto'}}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{borderBottom:'1px solid #eadfcb',background:'#f9f6f0'}}>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Programa</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Ano</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. UEx</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sit. EEx</th>
                              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Valor</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Susp.</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Exceção</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sigpcData.prestacoes.map((p: any, i: number) => {
                              const isAdimpl = p.situacaoNome?.toLowerCase().includes('adimpl');
                              const isAdimplEex = p.situacaoPcEex?.toLowerCase().includes('adimpl');
                              const hasSusp = (p.efeitoSuspensivo && !['NÃO','Não',''].includes(String(p.efeitoSuspensivo).trim())) || (p.efeitoSuspensivoEex && !['NÃO','Não',''].includes(String(p.efeitoSuspensivoEex).trim()));
                              const hasMedExc = p.medidaExcecao && !['NÃO','Não',''].includes(String(p.medidaExcecao).trim());
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f0ece4'}}>
                                  <td className="py-2 px-3 text-xs font-medium">{p.programaNome || '—'}</td>
                                  <td className="py-2 px-3 text-xs">{p.anoConcessao || '—'}</td>
                                  <td className="py-2 px-3">
                                    {p.situacaoNome
                                      ? <span className={`badge ${isAdimpl ? 'badge-good' : 'badge-attn'}`}>{p.situacaoNome}</span>
                                      : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3">
                                    {p.situacaoPcEex
                                      ? <span className={`badge ${isAdimplEex ? 'badge-good' : 'badge-attn'}`}>{p.situacaoPcEex}</span>
                                      : <span className="text-muted-foreground text-xs">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs text-right font-mono font-bold text-emerald-700">
                                    {p.valorConcessao ? brl(p.valorConcessao) : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-xs">
                                    {hasSusp ? <span className="badge badge-critical">Sim</span> : <span className="text-muted-foreground">—</span>}
                                  </td>
                                  <td className="py-2 px-3 text-xs">
                                    {hasMedExc ? <span className="badge badge-attn">{p.medidaExcecao}</span> : <span className="text-muted-foreground">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!sigpcLoading && (!sigpcData?.ok || sigpcData?.prestacoes?.length === 0) && (
                      <div className="soft-card" style={{padding:'14px',display:'flex',alignItems:'flex-start',gap:'12px'}}>
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-700 mb-1">
                            {sigpcData?.fonte === 'indisponivel'
                              ? 'SIGPC indisponível na API aberta do FNDE'
                              : 'Nenhuma prestação de contas encontrada no SIGPC para este ano'}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {sigpcData?.fonte === 'indisponivel'
                              ? 'O serviço OLINDA do FNDE está com instabilidade na consulta de Prestação de Contas (erro interno no banco de dados do FNDE). Os dados ficam disponíveis automaticamente quando o FNDE restaurar o serviço.'
                              : `Não foram localizados registros para o CNPJ ${pddeCnpj || 'da UEx'} no SIGPC em ${pddeAno}. Tente outro ano ou consulte diretamente pelo site.`}
                          </p>
                          <a
                            href={sigpcData?.sigpcUrl || "https://www.fnde.gov.br/sigpcadm/sistema.pu?operation=localizar"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Consultar diretamente no SIGPC (FNDE)
                          </a>
                        </div>
                      </div>
                    )}
                  </div>)}

                  {/* ── sem dados ── */}
                  {!pddeLoading && !pddeSaldosLoading && !pddeExecFinLoading && !cadastralLoading && !prestacaoContaLoading && !atendimentoLoading && !pddeData?.ok && !pddeSaldosData?.ok && !pddeExecFinData?.ok && !cadastralData?.ok && !prestacaoContaData?.ok && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Dados financeiros não disponíveis para esta escola no momento.</p>
                    </div>
                  )}

                  <div style={{paddingTop:'12px',borderTop:'1px solid #f0ece4',marginTop:'4px'}}>
                    <p style={{fontSize:'11px',color:'var(--m-muted)',lineHeight:'1.6'}}>
                      Dados obtidos do PDDE Info e Dados Abertos do FNDE (2020–2026). Para dados oficiais, acesse{' '}
                      <a href="https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar" target="_blank" rel="noopener noreferrer" style={{color:'var(--m-blue)',textDecoration:'underline'}}>PDDE Info</a>.
                    </p>
                  </div>

                  {/* ── LINKS ÚTEIS ── */}
                  <div style={{marginTop:'16px',display:'flex',gap:'16px',flexWrap:'wrap',alignItems:'flex-start'}}>
                    <div className="soft-card theme-blue" style={{flex:'1 1 280px'}}>
                      <div className="attention-head"><Link2 size={14} /><strong>Links Úteis</strong></div>
                      <div className="link-list">
                        {[
                          { nome: 'PDDE Interativo', url: 'https://pddeinterativo.mec.gov.br' },
                          { nome: 'Portal FNDE', url: 'https://www.fnde.gov.br' },
                          { nome: 'Dados INEP', url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos' },
                          { nome: 'PDDE Info', url: 'https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar' },
                        ].map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.nome} <ExternalLink className="w-3 h-3" style={{display:'inline',marginLeft:'4px'}} />
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="footer-note" style={{flex:'1 1 280px'}}>
                      <strong className="scribble flex items-center gap-1"><MapPin size={12} /> Nota sobre os dados</strong>
                      <p style={{margin:'8px 0 0',fontSize:'13px'}}>Os dados financeiros são obtidos em tempo real do PDDE Info e dos Dados Abertos do FNDE. Podem apresentar atraso ou indisponibilidade. Os dados censais são do Censo Escolar INEP/MEC.</p>
                    </div>
                  </div>


                </section>
              </>
                );
              })()

            ) : (
              <Card className="card-clay">
                <CardContent className="py-12 text-center">
                  <School className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Escola não encontrada.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { if (activeTabId !== "overview") closeTab(activeTabId); }}>
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            )}
              </>
            )}

        </div>


      {/* ── Modal flutuante: detalhes do estado clicado ── */}
      {clickedUf && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setClickedUf(null)}
        >
          {/* backdrop */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} />

          {/* card */}
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: "28px 28px 24px",
              width: "min(420px, 92vw)",
              maxHeight: "85vh",
              overflowY: "auto",
              animation: "uf-pop .18s cubic-bezier(.34,1.56,.64,1)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`@keyframes uf-pop { from { opacity:0; transform:scale(.85) translateY(24px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

            {/* cabeçalho */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin style={{ width: 18, height: 18, color: "#3b82f6", flexShrink: 0 }} />
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{UF_NAMES[clickedUf] || clickedUf}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, background: "#dbeafe", color: "#1d4ed8", borderRadius: 99, padding: "2px 10px" }}>{clickedUf}</span>
                </div>
                {evolucaoData?.escola?.sg_uf === clickedUf && (
                  <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, background: "#fef3c7", color: "#92400e", borderRadius: 99, padding: "2px 10px", fontWeight: 600 }}>⭐ Estado da sua escola</span>
                )}
              </div>
              <button
                onClick={() => setClickedUf(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 99, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}
              >
                <X style={{ width: 16, height: 16, color: "#64748b" }} />
              </button>
            </div>

            {ufStatsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14, padding: "16px 0" }}>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                Carregando dados do estado...
              </div>
            ) : ufStatsData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Números principais */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#eff6ff", borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#1d4ed8" }}>{ufStatsData.total_escolas?.toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5.5" width="12" height="7.5" rx="0.5"/><polyline points="1,5.5 7,1.5 13,5.5"/><rect x="5" y="9.5" width="4" height="3.5"/></svg>
                      escolas
                    </div>
                  </div>
                  <div style={{ background: "#ecfdf5", borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#065f46" }}>{ufStatsData.total_matriculas?.toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 12, color: "#059669", marginTop: 2, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1L1 4.5l6 3 6-3L7 1z"/><path d="M1 4.5v4c0 0 2 2 6 2s6-2 6-2v-4"/><line x1="13" y1="4.5" x2="13" y2="9.5"/></svg>
                      matrículas
                    </div>
                  </div>
                </div>

                {/* Por rede */}
                {ufStatsData.por_dependencia && Object.keys(ufStatsData.por_dependencia).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Por rede</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Object.entries(ufStatsData.por_dependencia as Record<string, number>)
                        .sort(([,a],[,b]) => b - a)
                        .map(([dep, n]) => {
                          const total = ufStatsData.total_escolas || 1;
                          const pct = Math.round((n / total) * 100);
                          const colors: Record<string, string> = { Municipal: "#3b82f6", Estadual: "#8b5cf6", Federal: "#f59e0b", Privada: "#10b981" };
                          const color = colors[dep] || "#6b7280";
                          return (
                            <div key={dep}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span style={{ color: "#334155" }}>{dep}</span>
                                <span style={{ fontWeight: 600, color }}>{(n as number).toLocaleString("pt-BR")} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({pct}%)</span></span>
                              </div>
                              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width .4s" }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Rural vs Urbana */}
                {ufStatsData.por_localizacao && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {Object.entries(ufStatsData.por_localizacao as Record<string, number>).map(([loc, n]) => (
                      <div key={loc} style={{ flex: 1, borderRadius: 14, padding: "10px 8px", textAlign: "center", background: loc === "Rural" ? "#f0fdf4" : "#f0f9ff" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: loc === "Rural" ? "#16a34a" : "#0284c7" }}>{(n as number).toLocaleString("pt-BR")}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                          {loc === "Rural" ? (
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1v12M4 4c0 0 1 3 3 3s3-3 3-3M2 8c0 0 2 3 5 3s5-3 5-3"/></svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="7" width="4" height="6"/><rect x="5" y="4" width="4" height="9"/><rect x="9" y="6" width="4" height="7"/><line x1="0.5" y1="13" x2="13.5" y2="13"/></svg>
                          )}
                          {loc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top municípios */}
                {ufStatsData.top_municipios?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Municípios com mais escolas</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {ufStatsData.top_municipios.slice(0, 5).map((m: any, i: number) => (
                        <div key={m.municipio} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, minWidth: 18, textAlign: "right" }}>{i + 1}.</span>
                            <span style={{ color: "#1e293b", fontWeight: 500 }}>{m.municipio}</span>
                          </span>
                          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{m.escolas.toLocaleString("pt-BR")} escolas</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações do Censo 2024→2025 */}
                {censoInsightsUFLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Carregando observações do Censo...
                  </div>
                )}
                {!censoInsightsUFLoading && censoInsightsUF?.campos?.length > 0 && (() => {
                  const destaques = censoInsightsUF.campos
                    .filter((c: any) => c.diff_pp !== 0 && c.pct_2025 > 0)
                    .sort((a: any, b: any) => Math.abs(b.diff_pp) - Math.abs(a.diff_pp))
                    .slice(0, 5);
                  if (!destaques.length) return null;
                  return (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display:"flex", alignItems:"center", gap:5 }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="8" width="3" height="5" rx="0.4"/><rect x="5.5" y="5" width="3" height="8" rx="0.4"/><rect x="10" y="2" width="3" height="11" rx="0.4"/><line x1="0.5" y1="13.5" x2="13.5" y2="13.5"/></svg>
                        Censo Escolar — mudanças 2024→2025
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {destaques.map((cam: any) => {
                          const ganhou = cam.diff_pp > 0;
                          const abs = Math.abs(cam.diff_pp);
                          return (
                            <div key={cam.key} style={{ background: ganhou ? "#f0fdf4" : "#fff5f5", borderRadius: 12, padding: "10px 12px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{cam.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: ganhou ? "#16a34a" : "#dc2626", flexShrink: 0, marginLeft: 8 }}>
                                  {ganhou ? "▲" : "▼"} {abs.toFixed(1)} p.p.
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                                {cam.pct_2024}% em 2024 → <strong style={{ color: "#334155" }}>{cam.pct_2025}%</strong> em 2025
                                {ganhou
                                  ? <span style={{ color: "#16a34a", marginLeft: 6 }}>+{Math.round((cam.total_2025 - cam.total_2024))} escolas</span>
                                  : <span style={{ color: "#dc2626", marginLeft: 6 }}>{Math.round(cam.total_2025 - cam.total_2024)} escolas</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              <p style={{ fontSize: 14, color: "#94a3b8", padding: "16px 0" }}>Sem dados disponíveis para {clickedUf}.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Modal flutuante: escolas similares ── */}
      {similarMode && (() => {
        const todasEscolas = (similarData?.escolas || []);

        const grupos = [
          { label: "Na mesma cidade", cor: "#0d9488", bg: "#f0fdfa", test: (d: number) => d === 0 },
          { label: "Próximas · até 50 km", cor: "#2563eb", bg: "#eff6ff", test: (d: number) => d > 0 && d <= 50 },
          { label: "Na região · até 200 km", cor: "#7c3aed", bg: "#f5f3ff", test: (d: number) => d > 50 && d <= 200 },
          { label: "No estado · acima de 200 km", cor: "#64748b", bg: "#f8fafc", test: (d: number) => d > 200 || d == null },
        ];

        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => { setSimilarMode(false); setSimilarClickedUf(null); }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} />
            <div
              style={{
                position: "relative", background: "#fff", borderRadius: 20,
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)", padding: "24px 24px 0",
                width: "min(600px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column",
                animation: "uf-pop .18s cubic-bezier(.34,1.56,.64,1)",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Cabeçalho */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f766e", display: 'flex', alignItems: 'center', gap: 7 }}><Search size={16} /> Escolas com perfil similar</div>
                  {similarData && (
                    <div style={{ margin: "6px 0 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, background: "#f0fdf4", color: "#15803d", borderRadius: 99, padding: "2px 10px", fontWeight: 600 }}>
                        {similarData.total} escolas encontradas
                      </span>
                      <span style={{ fontSize: 12, background: "#eff6ff", color: "#1d4ed8", borderRadius: 99, padding: "2px 10px" }}>
                        <Building2 size={12} style={{display:'inline',verticalAlign:'middle'}} /> {similarData.escola_base?.dependencia}
                      </span>
                      <span style={{ fontSize: 12, background: "#fef9c3", color: "#854d0e", borderRadius: 99, padding: "2px 10px" }}>
                        {similarData.escola_base?.localizacao === "Rural" ? <><Leaf size={12} style={{display:'inline',verticalAlign:'middle'}} /> Rural</> : <><Building size={12} style={{display:'inline',verticalAlign:'middle'}} /> Urbana</>}
                      </span>
                      {similarData.escola_base?.modalidades && (
                        <span style={{ fontSize: 12, background: "#fdf4ff", color: "#7e22ce", borderRadius: 99, padding: "2px 10px" }}>
                          <BookOpen size={12} style={{display:'inline',verticalAlign:'middle'}} /> {similarData.escola_base.modalidades}
                        </span>
                      )}
                      {similarData.escola_base?.icg_nivel != null && (
                        <span style={{ fontSize: 12, background: "#fff7ed", color: "#c2410c", borderRadius: 99, padding: "2px 10px" }}>
                          ICG Nível {similarData.escola_base.icg_nivel}
                        </span>
                      )}
                      <span style={{ fontSize: 11, background: similarData.distancia_tipo === "rodoviária" ? "#ecfdf5" : "#f1f5f9", color: similarData.distancia_tipo === "rodoviária" ? "#065f46" : "#475569", borderRadius: 99, padding: "2px 10px" }}>
                        {similarData.distancia_tipo === "rodoviária" ? <><MapPin size={12} style={{display:'inline',verticalAlign:'middle'}} /> km por estrada</> : <><Ruler size={12} style={{display:'inline',verticalAlign:'middle'}} /> km em linha reta</>}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setSimilarMode(false); setSimilarClickedUf(null); }}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: 99, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}
                >
                  <X style={{ width: 16, height: 16, color: "#64748b" }} />
                </button>
              </div>

              {similarLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14, padding: "32px 0", justifyContent: "center" }}>
                  <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                  Buscando escolas similares…
                </div>
              ) : similarData ? (
                <>
                  {/* Lista agrupada por proximidade */}
                  <div style={{ overflowY: "auto", flex: 1, paddingBottom: 24 }}>
                    {todasEscolas.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: 14, padding: "16px 0" }}>Nenhuma escola encontrada com perfil similar no mesmo estado.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {grupos.map(grupo => {
                          const escolas = todasEscolas
                            .filter((e: any) => grupo.test(e.distancia_km ?? 9999))
                            .sort((a: any, b: any) => (a.distancia_km ?? 9999) - (b.distancia_km ?? 9999));
                          if (escolas.length === 0) return null;
                          return (
                            <div key={grupo.label}>
                              {/* Cabeçalho do grupo */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ height: 2, flex: 1, background: grupo.cor, opacity: 0.25, borderRadius: 99 }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: grupo.cor, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                  {grupo.label} · {escolas.length} escola{escolas.length > 1 ? "s" : ""}
                                </span>
                                <div style={{ height: 2, flex: 1, background: grupo.cor, opacity: 0.25, borderRadius: 99 }} />
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {escolas.map((escola: any) => (
                                  <div key={escola.inep} style={{ background: grupo.bg, borderRadius: 14, padding: "12px 14px", border: `1px solid ${grupo.cor}22` }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", lineHeight: 1.4, flex: 1 }}>{escola.nome}</div>
                                      <button
                                        onClick={() => {
                                          setSimilarMode(false);
                                          setSimilarClickedUf(null);
                                          selectSchool(escola.inep, escola.nome);
                                        }}
                                        style={{ fontSize: 11, padding: "3px 10px", background: grupo.cor, color: "#fff", border: "none", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                                      >
                                        Ver ficha →
                                      </button>
                                    </div>
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                                      <span style={{ fontSize: 12, background: "#fff", color: "#374151", borderRadius: 99, padding: "2px 8px", border: "1px solid #e5e7eb" }}>
                                        <MapPin size={11} style={{display:'inline',verticalAlign:'middle'}} /> {escola.municipio}/{escola.uf}
                                      </span>
                                      {escola.distancia_km != null && (
                                        <span style={{ fontSize: 12, background: grupo.cor, color: "#fff", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>
                                          {escola.distancia_km === 0 ? "Mesma cidade" : `≈ ${escola.distancia_km} km`}
                                        </span>
                                      )}
                                      <span style={{ fontSize: 12, background: "#fef3c7", color: "#92400e", borderRadius: 99, padding: "2px 8px" }}>
                                        <GraduationCap size={11} style={{display:'inline',verticalAlign:'middle'}} /> {escola.matriculas?.toLocaleString("pt-BR") || "—"} alunos
                                      </span>
                                      {escola.icg_nivel != null && (
                                        <span style={{ fontSize: 11, background: "#fff7ed", color: "#c2410c", borderRadius: 99, padding: "2px 8px" }}>ICG {escola.icg_nivel}</span>
                                      )}
                                      {escola.modalidades?.map((m: string) => (
                                        <span key={m} style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", borderRadius: 99, padding: "2px 8px" }}>{m}</span>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                                      {escola.ds_endereco && (
                                        <div style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11} /> {escola.ds_endereco}{escola.no_bairro ? `, ${escola.no_bairro}` : ""}{escola.co_cep ? ` · CEP ${escola.co_cep}` : ""}</div>
                                      )}
                                      {escola.telefone ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                          <span style={{display:'flex',alignItems:'center',gap:4}}><Phone size={11} /> {escola.telefone}</span>
                                          <button
                                            onClick={() => navigator.clipboard.writeText(escola.telefone)}
                                            style={{ fontSize: 11, padding: "2px 8px", background: "#0d9488", color: "#fff", border: "none", borderRadius: 99, cursor: "pointer" }}
                                          >
                                            copiar
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ color: "#94a3b8", marginTop: 2, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> Telefone não disponível no Censo</div>
                                      )}
                                      <div style={{ color: "#cbd5e1", fontSize: 11, marginTop: 2 }}>INEP: {escola.inep}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        );
      })()}

        </div>{/* fim card grandão */}
      </main>
      <Footer />
    </div>
  );
}

function EvolutionChart({ data, lines, unit, large, referenceLines }: { title?: string; data: any[]; lines: { key: string; color: string; name: string }[]; icon?: React.ReactNode; description?: string; unit?: string; large?: boolean; referenceLines?: Array<{ y: number; label: string; color?: string }> }) {
  const hasData = data.some(d => lines.some(l => d[l.key] != null && d[l.key] !== 0));
  if (!hasData) return null;

  const unitSuffix = unit || '';
  const multiSeries = lines.length > 1;

  const formatValue = (value: number) => {
    if (typeof value !== 'number') return value;
    const formatted = Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    return `${formatted}${unitSuffix}`;
  };

  const renderLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value == null || value === 0) return <g />;
    const display = typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })) : value;
    return (
      <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#555">
        {display}{unitSuffix}
      </text>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={large ? 300 : 140}>
        <BarChart data={data} margin={{ top: large ? 28 : 5, right: referenceLines && referenceLines.length > 0 ? 60 : 5, bottom: 5, left: -10 }} barCategoryGap={large ? "25%" : "30%"}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={`bg-${line.key}`} id={`bg-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={1} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          {large && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />}
          <XAxis dataKey="ano" tick={{ fontSize: large ? 13 : 10, fontWeight: large ? 600 : 400 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: large ? 11 : 9 }} tickFormatter={(v) => `${v}${unitSuffix}`} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            formatter={(value: number, name: string) => [formatValue(value), name]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{ borderRadius: "12px", border: "none", fontSize: large ? "13px" : "11px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "10px 14px", background: "white" }}
            cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }}
          />
          {multiSeries && <Legend iconType="circle" iconSize={large ? 10 : 8} wrapperStyle={{ fontSize: large ? "12px" : "10px", paddingTop: 8 }} />}
          {(referenceLines || []).map((rl) => (
            <ReferenceLine
              key={`rl-${rl.y}`}
              y={rl.y}
              stroke={rl.color || '#e74c3c'}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{ value: rl.label, position: 'right', fontSize: 10, fontWeight: 700, fill: rl.color || '#e74c3c' }}
            />
          ))}
          {lines.map((line) => (
            <Bar
              key={line.key}
              dataKey={line.key}
              fill={`url(#bg-${line.key})`}
              name={line.name}
              radius={[6, 6, 0, 0]}
              maxBarSize={large ? 44 : 32}
              {...(large && lines.length <= 2 ? { label: renderLabel } : {})}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ icon, value, label, color, delta }: { icon: React.ReactNode; value: string; label: string; color: string; delta?: number }) {
  return (
    <div className={`px-3 py-2 rounded-xl ${color} border border-border/10`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-lg font-bold">{value}</span>
        {delta != null && delta !== 0 && (
          <span className={`text-[10px] font-semibold ml-auto ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function IndicatorSection({ title, icon, expanded = true, onToggle, children }: {
  title: string; icon: React.ReactNode; expanded?: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="card-clay">
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-muted-foreground">{icon}</span>
            <span className="mural-section-h2">{title}</span>
          </div>
          <span className="text-muted-foreground shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function IndicatorRows({ data }: { data: any }) {
  if (!data) return null;
  if (Array.isArray(data)) {
    return (
      <>
        {data.map((item: any, idx: number) => (
          <div key={idx} className="col-span-full">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(item)
                .filter(([k]) => k !== 'co_entidade' && k !== 'ano')
                .map(([k, v]) => (
                  <InfoItem key={k} label={k.replace(/_/g, ' ')} value={v as any} />
                ))}
            </div>
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {Object.entries(data)
        .filter(([k]) => k !== 'co_entidade' && k !== 'ano')
        .map(([k, v]) => (
          <InfoItem key={k} label={k.replace(/_/g, ' ')} value={v as any} />
        ))}
    </>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string | number | null | undefined; highlight?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const displayValue = typeof value === 'number' ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })) : String(value);
  const isZero = value === 0;
  return (
    <div className={`flex items-baseline justify-between gap-2 px-3 py-2 rounded-lg border ${highlight ? 'bg-accent/5 border-accent/20' : 'bg-card border-border/40'}`}>
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${isZero ? 'text-muted-foreground/40' : highlight ? 'text-accent' : 'text-emerald-700'}`}>{displayValue}</span>
    </div>
  );
}

function InfraItem({ label, value }: { label: string; value: number | undefined | null }) {
  if (value === undefined || value === null) return null;
  const yes = value === 1;
  return (
    <div className="flex items-center gap-2 py-1 px-2">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${yes ? 'bg-green-500' : 'bg-red-300'}`} />
      <span className={`text-xs ${yes ? 'text-foreground' : 'text-muted-foreground/60 line-through decoration-muted-foreground/30'}`}>{label}</span>
    </div>
  );
}
