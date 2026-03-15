export default function SiteChromeRemodelPreview() {
  const menu = [
    "Dados Educacionais",
    "Legislação",
    "Calendário",
    "Trilha",
    "Programas",
    "Ferramentas",
    "Caderno da Diretora",
  ];

    return (
    <div className="min-h-screen w-full overflow-hidden bg-[#f6f0e8] text-slate-700">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(176,120,70,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(110,130,160,0.10),_transparent_32%),linear-gradient(180deg,_#f8f3ec_0%,_#f4ede4_48%,_#efe7dc_100%)]" />

        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(120,120,120,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.18)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="absolute left-[-80px] top-[120px] h-72 w-72 rounded-full bg-[#d8c2a8]/30 blur-3xl" />
        <div className="absolute bottom-[80px] right-[-120px] h-80 w-80 rounded-full bg-[#c8d2df]/30 blur-3xl" />

        <header className="group relative z-20 border-b border-[#ece1d5] bg-[linear-gradient(180deg,#fbf6ef_0%,#f7efe4_55%,#f2e7d9_100%)] shadow-[0_8px_18px_rgba(146,126,108,0.10)]">
          {/* borda chanfrada superior */}
          <div className="absolute inset-x-0 top-0 h-[6px] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0))]" />
          {/* borda chanfrada inferior */}
          <div className="absolute inset-x-0 bottom-0 h-[8px] bg-[linear-gradient(0deg,rgba(120,82,54,0.22),rgba(120,82,54,0))]" />
          <div className="absolute inset-0 pointer-events-none opacity-35 [background-image:repeating-linear-gradient(90deg,rgba(143,101,70,0.10)_0px,rgba(143,101,70,0.10)_2px,transparent_2px,transparent_22px),repeating-linear-gradient(6deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_28px)]" />
          <div className="absolute inset-x-0 bottom-0 h-5 bg-[linear-gradient(180deg,transparent_0%,rgba(120,82,54,0.10)_100%)]" />

          <div className="relative w-full">
            <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-0 -translate-y-3 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
              <div className="mx-auto max-w-7xl h-full px-6 lg:px-10">
                <div
                  className="grid h-full"
                  style={{ gridTemplateColumns: `repeat(${menu.length}, 1fr)` }}
                >
                  {menu.map((item, i) => {
                    const isMiddle = i === Math.floor(menu.length / 2);
                    return (
                      <div key={`mark-${item}`} className="relative h-full">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-[#d8cabc]/70" />
                        <div className={`absolute left-0 top-0 w-px bg-[#d8cabc] ${isMiddle ? "h-14" : "h-10"}`} />
                        <div className="absolute left-2 top-2 text-[10px] font-semibold tracking-[0.12em] text-[#9f968d] [text-shadow:0_1px_0_rgba(255,255,255,0.18)] opacity-0 transition-opacity duration-500 delay-150 group-hover:opacity-90">
                          {i}
                        </div>
                        <div className="absolute left-1/2 top-0 w-px h-7 bg-[#c9a896]/70" />
                        {/* marcas de milimetro */}
                        <div className="absolute left-[12%] top-0 w-px h-2 bg-[#e8ddd3]/90" />
                        <div className="absolute left-[24%] top-0 w-px h-2 bg-[#e8ddd3]/90" />
                        <div className="absolute left-[36%] top-0 w-px h-2 bg-[#e8ddd3]/90" />
                        <div className="absolute left-[64%] top-0 w-px h-2 bg-[#e8ddd3]/90" />
                        <div className="absolute left-[76%] top-0 w-px h-2 bg-[#e8ddd3]/90" />
                        <div className="absolute left-[88%] top-0 w-px h-2 bg-[#e8ddd3]/90" />
                        <div className="absolute left-1/4 top-0 w-px h-5 bg-[#e3d7cc]/70" />
                        <div className="absolute left-3/4 top-0 w-px h-5 bg-[#e3d7cc]/70" />
                      </div>
                    );
                  })}
                  <div className="relative h-full">
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-[#d8cabc]/70" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto max-w-7xl px-6 py-4 lg:px-10">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">

                    <div>
                      <h1 className="peer inline-block text-xl md:text-2xl font-bold tracking-[0.02em] cursor-pointer text-[#8a6e5b]" style={{textShadow:"0 1px 0 rgba(255,255,255,0.35), 0 -1px 0 rgba(121,84,58,0.35)", letterSpacing:"0.03em"}}>
                        Chegou a Conta, <span className="text-[#b23a2e]" style={{textShadow:"0 1px 0 rgba(255,255,255,0.35), 0 -1px 0 rgba(90,40,30,0.35)"}}>Diretora!</span>
                      </h1>
                      <p className="text-xs text-[#6d7b8f]">
                        Dados e ferramentas para gestão escolar
                      </p>
                    </div>
                  </div>

                  <button className="lg:hidden rounded-lg border border-[#e4c7b3] bg-white/90 px-3 py-2 text-sm">
                    Menu
                  </button>
                </div>

                <nav className="grid items-end text-sm font-medium justify-items-center transition-transform duration-500 ease-out peer-hover:-translate-y-1 group-hover:-translate-y-1" style={{ gridTemplateColumns: `repeat(${menu.length}, 1fr)` }} aria-label="Menu principal">
                  {menu.map((item) => {
                    const active = item === "Trilha";
                    return (
                      <a
                        key={item}
                        href="#"
                        className={`group relative rounded-full px-3 py-2 text-center tracking-[0.02em] transition-all duration-200 ease-out hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.97] ${
                          active
                            ? "bg-[rgba(255,248,240,0.28)] text-[#b86e3f] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(110,72,45,0.08)]"
                            : "text-[#8a6e5b] hover:bg-[rgba(255,248,240,0.18)] hover:text-[#24344a]"
                        }`}
                        style={{ textShadow: "0 1px 0 rgba(255,255,255,0.16), 0 -1px 0 rgba(108,72,45,0.05)" }}
                      >
                        <span>{item}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10"> 
          <div className="pointer-events-none absolute inset-x-6 top-0 bottom-0 hidden lg:block">
            <div className="h-full rounded-[36px] border border-[#eadfd4] bg-[linear-gradient(180deg,rgba(255,251,246,0.72)_0%,rgba(255,248,240,0.68)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />
          </div>
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="rounded-[30px] border border-[#e8ddd2] bg-[linear-gradient(180deg,rgba(255,252,248,0.96)_0%,rgba(252,246,239,0.96)_100%)] p-7 shadow-[0_18px_40px_rgba(134,112,92,0.08)] backdrop-blur-md relative overflow-hidden before:absolute before:left-[26px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/70 after:absolute after:left-0 after:right-0 after:top-[72px] after:h-px after:bg-[#efe7de]">
              <div className="inline-flex items-center rounded-full border border-[#efe3d8] bg-[#fffaf6] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#9f968d]">
                Programas e Políticas
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#1f2a37] md:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
                Entenda de onde vem o dinheiro da escola e como cuidar de cada <span className="bg-yellow-200/60 px-1 rounded-sm">verba</span> com segurança.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66768a]">
                Tudo explicado em linguagem simples: como o recurso chega, quem decide, o que pode comprar e o que precisa guardar para prestar contas direitinho.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["Linguagem simples", "Explicações diretas para a rotina da diretora."],
                  ["Passo a passo", <>Do recebimento do recurso até a <span className="bg-yellow-200/60 px-1 rounded-sm">prestação de contas</span>.</>],
                  ["Consulta rápida", "Glossário, dicas e programas organizados em um só lugar."],
                ].map(([title, text]) => (
                  <div key={title} className="relative rounded-[4px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_12px_22px_rgba(120,100,80,0.18)] rotate-[-0.8deg] overflow-hidden before:absolute before:-top-3 before:left-6 before:h-6 before:w-16 before:rotate-[-8deg] before:bg-[#efe4d5]/95 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]">
                    <div className="text-sm font-semibold text-[#24344a]">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[30px] border border-[#e8ddd2] bg-[linear-gradient(180deg,#fffaf7_0%,#f9f1e8_100%)] p-6 shadow-[0_18px_40px_rgba(134,112,92,0.08)] relative overflow-hidden before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/60">
              <div className="text-sm font-semibold text-[#24344a]">Por onde começar?</div>
              <p className="mt-3 text-sm leading-6 text-[#6f7d8f]">
                O <strong><span className="relative px-1 bg-yellow-200/70 rounded-sm">PDDE Básico</span></strong> é o programa mais importante para a diretora no dia a dia. É ele que ajuda na compra de materiais, pequenos reparos e melhorias que mantêm a escola funcionando.
              </p>
              <button className="mt-5 rounded-full bg-[#b86e3f] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(184,110,63,0.20)] transition hover:-translate-y-[1px]">
                Conhecer o <span className="relative px-1 bg-yellow-200/70 rounded-sm">PDDE Básico</span>
              </button>
            </aside>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative rounded-[26px] border border-[#d8cec2] bg-[linear-gradient(180deg,#fbf7f0_0%,#f4ecdf_100%)] p-0 shadow-[0_18px_36px_rgba(120,100,80,0.12)] overflow-hidden rotate-[-0.6deg]">
              <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,#ead7c4_0%,#e3cfba_100%)]" />
              <div className="absolute left-4 top-3 flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c8b8a7]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#c8b8a7]" />
              </div>
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[#ece2d6]" />
              <div className="absolute left-[7%] top-12 bottom-0 w-px bg-[#e5b9b9]/70" />
              <div className="absolute inset-x-0 top-[88px] h-px bg-[#e9e0d6]" />
              <div className="relative p-6 pt-16">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1f2a37]" style={{ fontFamily: 'Georgia, serif' }}>Glossário</h3>
                  <p className="mt-1 text-sm text-[#738194]">Palavras que você vai encontrar explicadas em linguagem simples.</p>
                </div>
                <div className="rounded-full border border-[#eee4da] bg-[#fffaf6] px-3 py-1 text-xs text-[#9f968d]">2 termos</div>
              </div>

              <div className="mt-5 rounded-[10px] border border-[#e3d8cd] bg-[#fffdfa] px-4 py-3 text-sm text-[#8b8075] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                Buscar termo... (ex: <span className="bg-yellow-200/60 px-1 rounded-sm">prestação de contas</span>)
              </div>

              <div className="mt-5 flex gap-2 pl-6">
                {['A', 'P'].map((letter) => (
                  <span key={letter} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ebdfd4] bg-[#fffaf6] text-sm font-medium text-[#8a6e5b]">
                    {letter}
                  </span>
                ))}
              </div>

              <div className="mt-5 space-y-4 pl-6">
                {[
                  ["Adesão", "Quando a escola se inscreve para receber um dinheiro."],
                  ["PDDE", "Programa Dinheiro Direto na Escola."],
                ].map(([term, desc]) => (
                  <div key={term} className="relative rounded-[10px] border border-[#e3d8cd] bg-[#fffdfa] p-4 shadow-[0_6px_12px_rgba(120,100,80,0.08)] before:absolute before:-top-2 before:right-6 before:h-5 before:w-12 before:rotate-[5deg] before:bg-[#efe5d8]/95 before:shadow-sm">
                    <div className="text-base font-semibold text-[#24344a]">{term}</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">{desc}</p>
                  </div>
                ))}
              </div>

              <button className="mt-5 pl-6 text-sm font-medium text-[#b86e3f] transition hover:text-[#8f542d]">
                Ver todos os 2 termos
              </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e8ddd2] bg-[linear-gradient(180deg,rgba(255,252,248,0.95)_0%,rgba(251,246,239,0.95)_100%)] p-6 shadow-[0_16px_34px_rgba(134,112,92,0.07)] backdrop-blur-md relative overflow-hidden before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/60 after:absolute after:left-0 after:right-0 after:top-[62px] after:h-px after:bg-[#f1e8df]">
              <div className="absolute right-6 top-5 rotate-[8deg] border-2 border-[#b23a2e] bg-white px-3 py-[2px] text-[10px] font-bold tracking-[0.12em] text-[#b23a2e]">ATENÇÃO</div>
              <h3 className="text-xl font-bold text-[#1f2a37]" style={{ fontFamily: 'Georgia, serif' }}>Dicas de Ouro</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Sempre em grupo", <>Nunca decida sozinha. O <span className="bg-lime-200/60 px-1 rounded-sm">Conselho Escolar</span> precisa aprovar todas as compras.</>],
                  ["Nada de dinheiro vivo", "Todo pagamento deve sair da conta do programa direto para o fornecedor."],
                  ["De olho no prazo", <>A <span className="bg-yellow-200/60 px-1 rounded-sm">prestação de contas</span> tem data certa. Anote no calendário.</>],
                  ["Pesquise preços", "Pelo menos 3 orçamentos antes de comprar qualquer coisa."],
                ].map(([title, text]) => (
                  <div key={title} className="relative rounded-[4px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_12px_22px_rgba(120,100,80,0.16)] rotate-[0.7deg] overflow-hidden before:absolute before:-top-3 before:right-6 before:h-6 before:w-16 before:rotate-[8deg] before:bg-[#f1e6da]/95 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]">
                    <div className="text-sm font-semibold text-[#24344a]">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e8ddd2] bg-[linear-gradient(180deg,rgba(255,252,248,0.95)_0%,rgba(251,246,239,0.95)_100%)] p-6 shadow-[0_18px_40px_rgba(134,112,92,0.08)] backdrop-blur-md relative overflow-hidden before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/60 after:absolute after:left-0 after:right-0 after:top-[62px] after:h-px after:bg-[#f1e8df]">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-extrabold text-[#1f2a37]" style={{ fontFamily: 'Georgia, serif' }}>Como funciona na prática?</h3>
              <p className="mt-2 text-sm leading-6 text-[#738194]">O caminho do dinheiro em 5 passos simples.</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-5">
              {[
                ["Passo 1", "O dinheiro chega", <>O FNDE libera a verba e ela cai direto na conta da UEx, geralmente APM ou <span className="bg-lime-200/60 px-1 rounded-sm">Conselho Escolar</span>.</>],
                ["Passo 2", "O Conselho decide", "Vocês se reúnem para decidir o que comprar. Tudo precisa estar no plano de aplicação."],
                ["Passo 3", "Você compra", <>Faz a <span className="bg-pink-200/60 px-1 rounded-sm">pesquisa de preços</span>, escolhe o fornecedor e realiza a compra seguindo as regras.</>],
                ["Passo 4", "Guarda os documentos", "Nota fiscal, comprovante de pagamento e ata: tudo organizado por programa e ano."],
                ["Passo 5", "Presta contas", "No prazo, você envia os documentos para mostrar como usou cada centavo."],
              ].map(([step, title, text], index) => (
                <div key={step} className="relative rounded-[4px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_12px_22px_rgba(120,100,80,0.18)] rotate-[-1deg] overflow-hidden before:absolute before:-top-3 before:right-6 before:h-6 before:w-14 before:rotate-[7deg] before:bg-[#f0e4d8]/95 before:shadow-sm after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[8px] after:bg-[repeating-linear-gradient(90deg,#efe3d6_0px,#efe3d6_8px,transparent_8px,transparent_14px)]">
                  <div className="mb-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#f4e5d8] px-3 text-xs font-semibold text-[#a2663f]">{index + 1}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f968d]">{step}</div>
                  <div className="mt-2 text-base font-semibold text-[#24344a]">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#738194]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e8ddd2] bg-[linear-gradient(180deg,rgba(255,252,248,0.95)_0%,rgba(251,246,239,0.95)_100%)] p-6 shadow-[0_18px_40px_rgba(134,112,92,0.08)] backdrop-blur-md relative overflow-hidden before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/60 after:absolute after:left-0 after:right-0 after:top-[62px] after:h-px after:bg-[#f1e8df]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-[#1f2a37]" style={{ fontFamily: 'Georgia, serif' }}>Verbas que a Escola Gerencia</h3>
                <p className="mt-1 text-sm leading-6 text-[#738194]">Programas organizados entre verbas diretas da escola e verbas compartilhadas com a Secretaria.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[8px] border border-[#e7dccf] bg-[#fffdf8] p-5 shadow-[0_10px_20px_rgba(120,100,80,0.16)] rotate-[0.6deg] relative relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/55">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#24344a]">PDDE</div>
                    <div className="mt-1 text-xs text-[#8f8275]">Mais usado</div>
                  </div>
                  <span className="absolute -top-3 right-4 rotate-[8deg] border-2 border-[#b23a2e] bg-white px-2 py-[2px] text-[10px] font-bold tracking-[0.12em] text-[#b23a2e]">IMPORTANTE</span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.14)] rotate-[0.4deg] relative">
                    <div className="text-base font-semibold text-[#24344a]"><span className="relative px-1 bg-yellow-200/70 rounded-sm">PDDE Básico</span></div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">
                      Dinheiro que vai direto para a conta da escola para usar em material, manutenção e melhorias. É o arroz com feijão dos recursos.
                    </p>
                    <button className="mt-3 text-sm font-medium text-[#b86e3f]">Ver Regras</button>
                  </div>

                  <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.14)] rotate-[0.4deg] relative">
                    <div className="text-base font-semibold text-[#24344a]">PDDE Qualidade</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">
                      Verbas extras do PDDE para projetos específicos. Cada ação tem regras próprias e a escola precisa aderir a cada uma.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-[#b86e3f]">
                      <button>Ver Regras</button>
                      <button>Ver 6 ações</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e7dccf] bg-[#fffdf8] p-5 shadow-[0_10px_20px_rgba(120,100,80,0.16)] rotate-[0.6deg] relative relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/55">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#24344a]">Verbas Compartilhadas</div>
                    <div className="mt-1 text-xs text-[#8f8275]">Geridas pela Secretaria</div>
                  </div>
                  <span className="rounded-full bg-[#eef3f7] px-3 py-1 text-xs font-medium text-[#66768a]">Gestão compartilhada</span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.14)] rotate-[0.4deg] relative">
                    <div className="text-base font-semibold text-[#24344a]">PNAE</div>
                    <div className="mt-1 text-sm text-[#8f8275]">Alimentação Escolar</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">
                      Verba da merenda. Em geral é gerida pela prefeitura ou pelo estado, mas a escola participa do cardápio e da fiscalização.
                    </p>
                    <button className="mt-3 text-sm font-medium text-[#b86e3f]">Ver Regras</button>
                  </div>

                  <div className="rounded-[6px] border border-[#e7dccf] bg-[#fffdf8] p-4 shadow-[0_8px_16px_rgba(120,100,80,0.14)] rotate-[0.4deg] relative">
                    <div className="text-base font-semibold text-[#24344a]">PNATE</div>
                    <div className="mt-1 text-sm text-[#8f8275]">Zona rural</div>
                    <p className="mt-2 text-sm leading-6 text-[#738194]">
                      Dinheiro para o transporte dos alunos da zona rural até a escola. Normalmente fica com o município, mas a escola pode ajudar na fiscalização.
                    </p>
                    <button className="mt-3 text-sm font-medium text-[#b86e3f]">Ver Regras</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="relative z-20 mt-12 border-t border-[#e8ded3] bg-[#faf6f1]">
  <div className="mx-auto max-w-7xl px-6 py-5 lg:px-10">
    <div className="rounded-[22px] border border-[#ebe1d7] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f2eb_100%)] px-5 py-4 shadow-[0_8px_18px_rgba(146,126,108,0.06)] relative overflow-hidden before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-[#e8b7b7]/55">
      <div className="flex items-center justify-between text-sm text-[#7b746c]">
        <a
          href="#"
          className="pl-4 transition hover:text-[#24344a]"
        >
          Quem somos
        </a>

        <button
          aria-label="Admin"
          className="group flex h-8 w-8 items-center justify-center rounded-full border border-[#e3d9cf] bg-white/85 text-[#9a9188] transition hover:border-[#d6c8ba] hover:text-[#24344a]"
        >
          <span className="text-sm opacity-70 group-hover:opacity-100">🛠️</span>
        </button>
      </div>
    </div>
  </div>
</footer>
      </div>
    </div>
  );
}
