import Database from "better-sqlite3";

const DB_PATH = process.env.SQLITE_DATABASE_URL?.replace("file:", "") || "dev.db";

const documents = [
  {
    title: "PDDE - Programa Dinheiro Direto na Escola",
    category: "Programas",
    link: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde",
    content: `O Programa Dinheiro Direto na Escola (PDDE) é um programa do FNDE que transfere recursos financeiros diretamente para escolas públicas da educação básica. O objetivo é melhorar a infraestrutura física e pedagógica das escolas.

QUEM RECEBE: Escolas públicas da educação básica (estaduais, municipais e do DF) que possuem Unidade Executora Própria (UEx) — geralmente a APM, APP ou Caixa Escolar.

VALOR: O cálculo é feito com base no número de alunos matriculados no Censo Escolar do ano anterior. Em 2024, os valores de referência são:
- Ensino Fundamental: R$ 18,00 por aluno/ano (custeio) + R$ 10,00 por aluno/ano (capital)
- Ensino Médio: R$ 22,00 por aluno/ano (custeio) + R$ 12,00 por aluno/ano (capital)
- Educação Infantil: R$ 18,00 por aluno/ano (custeio) + R$ 10,00 por aluno/ano (capital)
- Escolas quilombolas, indígenas e do campo recebem valores acrescidos.

CUSTEIO vs CAPITAL:
- Custeio (70%): Material de consumo (limpeza, escritório, pedagógico), pequenos reparos, contratação de serviços (manutenção, instalações), despesas com cartório, material esportivo de consumo.
- Capital (30%): Equipamentos permanentes (impressora, computador, bebedouro, ventilador, mobiliário), desde que o bem tenha vida útil superior a 2 anos.

O QUE NÃO PODE COMPRAR COM O PDDE:
- Combustível e manutenção de veículos
- Pagamento de pessoal (salários, gratificações)
- Flores, presentes, festas de confraternização
- Gêneros alimentícios (isso é PNAE)
- Obras e ampliações estruturais
- Passagens e hospedagem
- Medicamentos
- Material para uso pessoal de funcionários

PRESTAÇÃO DE CONTAS: Deve ser feita até 28 de fevereiro do ano seguinte ao recebimento. Inclui:
1. Demonstrativo da Execução da Receita e da Despesa e de Pagamentos Efetuados
2. Relação de Bens Adquiridos ou Produzidos (se capital)
3. Conciliação Bancária
4. Extratos bancários de todo o período
5. Notas fiscais e recibos

PESQUISA DE PREÇOS: Obrigatória para compras acima de R$ 1.000,00. Devem ser consultados no mínimo 3 fornecedores. A pesquisa deve ser documentada com orçamentos datados e assinados.

CONTA BANCÁRIA: O recurso é depositado em conta específica no Banco do Brasil. Não pode ser misturado com outros recursos. Rendimentos de aplicação financeira devem ser usados na mesma finalidade do programa.

DELIBERAÇÃO: Toda despesa deve ser aprovada pelo Conselho Escolar ou órgão colegiado equivalente, com ata de reunião registrada.`
  },
  {
    title: "PNAE - Programa Nacional de Alimentação Escolar",
    category: "Programas",
    link: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae",
    content: `O Programa Nacional de Alimentação Escolar (PNAE) garante alimentação escolar gratuita para todos os alunos da educação básica pública. Os recursos são transferidos pelo FNDE às Entidades Executoras (EEx) — prefeituras e governos estaduais — e NÃO diretamente para as escolas.

PAPEL DA DIRETORA: Mesmo sem receber o recurso diretamente, a diretora tem papel fundamental:
- Acompanhar o cardápio elaborado pelo nutricionista
- Verificar a qualidade e quantidade dos alimentos recebidos
- Registrar problemas de entrega ou qualidade
- Comunicar ao CAE (Conselho de Alimentação Escolar) irregularidades
- Garantir condições de higiene na cozinha e refeitório
- Apoiar o trabalho das merendeiras

VALORES POR ALUNO/DIA (2024):
- Creche: R$ 1,07
- Pré-escola: R$ 0,53
- Fundamental e Médio: R$ 0,36
- EJA: R$ 0,32
- Quilombolas e Indígenas: R$ 0,64
- Integral: R$ 1,07
- Programa de Fomento às Escolas de Ensino Médio em Tempo Integral: R$ 2,00
- AEE (Atendimento Educacional Especializado): R$ 0,53

AGRICULTURA FAMILIAR: No mínimo 30% dos recursos do PNAE devem ser usados na compra de alimentos da agricultura familiar. Isso é obrigatório por lei (Lei nº 11.947/2009, Art. 14).

CARDÁPIO: Deve ser elaborado por nutricionista habilitado (responsável técnico), respeitando hábitos alimentares locais, cultura e tradição. Deve atender no mínimo 20% das necessidades nutricionais diárias dos alunos.

CAE - CONSELHO DE ALIMENTAÇÃO ESCOLAR: Órgão colegiado de caráter fiscalizador, permanente, deliberativo e de assessoramento. Formado por representantes do Poder Executivo, professores, pais e sociedade civil. A diretora deve facilitar o acesso do CAE à escola.

PROIBIÇÕES:
- Alimentos com excesso de açúcar, sódio e gorduras
- Refrigerantes e refrescos artificiais
- Alimentos enlatados, embutidos, concentrados com conservantes

DENÚNCIAS: Em caso de irregularidades, a diretora pode comunicar ao CAE municipal, à Secretaria de Educação ou diretamente ao FNDE pelo telefone 0800-616161.`
  },
  {
    title: "PNATE - Programa Nacional de Apoio ao Transporte do Escolar",
    category: "Programas",
    link: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate",
    content: `O Programa Nacional de Apoio ao Transporte do Escolar (PNATE) garante recursos para o transporte de alunos da educação básica pública residentes em área rural. Os recursos são transferidos pelo FNDE diretamente aos estados, Distrito Federal e municípios.

OBJETIVO: Garantir o acesso e a permanência dos alunos da zona rural nas escolas da educação básica.

QUEM RECEBE: Estados e municípios (a escola NÃO recebe diretamente). A diretora participa no acompanhamento e fiscalização.

CÁLCULO DO VALOR: Baseado no número de alunos da zona rural informados no Censo Escolar do ano anterior, com per capita definido pelo FNDE. Varia de acordo com a área rural (mínimo per capita por estado).

O QUE PODE SER FINANCIADO:
- Manutenção de veículos escolares (peças, combustível, pneus)
- Contratação de serviços de transporte escolar terceirizado
- Pagamento de tributos e taxas referentes ao transporte
- Seguros dos veículos
- Contratação de monitores para acompanhar os alunos

O QUE NÃO PODE:
- Compra de veículos (para isso existe o Caminho da Escola)
- Transporte de professores ou funcionários (apenas alunos)
- Pagamento de multas de trânsito

PAPEL DA DIRETORA:
- Informar à Secretaria de Educação alunos que precisam de transporte
- Registrar horários de chegada e partida dos veículos
- Comunicar irregularidades (superlotação, veículos em mau estado, motorista sem habilitação)
- Apoiar o Conselho do FUNDEB na fiscalização
- Manter registro de presença dos alunos que utilizam o transporte

FISCALIZAÇÃO: O CACS-FUNDEB (Conselho de Acompanhamento e Controle Social do FUNDEB) é responsável pela fiscalização do uso dos recursos do PNATE.

DENÚNCIAS: Irregularidades podem ser comunicadas ao FNDE, ao Tribunal de Contas do Estado/Município, ao Ministério Público ou ao CACS-FUNDEB.`
  },
  {
    title: "FUNDEB - Fundo de Manutenção e Desenvolvimento da Educação Básica",
    category: "Programas",
    link: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/fundeb",
    content: `O FUNDEB é o principal mecanismo de financiamento da educação básica no Brasil. É um fundo especial formado por 20% de impostos e transferências (ICMS, FPE, FPM, IPI-Exportação, ITR, IPVA etc.) que é redistribuído conforme o número de matrículas na rede.

FUNDEB PERMANENTE: Desde a EC 108/2020 e Lei 14.113/2020, o FUNDEB é permanente. A complementação da União aumentou significativamente:
- VAAF (Valor Aluno Ano por Fundo): Para fundos que não atingem o mínimo nacional
- VAAT (Valor Aluno Ano Total): Para redes com menor capacidade de arrecadação total
- VAAR (Valor Aluno Ano por Resultados): Para redes que melhoram indicadores educacionais

COMO FUNCIONA: Os recursos são arrecadados e redistribuídos automaticamente. Cada estado forma um fundo, e os recursos são distribuídos proporcionalmente ao número de matrículas ponderadas na rede estadual e nas redes municipais.

A ESCOLA NÃO RECEBE DIRETAMENTE, mas o FUNDEB financia:
- Pagamento de profissionais da educação (mínimo 70% dos recursos)
- Despesas de MDE (Manutenção e Desenvolvimento do Ensino): material didático, equipamentos, manutenção e conservação de prédios escolares, transporte escolar, formação de professores

PAPEL DA DIRETORA:
- Prestar informações corretas no Censo Escolar (as matrículas determinam o valor recebido)
- Participar do CACS-FUNDEB quando convidada
- Conhecer os indicadores de qualidade da escola (IDEB, taxas de aprovação, abandono)
- Acompanhar se os recursos estão chegando à escola (reformas, materiais, professores)

CACS-FUNDEB: Conselho de Acompanhamento e Controle Social do FUNDEB. Todo município e estado deve ter um. A diretora pode participar como representante dos diretores de escola.

IRREGULARIDADES COMUNS:
- Uso de recursos do FUNDEB para fins não educacionais
- Desvio para pagamento de aposentadorias
- Não cumprimento do mínimo de 70% com profissionais
- Matrículas fantasmas para inflar repasses`
  },
  {
    title: "Censo Escolar - Importância e Procedimentos",
    category: "Gestão",
    link: "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar",
    content: `O Censo Escolar é o principal instrumento de coleta de informações sobre a educação básica no Brasil. É realizado anualmente pelo INEP em regime de colaboração com as secretarias de educação.

POR QUE É TÃO IMPORTANTE PARA A DIRETORA:
- Os dados do Censo determinam o repasse de recursos do PDDE, PNAE, PNATE e FUNDEB
- Matrículas informadas incorretamente significam MENOS dinheiro para a escola
- Os indicadores educacionais (IDEB, taxas de rendimento) são calculados com base no Censo
- O planejamento de políticas públicas depende desses dados

FASES DO CENSO:
1. Matrícula Inicial (maio-junho): Coleta de dados sobre estabelecimentos, turmas, alunos e profissionais escolares
2. Situação do Aluno (fevereiro do ano seguinte): Informação sobre o rendimento (aprovação/reprovação) e movimento (transferência/abandono) de cada aluno

DADOS COLETADOS:
- Infraestrutura da escola (água, energia, esgoto, internet, acessibilidade, equipamentos)
- Turmas (etapa, modalidade, horário, atividades complementares)
- Alunos (matrícula, idade, sexo, raça/cor, necessidades especiais, transporte)
- Profissionais (formação, função, vínculo, escolaridade)

PRAZOS: O Censo segue calendário definido pelo INEP. A escola tem prazo para:
- Conferir e validar os dados no Educacenso
- Corrigir inconsistências apontadas pelo sistema
- Confirmar a situação do aluno no ano seguinte

ERROS COMUNS QUE PREJUDICAM A ESCOLA:
- Não informar alunos com deficiência (perde recursos do AEE)
- Informar turmas com menos alunos do que realmente tem
- Não atualizar infraestrutura (pode não receber recursos para melhorias)
- Não informar atividades de tempo integral (perde per capita maior)
- Deixar de informar profissionais (afeta indicadores como o IED)

DICA PARA A DIRETORA: Mantenha uma planilha interna atualizada com todas as matrículas e movimentações ao longo do ano. Isso facilita o preenchimento do Censo e evita erros.`
  },
  {
    title: "Prestação de Contas do PDDE - Passo a Passo",
    category: "Gestão Financeira",
    link: "https://www.fnde.gov.br/pddeinfo/pddeinfo",
    content: `A prestação de contas do PDDE é obrigatória e deve ser feita até 28 de fevereiro do ano seguinte ao recebimento dos recursos. A não prestação pode resultar em suspensão dos repasses.

DOCUMENTOS NECESSÁRIOS:
1. Demonstrativo da Execução da Receita e da Despesa e de Pagamentos Efetuados
2. Relação de Bens Adquiridos ou Produzidos (quando houver compra de capital)
3. Conciliação Bancária
4. Extratos bancários de todo o período (janeiro a dezembro)
5. Notas fiscais e recibos originais
6. Atas do Conselho Escolar aprovando as despesas

PASSO A PASSO:
1. Reúna todos os extratos bancários da conta do PDDE
2. Organize as notas fiscais por data
3. Verifique se cada nota fiscal está em nome da UEx (APM/Caixa Escolar)
4. Confira se os CNPJ dos fornecedores são válidos
5. Verifique se foi feita pesquisa de preços para compras acima de R$ 1.000,00
6. Preencha o demonstrativo financeiro
7. Faça a conciliação bancária (saldo do extrato vs. saldo do demonstrativo)
8. Apresente ao Conselho Escolar para aprovação
9. Envie à Secretaria de Educação (Entidade Executora)

ERROS COMUNS NA PRESTAÇÃO DE CONTAS:
- Nota fiscal em nome pessoal (deve ser em nome da UEx)
- Falta de pesquisa de preços
- Compras de capital com dinheiro de custeio (ou vice-versa)
- Pagamento em dinheiro (deve ser por transferência bancária, PIX, cheque ou cartão corporativo)
- Não ter ata do Conselho Escolar
- Saldo bancário diferente do demonstrativo
- Notas fiscais sem data ou com rasuras
- Uso de recursos para fins não permitidos

SISTEMA PDDE INTERATIVO: A prestação deve ser registrada no sistema PDDEInfo (www.fnde.gov.br/pddeinfo). A diretora acessa com login próprio.

DICA: Faça a prestação de contas ao longo do ano, não deixe tudo para fevereiro. Organize uma pasta com todos os documentos mês a mês.

SE A PRESTAÇÃO FOR REJEITADA: A UEx tem 45 dias para sanar as irregularidades após ser notificada. Se não regularizar, a escola fica inadimplente e não recebe novos recursos.`
  },
  {
    title: "Pesquisa de Preços - Como Fazer Corretamente",
    category: "Gestão Financeira",
    content: `A pesquisa de preços é obrigatória para compras com recursos do PDDE acima de R$ 1.000,00. Mesmo para valores menores, é uma boa prática que demonstra transparência.

REGRAS BÁSICAS:
- Mínimo de 3 orçamentos de fornecedores diferentes
- Orçamentos devem ser datados e conter CNPJ do fornecedor
- Deve-se escolher o menor preço (salvo justificativa documentada)
- Não podem ser fornecedores da mesma família ou do mesmo grupo econômico
- Cada orçamento deve descrever o mesmo produto/serviço para comparação justa

COMO FAZER:
1. Defina exatamente o que precisa comprar (especificação do produto/serviço)
2. Pesquise ao menos em 3 estabelecimentos ou sites confiáveis
3. Solicite orçamento formal (com CNPJ, descrição, valor unitário e total)
4. Preencha o mapa comparativo de preços
5. Escolha o menor preço que atenda às especificações
6. Registre tudo na documentação da UEx

MODELO DE MAPA COMPARATIVO:
| Item | Fornecedor A | Fornecedor B | Fornecedor C |
| Descrição | Valor | Valor | Valor |
| Frete | Valor | Valor | Valor |
| TOTAL | Valor | Valor | Valor |
Fornecedor vencedor: (menor preço)

FORMAS DE PESQUISA ACEITAS:
- Pesquisa presencial em lojas
- Pesquisa por telefone (registrando o contato)
- Pesquisa pela internet (printando a tela com data e preço)
- Solicitação formal por e-mail

ATENÇÃO: Para compras fracionadas, não divida uma compra grande em várias pequenas para evitar a pesquisa de preços. Isso é considerado fracionamento irregular e pode gerar problemas na prestação de contas.

DICA PARA A DIRETORA: Mantenha um cadastro de fornecedores confiáveis da região. Isso agiliza futuras pesquisas de preços.`
  },
  {
    title: "Conselho Escolar - Papel e Funcionamento",
    category: "Gestão",
    content: `O Conselho Escolar é o órgão máximo de decisão da escola. É um colegiado formado por representantes de todos os segmentos da comunidade escolar: pais, alunos, professores, funcionários e direção.

FUNÇÕES DO CONSELHO ESCOLAR:
- Deliberativa: Decide sobre o uso dos recursos financeiros, aprovar o PPP, definir prioridades
- Consultiva: Assessora a direção em questões pedagógicas e administrativas
- Fiscalizadora: Acompanha a execução financeira e pedagógica da escola
- Mobilizadora: Estimula a participação da comunidade na gestão escolar

RELAÇÃO COM O PDDE:
- O Conselho DEVE aprovar o plano de aplicação dos recursos (o que vai ser comprado)
- DEVE aprovar a prestação de contas
- DEVE participar da definição de prioridades de investimento
- As atas de reunião do Conselho são documentos obrigatórios na prestação de contas

COMPOSIÇÃO:
- Diretor(a) da escola (membro nato)
- Representantes dos professores
- Representantes dos funcionários
- Representantes dos pais/responsáveis
- Representantes dos alunos (quando maiores de 16 anos ou representados)
- A composição deve garantir paridade (50% profissionais da educação + 50% comunidade)

REUNIÕES:
- Devem ser realizadas periodicamente (recomendável mensalmente)
- Registradas em ata com lista de presença
- Convocadas com antecedência mínima de 48 horas
- O quórum mínimo deve ser respeitado (maioria simples)

ELEIÇÃO DO CONSELHO:
- Mandato de 2 anos com direito a uma recondução
- Eleição por segmento (cada grupo elege seus representantes)
- O presidente é eleito entre os membros (não precisa ser o diretor)

DICA: Antes de cada reunião, prepare uma pauta clara com os pontos a serem discutidos. Leve os extratos bancários e orçamentos quando for discutir uso de recursos.`
  },
  {
    title: "UEx - Unidade Executora Própria (APM / Caixa Escolar / APP)",
    category: "Gestão Financeira",
    content: `A Unidade Executora Própria (UEx) é uma entidade privada sem fins lucrativos que representa a escola para receber e administrar recursos financeiros. Pode ser chamada de APM (Associação de Pais e Mestres), APP (Associação de Pais e Professores), Caixa Escolar ou outro nome similar.

POR QUE EXISTE: Como a escola pública não tem personalidade jurídica própria (CNPJ), precisa de uma entidade que possa abrir conta bancária, emitir cheques, assinar contratos e receber recursos diretamente do FNDE.

CNPJ DA UEx: A UEx possui CNPJ próprio. É nesse CNPJ que os recursos do PDDE são depositados. Toda nota fiscal deve ser emitida neste CNPJ.

RESPONSABILIDADES DA UEx:
- Receber e administrar recursos do PDDE e outros programas
- Executar as despesas conforme deliberado pelo Conselho Escolar
- Manter escrituração contábil e financeira
- Prestar contas dos recursos recebidos
- Manter a documentação organizada por pelo menos 10 anos

DOCUMENTAÇÃO OBRIGATÓRIA:
- Estatuto Social registrado em cartório
- Ata de eleição da diretoria
- CNPJ atualizado na Receita Federal
- Certidões negativas (INSS, FGTS, Receita Federal)
- Livro de atas
- Livro caixa

DIRETORIA DA UEx (composição típica):
- Presidente (geralmente o diretor da escola)
- Vice-presidente
- Tesoureiro(a)
- Secretário(a)
- Conselho Fiscal (3 membros)

CONTA BANCÁRIA:
- Deve ser aberta no Banco do Brasil
- Específica para cada programa (PDDE tem conta própria)
- Os recursos devem ser aplicados em poupança ou fundo de investimento enquanto não utilizados
- Não podem ser misturados com outros recursos

ATENÇÃO: A UEx tem obrigações fiscais:
- Declaração anual à Receita Federal (DIPJ ou equivalente)
- Manter CNPJ ativo e regular
- Renovar certidões periodicamente`
  },
  {
    title: "Indicadores Educacionais - IDEB, Taxas de Rendimento e ICG",
    category: "Indicadores",
    link: "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb",
    content: `Os indicadores educacionais são ferramentas fundamentais para a gestão escolar. Eles ajudam a diretora a entender a situação da escola e planejar ações de melhoria.

IDEB (Índice de Desenvolvimento da Educação Básica):
- Calculado a cada 2 anos (anos ímpares)
- Combina o desempenho no SAEB (Prova Brasil) com as taxas de aprovação
- Escala de 0 a 10
- Meta nacional para 2024: 6,0 para os anos iniciais do fundamental
- Usado como referência para políticas públicas e repasse de recursos (VAAR do FUNDEB)
- Fórmula: IDEB = Nota do SAEB × Taxa de Aprovação

TAXAS DE RENDIMENTO:
- Taxa de Aprovação: Percentual de alunos aprovados ao final do ano letivo
- Taxa de Reprovação: Percentual de alunos reprovados
- Taxa de Abandono: Percentual de alunos que abandonaram a escola
- Essas taxas são calculadas a partir dos dados da Situação do Aluno no Censo Escolar
- Afetam diretamente o IDEB da escola

ICG (Indicador de Complexidade de Gestão):
- Classificado em 6 níveis (1 = menor complexidade, 6 = maior complexidade)
- Considera: número de matrículas, etapas oferecidas, número de turnos, complexidade das turmas
- Escola nível 1: pequena, poucas etapas, 1 turno
- Escola nível 6: grande, muitas etapas, 3 turnos, inclui EJA e educação profissional
- Usado para contextualizar resultados (escolas mais complexas têm desafios maiores)

INSE (Indicador de Nível Socioeconômico):
- Classificado em 7 grupos (I = mais baixo, VII = mais alto)
- Baseado em questionário respondido pelos alunos no SAEB
- Considera escolaridade dos pais, renda familiar e acesso a bens
- Ajuda a entender o contexto social dos alunos

TDI (Taxa de Distorção Idade-Série):
- Mede o percentual de alunos com idade acima da esperada para a série
- Indica problemas de fluxo escolar (reprovação, abandono, entrada tardia)
- Meta: reduzir ao máximo para garantir fluxo escolar adequado

DICA: Acompanhe regularmente os indicadores da sua escola no Painel de Dados do site. Compare com a média do município e do estado para identificar pontos fortes e áreas de melhoria.`
  },
  {
    title: "Ata de Reunião - Como Redigir Corretamente",
    category: "Documentos",
    content: `A Ata de Reunião é um documento oficial que registra as discussões e decisões tomadas em reuniões do Conselho Escolar, da UEx ou outras instâncias colegiadas da escola. É documento obrigatório na prestação de contas do PDDE.

ESTRUTURA DA ATA:
1. CABEÇALHO: Nome da escola, nome da UEx, data, horário e local da reunião
2. PARTICIPANTES: Lista completa dos presentes com nome e função
3. PAUTA: Assuntos a serem discutidos (listados em tópicos)
4. DESENVOLVIMENTO: Registro do que foi discutido em cada ponto da pauta
5. DELIBERAÇÕES: Decisões tomadas, com resultado da votação se houver
6. ENCERRAMENTO: Horário de encerramento e assinaturas

DICAS DE REDAÇÃO:
- Use linguagem clara e objetiva
- Registre QUEM disse o quê, quando relevante
- Anote os valores discutidos (R$ X para compra de Y)
- Registre se houve votação e o resultado (aprovado por unanimidade, por maioria etc.)
- Não use abreviações sem explicar na primeira vez
- Use verbos no passado (foi discutido, ficou decidido, foi aprovado)

ERROS COMUNS:
- Ata sem data ou local
- Falta de assinaturas dos participantes
- Não registrar deliberações específicas
- Usar linguagem vaga ("foi decidido comprar materiais" — QUAIS materiais? QUANTO?)
- Não mencionar o programa/recurso envolvido

MODELO DE ATA PARA APROVAÇÃO DE DESPESAS DO PDDE:
"Aos [data], às [hora], reuniu-se o Conselho Escolar da [escola], com a presença de [lista]. A pauta tratou da aprovação do plano de aplicação dos recursos do PDDE [ano], no valor de R$ [valor]. Após apresentação das prioridades levantadas em consulta à comunidade escolar, ficou deliberado: 1) Aquisição de [itens] no valor estimado de R$ [valor] (custeio); 2) Aquisição de [itens] no valor estimado de R$ [valor] (capital). A proposta foi aprovada por [unanimidade/maioria]. Nada mais havendo a tratar, encerrou-se a reunião às [hora]."

GUARDA: As atas devem ser mantidas por no mínimo 10 anos. Recomenda-se digitalizar e guardar cópias em local seguro.`
  },
  {
    title: "Ofício Escolar - Modelo e Orientações",
    category: "Documentos",
    content: `O Ofício é o documento oficial usado pela escola para se comunicar formalmente com outras instituições: Secretaria de Educação, FNDE, prefeitura, fornecedores, Ministério Público etc.

QUANDO USAR O OFÍCIO:
- Solicitar informações ou providências
- Encaminhar documentos
- Responder a solicitações oficiais
- Comunicar situações à Secretaria de Educação
- Solicitar autorização para eventos ou reformas
- Denunciar irregularidades

ESTRUTURA DO OFÍCIO:
1. TIMBRE: Logotipo da escola ou da rede (quando houver)
2. NÚMERO: Sequencial anual (ex: Ofício nº 015/2024)
3. LOCAL E DATA: Cidade, dia, mês e ano
4. DESTINATÁRIO: Nome, cargo e instituição
5. ASSUNTO: Resumo em uma linha
6. VOCATIVO: "Senhor(a) [cargo]" ou "Prezado(a) [cargo]"
7. CORPO: Texto em parágrafos, objetivo e claro
8. FECHO: "Atenciosamente" ou "Respeitosamente"
9. ASSINATURA: Nome, cargo e carimbo da diretora

DICAS DE REDAÇÃO:
- Seja objetivo e direto
- Use parágrafos curtos
- Cite leis, resoluções ou normas quando necessário
- Não use linguagem informal
- Numere páginas se mais de uma
- Guarde cópia protocolada (com data de recebimento)

EXEMPLO DE ABERTURA:
"Vimos por meio deste solicitar a Vossa Senhoria providências quanto à [assunto], tendo em vista que [justificativa], conforme previsto na [norma/lei], para [objetivo]."

EXEMPLO DE OFÍCIO PARA SOLICITAR MANUTENÇÃO:
"Ofício nº 023/2024
[Cidade], [data]
À Secretaria Municipal de Educação
Assunto: Solicitação de manutenção predial

Prezada Secretária,
Vimos por meio deste informar que as instalações elétricas da Escola [nome], localizada em [endereço], apresentam necessidade urgente de manutenção, oferecendo risco à segurança dos alunos e funcionários.
Solicitamos o envio de equipe técnica para avaliação e reparo no prazo mais breve possível.
Atenciosamente,
[Nome da Diretora]"

PROTOCOLO: Sempre protocolize o ofício (carimbo com data e hora de recebimento). Guarde a via protocolada. Em caso de urgência, envie por e-mail e entregue o original depois.`
  },
  {
    title: "PDDE Qualidade - Ações Agregadas",
    category: "Programas",
    link: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde",
    content: `O PDDE Qualidade engloba diversas ações agregadas que destinam recursos suplementares às escolas para finalidades específicas. Cada ação tem regras próprias de uso.

PRINCIPAIS AÇÕES DO PDDE QUALIDADE:

1. PDDE ESTRUTURA:
- Escola Acessível: Recursos para adequação de acessibilidade (rampas, banheiros adaptados, piso tátil)
- Escola do Campo: Melhoria de infraestrutura de escolas rurais
- Água na Escola: Abastecimento de água potável
- Escola Sustentável: Práticas sustentáveis e eficiência energética

2. PDDE INTEGRAL:
- Mais Educação / Escola em Tempo Integral: Recursos para ampliação da jornada escolar
- Pode ser usado em: monitores, material pedagógico, alimentação suplementar, kits de materiais
- O repasse depende da adesão da escola ao programa

3. PDDE EMERGENCIAL:
- Recursos para escolas atingidas por desastres naturais (enchentes, deslizamentos)
- Liberação rápida, sem necessidade de adesão prévia
- Pode ser usado em: limpeza, recuperação de mobiliário, material básico

4. PDDE EDUCAÇÃO CONECTADA:
- Recursos para conectividade e tecnologia
- Pode comprar: roteadores, cabos de rede, equipamentos de TI
- A escola precisa estar cadastrada no programa de conectividade

REGRAS GERAIS DAS AÇÕES AGREGADAS:
- Cada ação tem conta bancária específica (NÃO misturar com PDDE básico)
- A prestação de contas segue as mesmas regras do PDDE básico
- O Conselho Escolar deve aprovar o plano de aplicação
- Pesquisa de preços obrigatória acima de R$ 1.000,00
- Os recursos devem ser usados exclusivamente para a finalidade da ação

ATENÇÃO: Ao receber recursos de ações agregadas, confira a resolução específica da ação para saber exatamente o que pode e o que não pode comprar. Cada ação tem sua lista de itens financiáveis.`
  },
  {
    title: "Gestão Financeira Escolar - Boas Práticas",
    category: "Gestão Financeira",
    content: `A gestão financeira escolar envolve o planejamento, execução e controle dos recursos recebidos pela escola. Uma boa gestão garante que o dinheiro público seja usado de forma eficiente e transparente.

PLANEJAMENTO FINANCEIRO:
1. Levante as necessidades da escola (ouvindo professores, funcionários, alunos e pais)
2. Priorize as demandas mais urgentes
3. Elabore o plano de aplicação considerando os recursos disponíveis
4. Apresente ao Conselho Escolar para aprovação
5. Execute as compras conforme planejado
6. Acompanhe a execução e faça ajustes quando necessário

ORGANIZAÇÃO FINANCEIRA:
- Mantenha uma pasta física organizada por programa e mês
- Digitalize todos os documentos importantes
- Use planilha de controle com: data, fornecedor, item, valor, categoria (custeio/capital)
- Faça conciliação bancária mensalmente
- Não acumule pendências na prestação de contas

TRANSPARÊNCIA:
- Afixe no mural da escola: recursos recebidos, plano de aplicação, prestação de contas
- Convide a comunidade para participar do Conselho Escolar
- Responda prontamente a solicitações de informação
- Mantenha atas de todas as reuniões acessíveis

ERROS FREQUENTES QUE DEVEM SER EVITADOS:
- Comprar sem pesquisa de preços
- Usar recurso de custeio para capital (e vice-versa)
- Não ter ata de aprovação das despesas
- Pagar em dinheiro vivo
- Movimentar a conta bancária por pessoa não autorizada
- Deixar recursos parados na conta sem aplicação financeira
- Usar recursos para finalidades não previstas no programa

CALENDÁRIO FINANCEIRO DA DIRETORA:
- Janeiro-Fevereiro: Prestação de contas do ano anterior
- Março: Elaboração do plano de aplicação do novo ano
- Abril-Maio: Início das compras prioritárias
- Junho: Preenchimento do Censo Escolar (define recursos futuros)
- Julho-Agosto: Acompanhamento da execução
- Setembro-Outubro: Revisão do plano de aplicação
- Novembro-Dezembro: Finalização das compras e organização da documentação

DICA DE OURO: Nunca assine documentos em branco. Leia atentamente todo documento antes de assinar. Se tiver dúvida, consulte a Secretaria de Educação ou busque orientação.`
  },
  {
    title: "SAEB e Avaliações Externas - O Que a Diretora Precisa Saber",
    category: "Indicadores",
    link: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/saeb",
    content: `O SAEB (Sistema de Avaliação da Educação Básica) é a principal avaliação externa da educação básica no Brasil. É realizado pelo INEP a cada dois anos e seus resultados compõem o IDEB.

O QUE É AVALIADO:
- Língua Portuguesa (foco em leitura)
- Matemática (foco em resolução de problemas)
- Questionários contextuais (alunos, professores e diretores)
- Aplicado no 5º ano e 9º ano do Ensino Fundamental e 3ª série do Ensino Médio

QUEM PARTICIPA:
- Censo (todas as escolas): 5º e 9º anos do Fundamental com pelo menos 20 alunos
- Amostral: 3ª série do Ensino Médio
- Todas as escolas públicas da educação básica participam

PAPEL DA DIRETORA:
- Garantir que todos os alunos compareçam no dia da prova
- Preencher o questionário do diretor (obrigatório)
- Preparar a infraestrutura da escola para a aplicação
- Comunicar aos pais sobre a importância da avaliação
- NÃO treinar alunos com provas anteriores de forma mecânica (o objetivo é diagnosticar, não ranquear)

COMO USAR OS RESULTADOS:
- Identifique as habilidades que os alunos mais tiveram dificuldade
- Compare com anos anteriores para ver evolução
- Use como diagnóstico para o planejamento pedagógico
- Discuta os resultados com a equipe pedagógica e professores
- Não use para punir professores ou alunos

ESCALAS DE PROFICIÊNCIA:
- Língua Portuguesa: 0 a 500 pontos (Fundamental); níveis de 1 a 10
- Matemática: 0 a 500 pontos (Fundamental); níveis de 1 a 10
- Nível adequado para o 5º ano: acima de 200 em LP e acima de 225 em Matemática
- Nível adequado para o 9º ano: acima de 275 em LP e acima de 300 em Matemática

QUESTIONÁRIO DO DIRETOR: Pergunta sobre gestão da escola, formação, condições de trabalho, infraestrutura e clima escolar. As respostas são usadas para contextualizar os resultados e não afetam a nota da escola.`
  },
  {
    title: "Compras com Recursos Públicos - Regras e Cuidados",
    category: "Gestão Financeira",
    content: `As compras realizadas com recursos públicos (PDDE e similares) devem seguir princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência.

PRINCÍPIOS BÁSICOS:
- Economicidade: Buscar o melhor preço
- Impessoalidade: Não favorecer fornecedores específicos
- Publicidade: Dar transparência às compras
- Eficiência: Comprar o que é realmente necessário

PASSO A PASSO PARA COMPRAS:
1. Identificar a necessidade (deliberação do Conselho Escolar)
2. Especificar o produto/serviço desejado
3. Fazer pesquisa de preços (mínimo 3 orçamentos)
4. Escolher o menor preço
5. Realizar a compra (preferencialmente por transferência bancária)
6. Receber o produto/serviço e conferir
7. Arquivar nota fiscal e comprovante de pagamento
8. Registrar no controle financeiro

FORMAS DE PAGAMENTO ACEITAS:
- Transferência bancária (TED/DOC)
- PIX (institucional, da conta da UEx)
- Cheque nominal ao fornecedor
- Cartão corporativo (quando disponível)
- NUNCA em dinheiro vivo

DOCUMENTOS DE CADA COMPRA:
- Orçamentos (mínimo 3, quando acima de R$ 1.000)
- Nota fiscal eletrônica (NF-e) ou recibo (para MEI)
- Comprovante de pagamento (transferência, PIX)
- Termo de recebimento (para bens permanentes)

NOTA FISCAL - CUIDADOS:
- Deve estar em nome da UEx (CNPJ da APM/Caixa Escolar)
- Deve conter descrição detalhada dos itens
- A data deve ser posterior à deliberação do Conselho
- Deve ser nota fiscal eletrônica (verificável)
- Conferir se o CNPJ do fornecedor é válido (consultar no site da Receita)

FORNECEDORES:
- Não comprar de parentes de membros do Conselho ou da direção
- Verificar regularidade fiscal do fornecedor
- Diversificar fornecedores ao longo do ano
- Manter cadastro de fornecedores confiáveis

BENS PERMANENTES (CAPITAL):
- Devem ser tombados (identificados com número patrimonial)
- Registrados na Relação de Bens
- Não podem ser doados, emprestados ou descartados sem autorização
- Fotografar os bens adquiridos (registro de prova)`
  },
  {
    title: "Calendário de Obrigações da Gestão Escolar",
    category: "Gestão",
    content: `A diretora precisa estar atenta a diversos prazos ao longo do ano para não perder oportunidades de recursos e cumprir obrigações legais.

JANEIRO:
- Planejamento do ano letivo
- Organizar documentação para prestação de contas do PDDE

FEVEREIRO:
- PRAZO: Prestação de contas do PDDE (até 28/02)
- PRAZO: Informar Situação do Aluno no Censo Escolar (rendimento e movimento do ano anterior)
- Início do ano letivo (conforme calendário da rede)

MARÇO:
- Consolidação das matrículas
- Elaboração do Plano de Aplicação dos recursos do PDDE
- Reunião do Conselho Escolar para aprovar o plano
- PRAZO: Adesão a programas do FNDE (conforme editais)

ABRIL:
- Acompanhamento pedagógico (1º bimestre)
- Início das compras do PDDE conforme plano aprovado

MAIO:
- PRAZO: Início do preenchimento do Censo Escolar (Matrícula Inicial)
- Conferência das informações de infraestrutura e turmas

JUNHO:
- PRAZO: Encerramento do Censo Escolar (Matrícula Inicial)
- Reunião do Conselho Escolar (balanço do semestre)
- Análise dos recursos executados e pendentes

JULHO:
- Recesso escolar
- Organização de documentação financeira

AGOSTO:
- Retorno das aulas
- PRAZO: Período de retificação do Censo Escolar
- Acompanhamento da execução financeira

SETEMBRO:
- SAEB (aplicação nos anos ímpares)
- Reunião do Conselho Escolar
- Revisão do plano de aplicação do PDDE

OUTUBRO:
- Semana da Criança
- PRAZO: Encerramento de retificações do Censo
- Planejamento do encerramento do ano letivo

NOVEMBRO:
- Finalização das compras do PDDE
- Preparação da documentação para prestação de contas
- Resultados preliminares do IDEB (anos ímpares)

DEZEMBRO:
- Encerramento do ano letivo
- Consolidação de dados (aprovação, reprovação, abandono)
- Balanço financeiro do ano
- PRAZO: Preenchimento da situação do aluno para o Censo

DICA: Monte um quadro de avisos na sala da direção com todos esses prazos marcados. Use cores diferentes para urgências.`
  },
  {
    title: "Glossário de Termos da Gestão Financeira Escolar",
    category: "Glossário",
    content: `ATA: Documento que registra os assuntos discutidos e decisões tomadas em reuniões.

APM (Associação de Pais e Mestres): Entidade que representa a escola para fins administrativos e financeiros. Também chamada de UEx, APP ou Caixa Escolar.

CAE (Conselho de Alimentação Escolar): Órgão que fiscaliza a aplicação dos recursos do PNAE e a qualidade da alimentação escolar.

CACS-FUNDEB: Conselho de Acompanhamento e Controle Social do FUNDEB. Fiscaliza a aplicação dos recursos do fundo.

CAPITAL: Despesas com aquisição de bens permanentes (equipamentos, mobiliário, etc.) com vida útil superior a 2 anos.

CNPJ: Cadastro Nacional de Pessoa Jurídica. Número de identificação fiscal da UEx.

CONCILIAÇÃO BANCÁRIA: Comparação entre os registros internos de receitas e despesas e o extrato bancário.

CUSTEIO: Despesas com materiais de consumo e serviços (limpeza, manutenção, material pedagógico).

EMPENHO: Comprometimento de recursos para uma despesa futura (mais usado na administração pública direta).

ENTIDADE EXECUTORA (EEx): Prefeitura ou governo estadual que recebe e administra recursos federais para a educação.

FNDE (Fundo Nacional de Desenvolvimento da Educação): Autarquia federal responsável pela execução de programas educacionais e transferência de recursos.

IDEB (Índice de Desenvolvimento da Educação Básica): Indicador de qualidade da educação que combina nota do SAEB e taxa de aprovação.

INEP (Instituto Nacional de Estudos e Pesquisas Educacionais): Autarquia que realiza o Censo Escolar, SAEB e calcula indicadores educacionais.

MDE (Manutenção e Desenvolvimento do Ensino): Conjunto de despesas que podem ser financiadas com recursos vinculados à educação.

NOTA FISCAL: Documento fiscal que comprova a compra de produto ou serviço. Deve ser emitida no CNPJ da UEx.

PDDE: Programa Dinheiro Direto na Escola. Transfere recursos federais diretamente para a escola.

PESQUISA DE PREÇOS: Procedimento de consulta a no mínimo 3 fornecedores para escolher o menor preço.

PLANO DE APLICAÇÃO: Documento que detalha como os recursos serão utilizados, aprovado pelo Conselho Escolar.

PRESTAÇÃO DE CONTAS: Demonstração documentada de como os recursos foram utilizados.

PPP (Projeto Político-Pedagógico): Documento que define a identidade, objetivos e estratégias da escola.

SAEB: Sistema de Avaliação da Educação Básica. Avaliação nacional que mede a qualidade do ensino.

TOMBAMENTO: Registro patrimonial de bens permanentes adquiridos com recursos públicos.

UEx (Unidade Executora Própria): Entidade privada sem fins lucrativos que representa a escola. Recebe e administra recursos financeiros.`
  },
];

async function seedKnowledge() {
  const db = new Database(DB_PATH);
  
  const existing = (db.prepare("SELECT COUNT(*) as c FROM ai_documents").get() as any).c;
  if (existing > 0) {
    console.log(`Already ${existing} documents. Clearing and re-seeding...`);
    db.prepare("DELETE FROM ai_documents").run();
  }

  const insert = db.prepare(
    "INSERT INTO ai_documents (title, content, category, link, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const now = Date.now();
  const tx = db.transaction(() => {
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      insert.run(doc.title, doc.content, doc.category, doc.link || null, i + 1, now);
    }
  });
  tx();

  const count = (db.prepare("SELECT COUNT(*) as c FROM ai_documents").get() as any).c;
  console.log(`✅ Inserted ${count} knowledge base documents.`);
  
  db.close();
}

seedKnowledge().catch(console.error);
