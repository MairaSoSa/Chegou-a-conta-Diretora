import { storage } from "./storage";

export async function seedDatabase() {
  const glossaryItems = await storage.getGlossary();
  if (glossaryItems.length === 0) {
    const glossaryData = [
      { term: 'Adesão', explanation: 'Quando a escola "se inscreve" pra receber um dinheiro. Nem toda verba cai automaticamente — pra algumas, você precisa fazer a adesão no sistema do FNDE.', letter: 'A', iconName: 'Handshake', sortOrder: 1 },
      { term: 'APM', explanation: 'Associação de Pais e Mestres. É uma das formas de UEx (Unidade Executora) que pode receber o dinheiro em nome da escola.', letter: 'A', iconName: 'Users', sortOrder: 2 },
      { term: 'Ata', explanation: 'Documento que registra o que foi decidido numa reunião. Toda vez que o Conselho se reúne pra aprovar uma compra, precisa fazer uma ata.', letter: 'A', iconName: 'FileText', sortOrder: 3 },
      { term: 'Capital', explanation: 'Dinheiro pra comprar coisas que duram: móveis, computadores, ventiladores. São bens permanentes que ficam na escola por anos.', letter: 'C', iconName: 'Laptop', sortOrder: 4 },
      { term: 'Censo Escolar', explanation: 'Pesquisa anual obrigatória que toda escola preenche. Os números do Censo definem quanto dinheiro sua escola vai receber — por isso é tão importante preencher direitinho!', letter: 'C', iconName: 'ClipboardList', sortOrder: 5 },
      { term: 'CNPJ', explanation: 'Cadastro Nacional de Pessoa Jurídica. Sua UEx (APM ou Conselho Escolar) precisa ter um CNPJ pra poder receber o dinheiro na conta bancária.', letter: 'C', iconName: 'Hash', sortOrder: 6 },
      { term: 'Conselho Escolar', explanation: 'Grupo formado por pais, professores, funcionários e alunos que decide junto com a diretora como usar o dinheiro da escola. Todas as compras precisam da aprovação deles.', letter: 'C', iconName: 'Users', sortOrder: 7 },
      { term: 'Custeio', explanation: 'Dinheiro pra gastar com coisas do dia a dia: material de limpeza, papel, caneta, pequenos reparos. São coisas que "acabam" ou "gastam".', letter: 'C', iconName: 'Banknote', sortOrder: 8 },
      { term: 'Empenho', explanation: 'Quando o governo "reserva" o dinheiro pra mandar pra escola. É como uma promessa: "esse valor vai ser liberado pra vocês".', letter: 'E', iconName: 'PiggyBank', sortOrder: 9 },
      { term: 'FNDE', explanation: 'Fundo Nacional de Desenvolvimento da Educação. É o órgão do governo federal que manda o dinheiro pra escola. Pense nele como o "banco" que libera as verbas.', letter: 'F', iconName: 'Building2', sortOrder: 10 },
      { term: 'IDEB', explanation: 'Índice de Desenvolvimento da Educação Básica. É a "nota" da sua escola, calculada com base na aprovação dos alunos e nas provas do Saeb. Vai de 0 a 10.', letter: 'I', iconName: 'GraduationCap', sortOrder: 11 },
      { term: 'INEP', explanation: 'Instituto Nacional de Estudos e Pesquisas Educacionais. É quem faz o Censo Escolar e calcula o IDEB. Cada escola tem um código INEP de 8 números.', letter: 'I', iconName: 'School', sortOrder: 12 },
      { term: 'Licitação', explanation: 'Processo de compra que segue regras públicas pra garantir o melhor preço. Pra compras com dinheiro do PDDE, em geral basta pesquisa de preço (3 orçamentos).', letter: 'L', iconName: 'Gavel', sortOrder: 13 },
      { term: 'Nota Fiscal', explanation: 'Documento que comprova a compra. Toda compra feita com dinheiro público PRECISA de nota fiscal — sem ela, a prestação de contas não é aprovada.', letter: 'N', iconName: 'Receipt', sortOrder: 14 },
      { term: 'PAR', explanation: 'Plano de Ações Articuladas. É o plano que o município faz junto com o MEC. Algumas verbas dependem do PAR estar atualizado.', letter: 'P', iconName: 'ClipboardList', sortOrder: 15 },
      { term: 'PDDEWeb', explanation: 'Sistema online do FNDE onde você faz a prestação de contas do PDDE. É pelo site pddeinterativo.mec.gov.br.', letter: 'P', iconName: 'Laptop', sortOrder: 16 },
      { term: 'Pesquisa de Preço', explanation: 'Antes de comprar, você precisa pegar pelo menos 3 orçamentos de fornecedores diferentes. Isso prova que você escolheu o melhor preço.', letter: 'P', iconName: 'Search', sortOrder: 17 },
      { term: 'Plano de Aplicação', explanation: 'Documento onde você lista TUDO que pretende comprar com o dinheiro recebido. É como uma "lista de compras" aprovada pelo Conselho Escolar.', letter: 'P', iconName: 'FileSignature', sortOrder: 18 },
      { term: 'Prestação de Contas', explanation: 'Documentos que você manda pro governo mostrando como o dinheiro foi usado. É como um "recibo" de tudo que comprou e pagou.', letter: 'P', iconName: 'FileCheck', sortOrder: 19 },
      { term: 'Pregão', explanation: 'Tipo de licitação. Pra valores maiores, a compra precisa ser por pregão. No PDDE básico, geralmente não precisa — basta a pesquisa de preço.', letter: 'P', iconName: 'Gavel', sortOrder: 20 },
      { term: 'Repasse', explanation: 'Quando o dinheiro sai do governo e cai na conta da escola. Também chamado de "transferência" ou "liberação".', letter: 'R', iconName: 'Coins', sortOrder: 21 },
      { term: 'Saldo', explanation: 'Dinheiro que sobrou na conta e não foi usado. Atenção: saldo alto pode significar que a escola não está usando o recurso — e isso pode gerar problemas na prestação de contas.', letter: 'S', iconName: 'CircleDollarSign', sortOrder: 22 },
      { term: 'SIGPC', explanation: 'Sistema de Gestão de Prestação de Contas. É o sistema online onde você envia a prestação de contas do PDDE pro FNDE.', letter: 'S', iconName: 'Laptop', sortOrder: 23 },
      { term: 'TCE', explanation: 'Tribunal de Contas do Estado. É o órgão que fiscaliza se o dinheiro público está sendo usado direitinho. Pode auditar as contas da escola.', letter: 'T', iconName: 'ShieldCheck', sortOrder: 24 },
      { term: 'Tombamento', explanation: 'Registrar os bens comprados com dinheiro público. Todo equipamento (computador, ventilador etc.) precisa receber uma etiqueta com número de patrimônio.', letter: 'T', iconName: 'Package', sortOrder: 25 },
      { term: 'UEx', explanation: 'Unidade Executora. É a entidade que recebe e gerencia o dinheiro em nome da escola. Geralmente é a APM (Associação de Pais e Mestres) ou o Conselho Escolar.', letter: 'U', iconName: 'Users', sortOrder: 26 },
      { term: 'Verba de Custeio e Capital', explanation: 'O dinheiro do PDDE vem dividido: parte é pra custeio (material do dia a dia) e parte é pra capital (bens permanentes). Você NÃO pode misturar.', letter: 'V', iconName: 'Scale', sortOrder: 27 },
    ];
    for (const item of glossaryData) {
      await storage.createGlossaryItem(item);
    }
  }

  const existingTools = await storage.getTools();
  if (existingTools.length === 0) {
    const toolsData = [
      { title: 'Plano de Aplicação', category: 'planejar', description: 'Planilha pra planejar como usar o dinheiro do PDDE', type: 'excel', featured: true, sortOrder: 1 },
      { title: 'Ata de Reunião', category: 'planejar', description: 'Documento pra registrar decisões do Conselho', type: 'word', featured: false, sortOrder: 2 },
      { title: 'Calendário de Prazos', category: 'planejar', description: 'Todos os prazos importantes do ano', type: 'excel', featured: false, sortOrder: 3 },
      { title: 'Lista de Prioridades', category: 'planejar', description: 'O que a escola mais precisa antes de gastar', type: 'checklist', featured: false, sortOrder: 4 },
      { title: 'Convocação de Reunião', category: 'planejar', description: 'Modelo pra convocar o Conselho Escolar', type: 'word', featured: false, sortOrder: 5 },
      { title: 'Pesquisa de Preços', category: 'pesquisar', description: 'Compare até 5 fornecedores lado a lado', type: 'excel', featured: true, sortOrder: 6 },
      { title: 'Cadastro de Fornecedores', category: 'pesquisar', description: 'Contatos organizados com CNPJ e telefone', type: 'excel', featured: false, sortOrder: 7 },
      { title: 'Análise de Fornecedor', category: 'pesquisar', description: 'Verificação antes de escolher fornecedor', type: 'checklist', featured: false, sortOrder: 8 },
      { title: 'Pedido de Orçamento', category: 'pesquisar', description: 'Carta formal pra pedir orçamento', type: 'word', featured: false, sortOrder: 9 },
      { title: 'Autorização de Compra', category: 'comprar', description: 'Autoriza a compra após aprovação do Conselho', type: 'word', featured: true, sortOrder: 10 },
      { title: 'Controle de Pagamentos', category: 'comprar', description: 'Registra cada pagamento: data, valor, NF', type: 'excel', featured: false, sortOrder: 11 },
      { title: 'Checklist de NF', category: 'comprar', description: 'Confira a nota fiscal antes de pagar', type: 'checklist', featured: false, sortOrder: 12 },
      { title: 'Contratação de Serviço', category: 'comprar', description: 'Modelo pra contratar manutenção, pintura', type: 'word', featured: false, sortOrder: 13 },
      { title: 'Recebimento de Material', category: 'receber', description: 'Documento pra assinar quando material chegar', type: 'word', featured: true, sortOrder: 14 },
      { title: 'Checklist de Conferência', category: 'receber', description: 'Conferir se chegou igual ao pedido', type: 'checklist', featured: false, sortOrder: 15 },
      { title: 'Atestado de Serviço', category: 'receber', description: 'Atestar que serviço foi executado', type: 'word', featured: false, sortOrder: 16 },
      { title: 'Controle de Patrimônio', category: 'receber', description: 'Registrar bens: móveis, equipamentos', type: 'excel', featured: false, sortOrder: 17 },
      { title: 'Demonstrativo', category: 'prestar', description: 'Resumo de tudo que foi gasto no período', type: 'excel', featured: true, sortOrder: 18 },
      { title: 'Relação de Pagamentos', category: 'prestar', description: 'Lista todos os pagamentos por data', type: 'excel', featured: false, sortOrder: 19 },
      { title: 'Conciliação Bancária', category: 'prestar', description: 'Conferir se extrato bate com registros', type: 'excel', featured: false, sortOrder: 20 },
      { title: 'Checklist Final', category: 'prestar', description: 'Todos os documentos antes de enviar', type: 'checklist', featured: false, sortOrder: 21 },
      { title: 'Declaração de Parentes', category: 'prestar', description: 'Não houve contratação de familiares', type: 'word', featured: false, sortOrder: 22 },
    ];
    for (const tool of toolsData) {
      await storage.createTool(tool);
    }
  }

  const existingUnits = await storage.getTrilhaUnits();
  if (existingUnits.length === 0) {
    const trilhaData = [
      { unitId: 'U00', part: 0, title: 'Boas-vindas: o mapa do rio', subtitle: 'Entenda como usar a trilha', duration: '10 min', intro: 'Bem-vinda ao Mapa do Rio! Aqui você vai aprender tudo sobre gestão de recursos da escola, navegando de trapiche em trapiche.', sections: [{ tipo: 'texto', titulo: 'Como navegar pelo mapa', conteudo: 'O mapa mostra todos os trapiches (unidades) que você vai visitar ao longo da sua jornada de aprendizado. O barquinho mostra onde você está agora. Quando terminar um trapiche, o barquinho navega pro próximo automaticamente!' }, { tipo: 'dica', titulo: 'Seu progresso é salvo automaticamente', conteudo: 'Não se preocupe em perder onde parou. O sistema guarda seu progresso direitinho, então você pode fechar o navegador e voltar quando quiser.' }, { tipo: 'texto', titulo: 'O que você vai encontrar em cada trapiche', conteudo: 'Ao longo da trilha você vai encontrar diferentes tipos de conteúdo: textos explicando os conceitos de forma simples, checklists pra você seguir passo a passo, modelos prontos pra baixar e usar na escola, e dicas práticas do dia a dia.' }, { tipo: 'pratica', titulo: 'Mãos à obra!', conteudo: 'Ao final de cada unidade, marque como concluída pra avançar no mapa.' }], materials: [{ nome: 'Guia de Navegação', descricao: 'PDF explicando como usar a plataforma', tipo: 'pdf' }], previousUnit: null, nextUnit: 'U01', sortOrder: 0 },
      { unitId: 'U01', part: 0, title: 'Checklist de 30 dias', subtitle: 'Organize a escola em um mês', duration: '30 min', intro: 'Nos primeiros 30 dias como gestora, você vai organizar a casa! Este checklist te guia semana a semana pra criar uma rotina que funciona de verdade.', sections: [{ tipo: 'texto', titulo: 'Por que organizar nos primeiros 30 dias?', conteudo: 'O primeiro mês é fundamental pra entender como as coisas funcionam na escola.' }, { tipo: 'checklist', titulo: 'Semana 1 - Conhecer o terreno', conteudo: ['Levantar todos os programas que a escola participa', 'Verificar prestações de contas pendentes', 'Localizar documentos importantes', 'Conhecer os membros do Conselho Escolar'] }, { tipo: 'checklist', titulo: 'Semana 2 - Organizar os documentos', conteudo: ['Criar uma pasta física para cada programa', 'Criar pasta digital espelhando a organização física', 'Padronizar nomes de arquivos', 'Separar documentos por ano'] }, { tipo: 'checklist', titulo: 'Semana 3 - Estabelecer rotinas', conteudo: ['Definir um dia fixo para verificar extratos bancários', 'Agendar reunião mensal do Conselho Escolar', 'Criar checklist de conferência de notas fiscais', 'Definir responsável por cada tarefa financeira'] }, { tipo: 'checklist', titulo: 'Semana 4 - Consolidar e avaliar', conteudo: ['Fazer primeira reunião do Conselho com a nova rotina', 'Revisar o que funcionou bem e o que precisa de ajuste', 'Documentar todas as decisões em ata', 'Planejar ações do próximo mês'] }, { tipo: 'dica', titulo: 'Dica de ouro', conteudo: 'Não tente fazer tudo sozinha! Envolva a equipe e o Conselho Escolar desde o início.' }], materials: [{ nome: 'Modelo de Agenda de Reunião', descricao: 'Pauta pronta pra reunião do Conselho', tipo: 'modelo' }, { nome: 'Planilha de Controle Mensal', descricao: 'Acompanhe receitas e despesas', tipo: 'planilha' }], previousUnit: 'U00', nextUnit: 'U02', sortOrder: 1 },
      { unitId: 'U02', part: 0, title: 'Pôster: Caminho do Dinheiro', subtitle: 'Do pedido à prestação de contas', duration: '15 min', intro: 'Entenda o caminho completo que o dinheiro faz: desde quando você decide comprar algo até prestar contas pro governo.', sections: [{ tipo: 'texto', titulo: 'Etapa 1: O Pedido', conteudo: 'Tudo começa com alguém identificando uma necessidade. O importante é que o pedido esteja por escrito.' }, { tipo: 'texto', titulo: 'Etapa 2: Pesquisa de Preços', conteudo: 'Antes de comprar, pesquise pelo menos 3 preços diferentes de fornecedores.' }, { tipo: 'texto', titulo: 'Etapa 3: Autorização do Conselho', conteudo: 'O Conselho Escolar precisa aprovar a compra antes de gastar.' }, { tipo: 'texto', titulo: 'Etapa 4: Compra ou Contratação', conteudo: 'Com a aprovação, faça a compra. Guarde todos os comprovantes.' }, { tipo: 'texto', titulo: 'Etapa 5: Recebimento e Conferência', conteudo: 'Confira tudo com calma quando o material chegar.' }, { tipo: 'texto', titulo: 'Etapa 6: Nota Fiscal', conteudo: 'A nota fiscal precisa estar completa e correta.' }, { tipo: 'texto', titulo: 'Etapa 7: Pagamento', conteudo: 'Pague somente DEPOIS de receber o material ou serviço.' }, { tipo: 'texto', titulo: 'Etapa 8: Arquivo e Prestação de Contas', conteudo: 'Guarde todos os documentos organizados na pasta do programa.' }, { tipo: 'pratica', titulo: 'Coloque na parede!', conteudo: 'Imprima o pôster do Caminho do Dinheiro e cole num lugar visível da secretaria.' }], materials: [{ nome: 'Pôster Caminho do Dinheiro', descricao: 'Versão pra imprimir', tipo: 'pdf' }], previousUnit: 'U01', nextUnit: 'U03', sortOrder: 2 },
    ];

    for (const unit of trilhaData) {
      await storage.createTrilhaUnit(unit);
    }

    for (let i = 3; i <= 24; i++) {
      const id = `U${i.toString().padStart(2, '0')}`;
      const partMap: Record<number, number> = { 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 3, 15: 3, 16: 3, 17: 4, 18: 4, 19: 4, 20: 4, 21: 5, 22: 5, 23: 5, 24: 5 };
      const titleMap: Record<number, string> = {
        3: 'Da cabaça ao carimbo', 4: 'O nascimento do orçamento', 5: 'Transparência e confiança',
        6: 'Do PPP ao PAF', 7: 'Pesquisa de preços sem dor', 8: 'Rito mínimo para serviços',
        9: 'Do pedido ao pagamento', 10: 'Estoque e patrimônio', 11: 'Rotina mensal',
        12: 'Mapa de decisão', 13: 'Erros caros (e como evitar)', 14: 'Documentar é amar o futuro',
        15: 'Relatórios que alguém quer ler', 16: 'Quando algo saiu torto',
        17: 'Conselho Escolar', 18: 'Casos reais', 19: 'Exceções & emergências',
        20: 'Cultura de integridade', 21: 'Panorama das fontes federais',
        22: 'Onde procurar (e em que ordem)', 23: 'Cartões dos Programas', 24: 'Como aderir a programas'
      };
      const subtitleMap: Record<number, string> = {
        3: 'Por que prestamos contas', 4: 'Planejar antes de gastar', 5: 'O que a sociedade espera',
        6: 'Transforme o plano em ação', 7: '3 propostas, 0 dor de cabeça', 8: 'Serviço não é "qualquer coisa"',
        9: 'A rotina completa', 10: 'O que entra vira responsabilidade', 11: '15 minutos por mês',
        12: '"Quero comprar X, faço o quê?"', 13: 'Armadilhas que custam caro', 14: 'A pasta da história',
        15: '1 página trimestral', 16: 'Correção e aprendizado',
        17: 'Controle social com pé no chão', 18: 'Merenda, transporte, reparos',
        19: 'Cano estourado, geladeira quebrou', 20: 'Conflito de interesse na prática',
        21: 'PDDE, PNAE, PNATE e mais', 22: 'SEDUC, portais, diários oficiais',
        23: 'Pode, não pode, dica', 24: 'Da adesão à prestação'
      };
      const durationMap: Record<number, string> = {
        3: '20 min', 4: '25 min', 5: '20 min', 6: '30 min', 7: '25 min', 8: '25 min',
        9: '30 min', 10: '20 min', 11: '20 min', 12: '25 min', 13: '25 min', 14: '25 min',
        15: '20 min', 16: '25 min', 17: '30 min', 18: '25 min', 19: '20 min', 20: '20 min',
        21: '25 min', 22: '20 min', 23: '30 min', 24: '25 min'
      };

      await storage.createTrilhaUnit({
        unitId: id,
        part: partMap[i],
        title: titleMap[i],
        subtitle: subtitleMap[i],
        duration: durationMap[i],
        intro: 'Esta unidade está sendo desenvolvida com muito carinho. Em breve você terá acesso ao conteúdo completo.',
        sections: [{ tipo: 'texto', titulo: 'Aguarde novidades', conteudo: 'Estamos trabalhando neste conteúdo pra trazer informações práticas e úteis.' }, { tipo: 'dica', titulo: 'Continue sua jornada', conteudo: 'Enquanto isso, você pode continuar explorando os trapiches anteriores.' }],
        materials: [],
        previousUnit: `U${(i - 1).toString().padStart(2, '0')}`,
        nextUnit: i < 24 ? `U${(i + 1).toString().padStart(2, '0')}` : null,
        sortOrder: i,
      });
    }
  }

  const existingSchools = await storage.getSchools();
  if (existingSchools.length === 0) {
    await storage.createSchool({
      inep: "12345678",
      name: "Escola Municipal Rio Verde",
      city: "Rio Verde",
      state: "GO",
      network: "Municipal",
      location: "Rural",
      enrollmentCount: 312,
      dataStatus: "Parcial",
    });
  }

  const existingPrograms = await storage.getPrograms();
  if (existingPrograms.length === 0) {
    await storage.createProgram({
      code: "PDDE",
      name: "PDDE Básico",
      description: "Recursos para manutenção e pequenos reparos.",
      lastReferenceYear: 2025,
      status: "Regular",
      observation: "Consta em base pública",
    });
    await storage.createProgram({
      code: "PNAE",
      name: "PNAE",
      description: "Alimentação escolar.",
      lastReferenceYear: 2025,
      status: "Regular",
      observation: "Dado disponível",
    });
    await storage.createProgram({
      code: "PNATE",
      name: "PNATE",
      description: "Transporte escolar.",
      lastReferenceYear: 2024,
      status: "Atrasado",
      observation: "Dado possivelmente atrasado",
    });

    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "allowed",
      content: "Despesas de custeio (material de consumo, serviços).",
      category: "Financeiro",
    });
    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "allowed",
      content: "Pequenos reparos e manutenção.",
      category: "Financeiro",
    });
    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "forbidden",
      content: "Pagamento de pessoal (salários).",
      category: "Financeiro",
    });
    await storage.createProgramDetail({
      programCode: "PDDE",
      type: "forbidden",
      content: "Combustível.",
      category: "Financeiro",
    });
  }

  // Seed AI Documents for better chat responses
  const aiDocs = await storage.getAiDocuments();
  if (aiDocs.length < 5) {  // Changed from === 0 to add new docs
    // Only add if not already exists
    const existingTitles = aiDocs.map(d => d.title);
    
    if (!existingTitles.includes("O que é o PDDE")) {
      await storage.createAiDocument({
      title: "O que é o PDDE",
      content: `O PDDE (Programa Dinheiro Direto na Escola) é um programa do governo federal que transfere recursos financeiros diretamente para as escolas públicas de educação básica. O objetivo é ajudar a escola a custear suas despesas de manutenção e desenvolvimento do ensino.

O dinheiro é depositado na conta bancária da Unidade Executora da escola (APM ou Conselho Escolar). Os valores são calculados com base no número de matrículas registradas no Censo Escolar do ano anterior.

O PDDE pode ser usado para:
- Manutenção e pequenos reparos na estrutura física da escola
- Aquisição de materiais de consumo necessários ao funcionamento da escola  
- Compra de materiais permanentes (equipamentos, mobiliário)
- Desenvolvimento de atividades educacionais

O PDDE é dividido em duas categorias de despesa:
- Custeio (70%): para materiais de consumo e serviços
- Capital (30%): para bens permanentes (equipamentos, móveis)

A prestação de contas do PDDE deve ser feita anualmente através do sistema PDDEWeb, disponível no site do FNDE.`,
      });
    }

    if (!existingTitles.includes("Como fazer a prestação de contas do PDDE")) {
      await storage.createAiDocument({
      title: "Como fazer a prestação de contas do PDDE",
      content: `A prestação de contas do PDDE é obrigatória e deve ser feita anualmente através do sistema PDDEWeb (https://www.fnde.gov.br/pdde).

Documentos necessários:
1. Plano de Aplicação aprovado pelo Conselho Escolar
2. Notas fiscais de todas as compras realizadas
3. Comprovantes de pagamento (transferências bancárias, recibos)
4. Atas de reunião do Conselho Escolar aprovando as compras
5. Extrato bancário da conta da UEx
6. Demonstrativo da execução da receita e despesa
7. Conciliação bancária
8. Relação de bens adquiridos ou produzidos (quando houver)

Prazos:
- A prestação de contas deve ser apresentada até 31 de dezembro do ano seguinte ao repasse
- O não envio da prestação de contas no prazo impede novos repasses

Importante:
- Todas as despesas devem estar dentro do Plano de Aplicação aprovado
- Não misture as categorias: custeio e capital têm limites próprios
- Guarde cópia de todos os documentos por pelo menos 20 anos
- O Conselho Escolar deve aprovar a prestação de contas antes do envio`,
      });
    }

    if (!existingTitles.includes("O que pode e não pode comprar com o PDDE")) {
      await storage.createAiDocument({
      title: "O que pode e não pode comprar com o PDDE",
      content: `Com o PDDE você PODE comprar:

Materiais de Custeio (70% do valor):
- Material de limpeza e higiene
- Material de expediente (papel, canetas, grampos)
- Material didático e pedagógico
- Pequenos reparos e manutenção
- Serviços de manutenção (eletricista, encanador, pintor)

Materiais de Capital (30% do valor):
- Equipamentos e aparelhos (ventiladores, bebedouros)
- Mobiliário escolar (carteiras, mesas, armários)
- Computadores e equipamentos de informática
- Eletrodomésticos para uso da escola
- Bens permanentes em geral

Você NÃO PODE comprar com o PDDE:
- Pagamento de salários, gratificações ou qualquer tipo de remuneração a pessoal
- Combustível para veículos
- Festividades e confraternizações
- Pagamento de contas de consumo (água, luz, telefone) - essas são responsabilidade do mantenedor
- Taxa de administração ou gestão
- Multas ou juros por atraso de pagamento

Lembre-se: toda compra precisa estar justificada no Plano de Aplicação e aprovada pelo Conselho Escolar!`,
      });
    }

    if (!existingTitles.includes("Perguntas Frequentes sobre Compras com PDDE")) {
      await storage.createAiDocument({
      title: "Perguntas Frequentes sobre Compras com PDDE",
      content: `PERGUNTAS FREQUENTES - O QUE POSSO OU NÃO POSSO COMPRAR COM O PDDE

Posso comprar material de limpeza?
SIM! Material de limpeza e higiene fazem parte do custeio (70% do valor). Você pode comprar sabão, detergente, desinfetante, papel higiênico, álcool, etc.

Posso comprar papel sulfite, canetas e grampos?
SIM! Material de expediente está permitido como custeio. Pode comprar papel, canetas, lápis, grampos, clipes, cola, fita adesiva, etc.

Posso comprar carteiras e mesas para os alunos?
SIM! Mobiliário escolar é considerado capital (30% do valor). Pode comprar carteiras, mesas, cadeiras, armários, estantes, arquivos, etc.

Posso comprar ventiladores e bebedouros?
SIM! Equipamentos e aparelhos fazem parte do capital. Pode comprar ventiladores, bebedouros, geladeiras, fogões, micro-ondas para uso da escola.

Posso comprar computadores e impressoras?
SIM! Equipamentos de informática são permitidos como capital. Pode comprar computadores, notebooks, impressoras, projetores, tablets para uso pedagógico.

Posso contratar eletricista ou encanador?
SIM! Serviços de manutenção são permitidos como custeio. Pode contratar eletricista, encanador, pintor, pedreiro para pequenos reparos.

Posso pagar contas de luz e água?
NÃO! Contas de consumo (luz, água, telefone, internet) são responsabilidade do município/estado. O PDDE não pode ser usado para isso.

Posso pagar professor ou funcionário?
NÃO! Pagamento de salários, gratificações ou qualquer remuneração a pessoal é proibido. O PDDE não paga pessoas.

Posso comprar combustível para o ônibus escolar?
NÃO! Combustível para veículos não pode ser comprado com PDDE, mesmo para transporte escolar.

Posso fazer festa junina com o dinheiro?
NÃO! Festividades, confraternizações e eventos sociais não podem usar recursos do PDDE. O foco é manutenção e desenvolvimento educacional.`,
      });
    }

    if (!existingTitles.includes("Passo a passo para usar o PDDE corretamente")) {
      await storage.createAiDocument({
      title: "Passo a passo para usar o PDDE corretamente",
      content: `COMO USAR O DINHEIRO DO PDDE NA PRÁTICA

1. PLANEJE PRIMEIRO
Antes de gastar, faça uma reunião com o Conselho Escolar e liste o que a escola mais precisa. Organize por prioridade: o que é mais urgente?

2. RESPEITE AS CATEGORIAS
Lembre-se: 70% é custeio (coisas que gastam) e 30% é capital (coisas que duram). Não pode inverter!

3. PESQUISE PREÇOS
Pegue pelo menos 3 orçamentos de fornecedores diferentes. Isso é obrigatório! Escolha o melhor custo-benefício.

4. APROVE NO CONSELHO
O Conselho Escolar precisa aprovar as compras em reunião. Faça ata da reunião e guarde!

5. COMPRE E GUARDE NOTA FISCAL
Todas as compras precisam de nota fiscal em nome da UEx (APM ou Conselho). Sem nota fiscal = problema na prestação de contas.

6. PAGUE E REGISTRE
Pague preferencialmente por transferência bancária. Guarde todos os comprovantes de pagamento.

7. PRESTE CONTAS
Todo ano você precisa prestar contas no sistema PDDEWeb. Organize todos os documentos: notas, recibos, atas, extratos.

DICA DE OURO: Organize uma pasta (física e digital) com TODOS os documentos desde o início. Isso vai facilitar muito na hora da prestação de contas!`,
      });
    }
  }
}
