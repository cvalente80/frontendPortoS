import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pt: {
    common: {
      brand: 'Ansião Seguros',
      yes: 'Sim',
      no: 'Não',
      nav: {
        homeLink: 'Início',
        auto: 'Simulação Auto',
        life: 'Simulação Vida',
        health: 'Simulação Saúde',
        homeInsurance: 'Simulação Habitação',
        simulator: 'Simuladores',
        individuals: 'Particulares',
        business: 'Empresas',
        businessRcp: 'Simulação RC Profissional',
        businessCondo: 'Simulação Condomínio',
        businessMreb: 'Multirriscos Empresarial',
        businessFleet: 'Frota (informação/produto)',
        businessWork: 'Acidentes de Trabalho (produto)',
        products: 'Produtos',
        agenda: 'Agenda',
        news: 'Notícias',
        contact: 'Contacto',
        mySimulations: 'Simulações',
        myPolicies: 'Apólices'
      },
      auth: {
        hello: 'Olá',
        loginCta: 'Entrar',
        signIn: 'Entrar',
        signOut: 'Sair',
        loginTitle: 'Entrar',
        continueWithGoogle: 'Continuar com Google',
        or: 'ou',
        signInWithEmail: 'Entrar com Email/Password',
        createAccount: 'Criar conta',
        forgotPassword: 'Recuperar password',
        loginWithEmailTitle: 'Entrar com Email',
        email: 'Email',
        password: 'Password',
        passwordMin: 'Password (min 6)',
        registerTitle: 'Criar conta',
        name: 'Nome',
        register: 'Registar',
        resetTitle: 'Recuperar password',
        showPassword: 'Mostrar password',
        hidePassword: 'Ocultar password',
        googleLoginFailed: 'Falha ao autenticar com Google',
        loginFailed: 'Falha no login',
        provideName: 'Indique o seu nome.',
        registerFailed: 'Falha no registo',
        emailSent: 'Email de recuperação enviado.',
        emailSentSpamNote: 'Por favor, verifique também a pasta de spam/lixo caso não encontre o email.',
        resetFailed: 'Falha ao enviar recuperação',
        errors: {
          generic: 'Ocorreu um erro. Tente novamente.',
          'invalid-credential': 'Email ou password inválidos.',
          'invalid-email': 'Email inválido.',
          'user-not-found': 'Não existe conta com este email.',
          'wrong-password': 'Password incorreta.',
          'missing-password': 'Indique a password.',
          'too-many-requests': 'Demasiadas tentativas. Tente novamente mais tarde.',
          'network-request-failed': 'Sem ligação à internet. Tente novamente.',
          'email-already-in-use': 'Já existe uma conta com este email.',
          'weak-password': 'A password deve ter pelo menos 6 caracteres.',
          'popup-closed-by-user': 'Janela encerrada antes de concluir.',
          'popup-blocked': 'Popup bloqueado pelo navegador.'
        },
        verifyTitle: 'Verificar email',
        verifyIntro: 'Enviámos um link de verificação para o seu email{{email}}. Confirme para desbloquear todas as funcionalidades.',
        resendVerification: 'Reenviar email',
        resending: 'A reenviar…',
        verificationEmailSent: 'Email de verificação reenviado.',
        sendResetLink: 'Enviar link de recuperação'
        , registerSuccess: 'Conta criada. Verifique o seu email para ativar.'
      },
      actions: {
        back: 'Voltar',
        cancel: 'Cancelar',
        send: 'Enviar'
      },
  chat: {
        title: 'Fale connosco',
        subtitle: 'Diga-nos o que precisa e entraremos em contacto.',
  talkNow: 'Conversa Instantânea',
        callNow: 'Ligar agora',
        callShort: 'Ligar',
        close: 'Fechar',
        namePlaceholder: 'Nome (opcional)',
        emailPlaceholder: 'Email (opcional)',
        phonePlaceholder: 'Telefone (opcional)',
        messagePlaceholder: 'Escreva a sua mensagem... (Ctrl/⌘+Enter para enviar)',
        send: 'Enviar',
        sending: 'A enviar…',
        sent: 'Mensagem enviada. Obrigado!',
        error: 'Falha ao enviar. Tente novamente.',
        you: 'Eu',
        agent: 'Agente',
        empty: 'Comece por dizer-nos como podemos ajudar.',
        whatsappNow: 'WhatsApp',
        whatsPrefill: 'Olá! Gostaria de falar com a Ansião Seguros.'
      },
      messages: {
        submitSuccess: 'Pedido efetuado com sucesso! Irá receber as próximas instruções por email.',
        submitError: 'Erro ao enviar pedido. Tente novamente ou contacte-nos.'
      },
      emailSummary: { person: 'Pessoa', name: 'Nome:', birth: 'Nascimento:', nif: 'NIF:' },
      backgroundAlt: 'Seguro Saúde',
      status: {
        draft: 'Rascunho',
        submitted: 'Em Processamento',
        quoted: 'Com proposta',
        archived: 'Arquivado'
      },
      admin: {
        inboxPt: 'Inbox Admin',
        inboxEn: 'Admin Inbox'
      }
      },
      mysims: {
      seoTitle: 'As minhas simulações',
      seoDesc: 'Área do utilizador para consultar as simulações submetidas.',
      heading: 'As minhas simulações',
      welcome: 'Bem-vindo{{name}}. Aqui poderá consultar as simulações submetidas com a sua conta.',
      authRequired: 'É necessário iniciar sessão para ver as suas simulações.',
      filters: {
        typeLabel: 'Tipo de seguro:',
        statusLabel: 'Estado:',
        all: 'Todos',
        types: {
          auto: 'Auto',
          vida: 'Vida',
          saude: 'Saúde',
          habitacao: 'Habitação',
          rc_prof: 'RC Profissional',
          condominio: 'Condomínio'
        }
      },
      statuses: {
        em_processamento: 'Em processamento',
        simulacao_enviada: 'Simulação enviada',
        simulacao_recebida: 'Simulação recebida',
        simulacao_aprovada_por_si: 'Simulação aprovada por si - Consulte Apólices'
      },
      loading: 'A carregar…',
      empty: 'Sem simulações para mostrar.',
      detail: {
        simTitle: 'Simulação',
        propertyTitle: 'Imóvel',
        brand: 'Marca',
        model: 'Modelo',
        version: 'Versão',
        year: 'Ano',
        insuranceType: 'Tipo de seguro',
        holderTitle: 'Dados do Tomador',
        holderName: 'Nome',
        email: 'Email',
        phone: 'Telefone',
        nif: 'NIF',
        holderAddressTitle: 'Morada do Tomador',
        riskAddressTitle: 'Morada do Risco',
        riskAddressSameAsHolder: 'Igual ao tomador',
        addressStreet: 'Morada',
        addressPostalCode: 'Código Postal',
        addressLocality: 'Localidade',
        birth: 'Nascimento',
        licenseDate: 'Data Carta',
        postalCode: 'Código Postal',
        propertyType: 'Tipo de imóvel',
        situation: 'Situação',
        usage: 'Utilização',
        constructionYear: 'Ano construção',
        area: 'Área',
        construction: 'Construção',
        security: 'Segurança',
        buildingCapital: 'Capital edifício',
        contentsCapital: 'Capital conteúdo',
        product: 'Produto',
        extras: 'Extras',
        details: 'Detalhes',
        coverages: 'Coberturas',
        others: 'Outros pedidos'
      },
      pdf: {
        viewCta: 'Consultar simulação aqui',
        delete: 'Remover anexo PDF',
        uploadLabel: 'Carregar PDF (apenas admin)',
        uploading: 'A enviar PDF…',
        successUpload: 'PDF carregado com sucesso.',
        errorUpload: 'Falha ao carregar PDF.',
        tooLarge: 'O ficheiro é maior que 1 MB. Não é possível anexar.',
        confirmDelete: 'Remover o anexo PDF desta simulação?',
        successDelete: 'Anexo PDF removido.',
        errorDelete: 'Falha ao remover anexo PDF.'
              , emailSuccess: 'Email enviado ao utilizador a informar da simulação pronta.',
              emailError: 'PDF anexado, mas falhou o envio de email ao utilizador.'
              , emailSending: 'A enviar email de notificação…'
            , emailBody: 'A sua simulação está pronta.\n\nPode consultar de duas formas:\n- Ver o PDF diretamente: {{pdfLink}}\n- Aceder à área "As minhas simulações": {{mysimsLink}}.'
              , emailSubject: 'Simulação pronta — Ansião Seguros'
      },
      errors: {
        listenFallbackNote: 'Sem atualização em tempo real (listen falhou). A mostrar resultados atuais apenas uma vez.',
        loadFailed: 'Falha ao carregar simulações ({{code}}).'
      },
      simulationFallback: 'Simulação'
    },
    policies: {
      seo: { title: 'As minhas apólices', desc: 'Área do utilizador para criar e editar apólices geradas a partir de simulações.' },
      heading: 'As minhas apólices',
            statuses: {
              em_criacao: 'Em Criação',
              em_validacao: 'Em Validação',
              em_vigor: 'Em Vigor'
            },
            pdf: {
              viewCta: 'Ver Apólice',
              viewPolicy: 'Ver Apólice',
              viewReceipt: 'Ver Recibo',
              viewConditions: 'Ver Condições Particulares',
              delete: 'Remover PDF',
              uploadLabel: 'Carregar PDF da apólice (apenas admin)',
              uploading: 'A enviar PDF…',
              successUpload: 'PDF da apólice carregado. Estado: Em Vigor.',
              errorUpload: 'Falha ao carregar PDF da apólice.',
              tooLarge: 'O ficheiro é maior que 2 MB. Não é possível anexar.',
              successDelete: 'PDF da apólice removido.',
              errorDelete: 'Falha ao remover o PDF da apólice.'
            },
      authRequired: 'É necessário iniciar sessão para ver e editar as suas apólices.',
      loading: 'A carregar…',
      empty: 'Ainda não existem apólices.',
      itemTitle: 'Apólice {{id}}',
      itemSub: 'Criada a partir da simulação {{sim}}',
      fillPrompt: 'Por favor, preencha o formulário da apólice para avançar.',
      fillPromptType: 'Por favor, preencha os dados da apólice de {{type}} para avançar.',
      form: {
        title: 'Dados para Apólice',
        holderName: 'Nome completo',
        nif: 'NIF',
        citizenCardNumber: 'Nº Cartão de Cidadão',
        addressStreet: 'Rua e nº',
        postalCode: 'Código Postal',
        locality: 'Localidade',
        phone: 'Contacto telefónico',
        email: 'Email',
        paymentFrequency: 'Periodicidade de pagamento',
        paymentMethod: 'Forma de pagamento',
        nib: 'NIB (IBAN)',
        saveCta: 'Guardar',
        createCta: 'Criar',
        resendCta: 'Reenviar',
        requestChangeCta: 'Pedir Alteração',
        saved: 'Apólice guardada com sucesso.'
      },
      placeholders: {
        holderName: 'Nome completo',
        nif: '123456789',
        citizenCardNumber: '00000000 0 ZZ0',
        addressStreet: 'Rua e nº',
        postalCode: '____-___',
        locality: 'Localidade',
        phone: '912345678',
        email: 'nome@servidor.pt',
        nib: 'PT50XXXXXXXXXXXXXXXXXXXXX'
      },
      frequencies: {
        anual: 'Anual',
        semestral: 'Semestral',
        trimestral: 'Trimestral',
        mensal: 'Mensal'
      },
      help: { nibFormat: 'Formato: PT50 + 21 dígitos.' },
      paymentMethods: {
        multibanco: 'Multibanco',
        debito_direto: 'Débito direto'
      },
      errors: {
        invalidForm: 'Por favor, preencha todos os campos válidos.',
        saveFailed: 'Falha ao guardar apólice.',
        loadFailed: 'Falha ao carregar apólices.',
        invalidEmail: 'Email inválido.',
        invalidPhone: 'Telefone deve ter 9 dígitos.',
        invalidNif: 'NIF deve ter 9 dígitos.',
        invalidNib: 'IBAN inválido (PT50 + 21 dígitos).',
        invalidCitizenCard: 'Nº Cartão de Cidadão inválido. Use o formato 00000000 0 ZZ0.',
        nameRequired: 'Indique o nome completo (mín. 3 caracteres).',
        addressStreetRequired: 'Indique a rua e nº.',
        postalCodeInvalid: 'Código postal inválido. Formato XXXX-XXX.',
        localityRequired: 'Indique a localidade.'
      }
    },
    sim_vida: {
      title: 'Simulação Seguro Vida',
      step1Title: '1. Pessoas Seguras',
      step2Title: '2. Capitais a Segurar',
      step3Title: '3. Tipo de Invalidez',
      insuranceType: {
        individual: 'Vida Individual',
        mortgage: 'Vida Crédito Habitação'
      },
      placeholders: {
        fullName: 'Nome completo',
        birthDate: 'Data de nascimento (dd-mm-aaaa)',
        nif: 'NIF',
        capital: 'Capital seguro',
        prazo: 'Prazo do seguro (anos)',
        yourName: 'Nome',
        email: 'Email',
        phone: 'Telefone'
      },
      buttons: {
        addInsured: 'Adicionar pessoa segura',
        remove: 'Remover',
        maxReached: 'Máximo de 2 pessoas atingido',
        prev: 'Anterior',
        next: 'Próximo',
        simulate: 'Simular'
      },
      validations: {
        insuredNameRequired: 'Por favor, preencha o nome completo.',
        insuredBirthRequired: 'Por favor, preencha a data de nascimento.',
        insuredNifRequired: 'Por favor, preencha o NIF com 9 dígitos.',
        capitalRequired: 'Por favor, preencha o capital seguro.',
        prazoRequired: 'Por favor, preencha o prazo do seguro.',
        nameRequired: 'Por favor, preencha o nome completo.',
        emailRequired: 'Por favor, preencha o email.',
        emailInvalid: 'Por favor, insira um email válido (ex.: nome@servidor.pt).',
        phoneRequired: 'Por favor, preencha o telefone (9 dígitos).'
      },
      disability: {
        label: 'Tipo de Invalidez',
        explanationPrefix: 'Explicação:',
        options: { IAD: 'IAD', ITP: 'ITP' },
        emailLabels: {
          IAD: 'Invalidez Absoluta e Definitiva (IAD)',
          ITP: 'Invalidez Total e Permanente (ITP)'
        },
        explanations: {
          IAD: 'A indemnização é realizada quando o segurado fica totalmente dependente de terceiros para as atividades básicas do dia a dia.',
          ITP: 'A indemnização é realizada quando o segurado fica impossibilitado de exercer qualquer atividade profissional, embora possa realizar tarefas básicas.'
        }
      },
      messages: {
        submitSuccess: 'Pedido submetido com sucesso! Irá receber instruções por email.',
        submitError: 'Erro ao enviar pedido. Tente novamente ou contacte-nos.'
      },
      emailSummary: {
        person: 'Pessoa',
        name: 'Nome:',
        birth: 'Nascimento:',
        nif: 'NIF:'
      },
      backgroundAlt: 'Plano de proteção familiar — Seguro de Vida'
    },
    sim_home: {
      title: 'Simulação Seguro Habitação',
      stepProgress: 'Passo {{step}} de 3',
      step1Title: '1. Dados do Imóvel',
      step2Title: '2. Dados Pessoais',
      step3Title: '3. Produto',
      labels: {
        situacao: 'Situação',
        tipoImovel: 'Tipo de imóvel',
        utilizacao: 'Utilização',
        anoConstrucao: 'Ano de construção',
        area: 'Área (m²)',
        codigoPostal: 'Código Postal do risco',
        construcao: 'Tipo de construção',
        capitalEdificio: 'Capital do Edifício (€)',
        capitalConteudo: 'Capital do Conteúdo (€)',
        seguranca: 'Sistemas de segurança',
        nomeCompleto: 'Nome completo',
        email: 'Email',
        telefone: 'Telefone',
        nif: 'NIF (Contribuinte)',
        addressHolderTitle: 'Morada do tomador',
        addressRiskTitle: 'Morada do risco',
        addressStreet: 'Morada',
        addressPostalCode: 'Código Postal',
        addressLocality: 'Localidade',
        riskAddressSameAsHolder: 'A morada do risco é igual à morada do tomador',
        adicionais: 'Coberturas adicionais',
        detalhesAdicionais: 'Detalhes adicionais',
        capitaisSelecionados: 'Capitais selecionados',
        capitalImovel: 'Capital Imóvel',
        capitalConteudoLabel: 'Capital Conteúdo'
      },
      options: {
        selecione: 'Selecione',
        situacao: { proprietario: 'Proprietário', inquilino: 'Inquilino' },
        tipoImovel: { apartamento: 'Apartamento', moradia: 'Moradia' },
        utilizacao: { permanente: 'Habitação permanente', secundaria: 'Habitação secundária', arrendamento: 'Arrendamento' },
        construcao: { betao: 'Betão armado', alvenaria: 'Alvenaria (tijolo/pedra)', madeira: 'Madeira' },
        seguranca: { alarme: 'Alarme', portaBlindada: 'Porta blindada', cctv: 'CCTV' }
      },
      placeholders: {
        year: 'AAAA',
        area: 'ex.: 120',
        postal: '____-___',
        capEdificio: 'ex.: 150000',
        capConteudo: 'ex.: 25 000',
        yourName: 'O seu nome',
        email: 'nome@servidor.pt',
        phone: '__ _______',
        nif: '___ ___ ___',
        addressStreet: 'Rua, nº, andar…',
        addressLocality: 'ex.: Ansião',
        details: 'Descreva necessidades específicas ou coberturas desejadas...'
      },
      product: {
        cards: {
          base: { title: 'Edifício', desc: 'Cobertura do edifício com RC, incêndio/explosão, sobretensão elétrica e danos por água.' },
          intermedio: { title: 'Edifício + Conteúdo', desc: 'Inclui cobertura de conteúdo com RC, incêndio/explosão, sobretensão elétrica e danos por água.' },
          completo: { title: 'Edifício + Conteúdo + Sismos', desc: 'Cobertura alargada incluindo eventos sísmicos, com RC e coberturas para edifício e conteúdo.' }
        },
        bullets: ['Responsabilidade civil','Incêndio e explosão','Sobretensão elétrica','Danos por água','Roubo (conteúdo)','Eventos sísmicos']
      },
      extras: { earthquake: 'Eventos sísmicos', garageVehicles: 'Veículos em garagem' },
      buttons: { prev: 'Anterior', next: 'Próximo', submit: 'Pedir proposta' },
      messages: {
        step1Missing: 'Preencha todos os campos obrigatórios do imóvel.',
        atLeastOneCapital: 'Indique pelo menos um capital: edifício ou conteúdo.',
        postalInvalid: 'Código postal inválido. Formato XXXX-XXX.',
        yearInvalid: 'Ano de construção inválido (AAAA).',
        nameRequired: 'Indique o seu nome.',
        emailInvalid: 'Indique um email válido.',
        phoneInvalid: 'O telefone deve ter 9 dígitos.',
        nifInvalid: 'O NIF deve ter 9 dígitos.',
        addressHolderRequired: 'Indique a morada do tomador (morada, código postal e localidade).',
        addressRiskRequired: 'Indique a morada do risco (morada e localidade).',
        productRequired: 'Selecione um produto.',
        rgpdRequired: 'Tem de aceitar a Política de Privacidade & RGPD.',
        submitSuccess: 'Pedido enviado com sucesso! Irá receber instruções por email.',
        submitError: 'Ocorreu um erro ao enviar o pedido. Tente novamente.'
      }
    },
    sim_saude: {
      title: 'Simulação Seguro Saúde',
      stepProgress: 'Passo {{step}} de 2',
      step1Title: '1. Pessoas Seguras',
      step2Title: '2. Escolha uma opção',
      placeholders: {
        fullName: 'Nome completo',
        birthDate: 'Data de nascimento (dd-mm-aaaa)',
        nif: 'NIF',
        yourName: 'O seu nome',
        email: 'Email',
        phone: '9 dígitos'
      },
      buttons: {
        addInsured: 'Adicionar pessoa segura',
        remove: 'Remover',
        maxReached5: 'Máximo de 5 pessoas atingido',
        prev: 'Anterior',
        next: 'Próximo',
        submit: 'Pedir proposta'
      },
      validations: {
        insuredNameRequired: 'Por favor, preencha o nome completo.',
        insuredBirthRequired: 'Por favor, preencha a data de nascimento.',
        insuredNifRequired: 'Por favor, preencha o NIF com 9 dígitos.',
        planRequired: 'Por favor, escolha uma das opções de plano.',
        nameRequired: 'Por favor, indique o seu nome.',
        emailRequired: 'Por favor, preencha o seu email.',
        emailInvalid: 'Por favor, insira um email válido (ex.: nome@servidor.pt).',
        phoneRequired: 'Por favor, preencha o telefone (9 dígitos).'
      },
      table: {
        coverages: 'Coberturas',
        option1: 'Opção 1',
        option2: 'Opção 2',
        option3: 'Opção 3',
        included: 'Incluído',
        notApplicable: '—',
        optional: 'Opcional',
        add: 'Adicionar',
        discounts: 'Descontos',
        partial: 'Parcial',
        telemedicine: 'Telemedicina'
      },
      benefits: {
        consultas: 'Consultas (rede convencionada)',
        exames: 'Exames e diagnósticos',
        ambulatoria: 'Cuidados ambulatórios',
        internamento: 'Internamento',
        urgencias: 'Urgências',
        parto: 'Parto e cuidados de maternidade',
        estomatologia: 'Estomatologia',
        medicamentos: 'Medicamentos com prescrição',
        internacional: 'Assistência em viagem (internacional)',
        domicilio: 'Consulta ao domicílio / Telemedicina'
      },
      messages: {
        submitSuccess: 'Pedido submetido com sucesso! Irá receber instruções por email.',
        submitError: 'Erro ao enviar pedido. Tente novamente ou contacte-nos.'
      },
      emailSummary: { person: 'Pessoa', name: 'Nome:', birth: 'Nascimento:', nif: 'NIF:' },
      backgroundAlt: 'Seguro Saúde'
    },
    sim_auto: {
      title: 'Simulação de Seguro Auto',
      stepProgress: 'Passo {{step}} de 3',
      step1Title: 'Passo 1 - Identificação do condutor',
      step2Title: 'Passo 2 - Identificação da viatura',
      step3Title: 'Passo 3 - Produto e coberturas adicionais',
      placeholders: {
        name: 'Nome completo',
        email: 'Email',
        birthDate: 'Data de nascimento (dd-mm-aaaa)',
        licenseDate: 'Data da Carta de condução (dd-mm-aaaa)',
        postalCode: 'Código Postal (____-___)',
        nif: 'NIF (Contribuinte)',
  carBrand: 'Marca da viatura',
  carModel: 'Modelo da viatura',
  carVersion: 'Versão',
        carYear: 'Ano',
        plate: 'XX-XX-XX',
        otherRequests: 'Ex.: limites, condutor jovem, franquias desejadas, observações...'
      },
      examples: {
        brand: 'Exemplo: Ford',
        model: 'Exemplo: Focus',
        version: 'Exemplo: 1.0 EcoBoost Titanium',
        year: 'Exemplo: 2018',
        plate: 'Exemplo: 12-AB-34'
      },
      validations: {
        under18: 'Apenas condutores com 18 anos ou mais podem prosseguir.',
        nameFull: 'Por favor, indique o nome completo (pelo menos dois nomes).',
        emailRequired: 'Por favor, preencha o email.',
        emailInvalid: 'Por favor, insira um email válido.',
        postalFormat: 'O código postal deve ter 7 dígitos numéricos (formato XXXX-XXX).',
        postalHelp: 'Por favor, insira o código postal no formato XXXX-XXX com 7 dígitos numéricos.',
        nifInvalid: 'NIF inválido.',
        nifRequired: 'Por favor, preencha o NIF válido com 9 dígitos.',
        plateFormat: 'Por favor, preencha a matrícula no formato XX-XX-XX.',
        brandRequired: 'Por favor, preencha a marca do carro.',
        modelRequired: 'Por favor, preencha o modelo do carro.',
        yearRequired: 'Por favor, preencha o ano do carro.',
        rgpdRequired: 'Por favor, aceite a Política de Privacidade & RGPD para prosseguir.'
      },
      typeLabel: 'Tipo de seguro:',
      typeSelectPlaceholder: 'Selecione o tipo de seguro',
      typeThirdParty: 'Terceiros',
      typeOwnDamage: 'Danos Próprios',
      typeThirdPartyInfo: 'Seguro de Terceiros: cobre danos causados a terceiros, pessoas e bens, mas não cobre danos ao seu próprio veículo.',
      typeOwnDamageInfo: 'Seguro de Danos Próprios: cobre danos ao seu próprio veículo, além dos danos causados a terceiros.',
      baseCoverLabel: 'Coberturas base:',
      additionalCoverages: 'Coberturas adicionais:',
      baseCoversThirdParty: ['Responsabilidade civil', 'Proteção jurídica'],
      baseCoversOwnDamage: ['Choque, colisão e capotamento', 'Furto ou roubo', 'Incêndio'],
      coverageLabels: {
        occupants: 'Ocupantes',
        glass: 'Vidros',
        assistance: 'Assistência em viagem',
        fire: 'Incêndio',
        theft: 'Roubo',
        naturalCatastrophes: 'Riscos catastróficos da natureza',
        vandalism: 'Atos de vandalismo',
        replacementVehicle: 'Veículo de Substituição'
      },
      buttons: { prev: 'Anterior', next: 'Próximo', simulate: 'Simular' },
      messages: {
        selectType: 'Por favor, selecione o tipo de seguro.',
        submitSuccess: 'Simulação submetida com sucesso!\nEmail enviado.',
        submitEmailError: 'Simulação submetida, mas houve erro ao enviar o email.'
      },
      summary: {
        title: 'Simulação',
        labels: {
          vehicle: 'Viatura:',
          nif: 'NIF:',
          birthDate: 'Data Nascimento:',
          licenseDate: 'Data Carta:',
          postalCode: 'Código Postal:',
          version: 'Versão:',
          type: 'Tipo:',
          coverages: 'Coberturas:',
          otherRequests: 'Outros pedidos:'
        }
      }
    },
    contact: {
      seoTitle: 'Contacto',
      seoDesc: 'Fale connosco para pedidos de informação, simulações ad hoc ou propostas personalizadas.',
      pageTitle: 'Fale connosco',
      pageSubtitle: 'Envie-nos um pedido de informação ou uma simulação ad hoc. Respondemos com brevidade.',
      phoneHeadline: 'Contacte-nos por telefone',
      phoneDesc: 'Linha direta para apoio e esclarecimentos.',
      phoneNumberLabel: 'Telefone:',
      callNowCta: 'Ligar agora',
      placeholders: {
        name: 'Nome completo',
        email: 'Email',
        phoneOptional: 'Telefone (opcional)',
        subjectOptional: 'Assunto (opcional)',
        message: 'Descreva o seu pedido ou dúvida...',
        productInterestOptional: 'Produto de interesse (opcional)'
      },
      requestType: {
        label: 'Tipo de pedido',
        info: 'Pedido de informação',
        adhoc: 'Pedido de simulação ad hoc',
        contact: 'Pedido de contacto',
        change: 'Pedido de alteração',
        other: 'Outro'
      },
      productInterest: {
        label: 'Produto de interesse',
        auto: 'Auto',
        life: 'Vida',
        health: 'Saúde',
        home: 'Habitação',
        fleet: 'Frota',
        work: 'Acidentes de Trabalho',
        mreb: 'Multirriscos Empresarial',
        rcp: 'RC Profissional',
        other: 'Outro'
      },
      labels: {
        contactDataTitle: 'Dados de contacto',
        requestTitle: 'Pedido',
        name: 'Nome',
        email: 'Email',
        phone: 'Telefone',
        requestType: 'Tipo de pedido',
        productInterest: 'Produto de interesse',
        subject: 'Assunto',
        message: 'Mensagem',
      },
      messages: {
        success: 'Obrigado! Recebemos o seu pedido e entraremos em contacto brevemente.',
        error: 'Ocorreu um erro ao enviar. Tente novamente.',
        sending: 'A enviar…',
        submit: 'Enviar pedido'
      },
      map: {
        whereTitle: 'Onde estamos',
        whereDesc: 'Vila de Ansião, distrito de Leiria.',
        iframeTitle: 'Mapa de Ansião, Leiria',
        openInMaps: 'Abrir no Google Maps'
      },
      rgpdText: 'Li e aceito a <0>Política de Privacidade & RGPD</0>.',
      validation: {
        nameRequired: 'Indique o seu nome.',
        emailInvalid: 'Insira um email válido.',
        messageRequired: 'Descreva o seu pedido.',
        rgpdRequired: 'Necessário aceitar a Política de Privacidade & RGPD.'
      },
      email: {
        subjectPrefix: 'Contacto: ',
        typePrefix: 'Contacto geral',
        typeWithProduct: 'Contacto / {{product}}'
      }
    },
    product_fleet: {
      seoTitle: 'Seguro Frota Empresarial',
      seoDesc: 'Gestão eficiente e proteção completa para os veículos da sua empresa. Solicite uma proposta personalizada.',
      headerTitle: 'Seguro Frota Empresarial',
      headerSubtitle: 'Gestão eficiente e proteção completa para todos os veículos da sua empresa',
      badge: 'Produto Fidelidade',
      ctaRequest: 'Solicitar proposta',
      ctaContact: 'Fale com um consultor',
      whyTitle: 'Por que escolher o Seguro Frota Empresarial?',
      whyItems: [
        'Gestão centralizada de todos os veículos da empresa',
        'Proteção contra danos próprios, terceiros e acidentes',
        'Assistência 24h em todo o território nacional',
        'Opções flexíveis de coberturas e capitais'
      ],
      coveragesTitle: 'Coberturas disponíveis',
      coverages: [
        { title: 'Danos Próprios', desc: 'Cobertura para danos causados aos veículos da frota por acidente, colisão, incêndio, furto ou roubo.' },
        { title: 'Responsabilidade Civil', desc: 'Proteção contra danos causados a terceiros, pessoas e bens.' },
        { title: 'Assistência em Viagem', desc: 'Serviços de reboque, transporte, alojamento e apoio em caso de avaria ou acidente.' },
        { title: 'Proteção Jurídica', desc: 'Apoio legal em situações de litígio relacionadas com os veículos da empresa.' }
      ],
      advantagesTitle: 'Vantagens exclusivas',
      advantages: [
        'Gestão digital da apólice e sinistros',
        'Atendimento especializado para empresas',
        'Planos ajustáveis conforme o perfil da empresa',
        'Cobertura para condutores e colaboradores'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Solicite uma proposta personalizada para a sua empresa.',
        'Escolha as coberturas e capitais que melhor se adaptam à sua frota.',
        'Envie os documentos necessários e finalize a contratação com o apoio de um consultor.'
      ],
      formTitle: 'Solicitar Proposta - Frota',
      stepProgress: 'Passo {{step}} de 3',
      step1Title: 'Passo 1 - Identificação do responsável',
      step2Title: 'Passo 2 - Identificação das viaturas',
      step3Title: 'Passo 3 - Produto e coberturas adicionais',
      placeholders: {
        name: 'Nome completo',
        email: 'Email',
        nif: 'NIF (Contribuinte)',
        postalCode: 'Código Postal (____-___)',
        birthDate: 'Data de nascimento (dd-mm-aaaa)',
        licenseDate: 'Data da Carta de condução (dd-mm-aaaa)',
        carBrand: 'Marca',
        carModel: 'Modelo',
        carYear: 'Ano',
        plate: 'XX-XX-XX',
        otherRequests: 'Ex.: limites por viatura, condutores nomeados, franquias desejadas, observações...'
      },
      vehicles: { titlePrefix: 'Viatura #', add: '+ Adicionar viatura', remove: 'Remover' },
      typeLabel: 'Tipo de seguro:',
      typeSelectPlaceholder: 'Selecione o tipo de seguro',
      typeThirdParty: 'Terceiros',
      typeOwnDamage: 'Danos Próprios',
      typeThirdPartyInfo: 'Seguro de Terceiros: cobre danos a terceiros, pessoas e bens.',
      typeOwnDamageInfo: 'Seguro de Danos Próprios: cobre danos ao seu veículo, além de terceiros.',
      additionalCoverages: 'Coberturas adicionais:',
      coverageLabels: {
        occupants: 'Ocupantes',
        glass: 'Vidros',
        assistance: 'Assistência em viagem',
        fire: 'Incêndio',
        theft: 'Roubo',
        naturalCatastrophes: 'Riscos catastróficos da natureza',
        vandalism: 'Atos de vandalismo',
        replacementVehicle: 'Veículo de Substituição'
      },
      otherRequestsLabel: 'Outros pedidos / detalhes',
      buttons: { prev: 'Anterior', next: 'Próximo', submit: 'Pedir Proposta' },
      rgpdText: 'Li e aceito a <0>Política de Privacidade & RGPD</0>.',
      messages: {
        selectType: 'Por favor, selecione o tipo de seguro.',
        submitSuccess: 'Pedido enviado com sucesso!',
        submitEmailError: 'Pedido submetido, mas houve erro ao enviar o email.',
        under18: 'Apenas condutores com 18 anos ou mais podem prosseguir.'
      },
      summary: {
        title: 'Proposta Frota',
        labels: {
          nif: 'NIF (Empresa):',
          birthDate: 'Data Nascimento:',
          licenseDate: 'Data Carta:',
          postalCode: 'Código Postal:',
          vehicles: 'Viaturas:',
          type: 'Tipo:',
          coverages: 'Coberturas:',
          otherRequests: 'Outros pedidos:'
        }
      }
    },
    product_health: {
      seoTitle: 'Seguro de Saúde',
      seoDesc: 'Planos de saúde com rede ampla e assistência 24h.',
      headerTitle: 'Seguro Saúde',
      headerSubtitle: 'Cuide do seu bem-estar com planos flexíveis e ampla cobertura',
      ctaSimulate: 'Simular Seguro Saúde',
      ctaContact: 'Fale com um consultor',
      whyTitle: 'Por que escolher o Seguro Saúde?',
      whyItems: [
        'Acesso a rede ampla de hospitais e clínicas',
        'Descontos em medicamentos e exames',
        'Consultas com especialistas sem burocracia',
        'Internamento hospitalar e cirurgias cobertas'
      ],
      coveragesTitle: 'Coberturas disponíveis',
      coverages: [
        { title: 'Consultas e Exames', desc: 'Cobertura para consultas médicas, exames laboratoriais e de imagem.' },
        { title: 'Internamento Hospitalar', desc: 'Cobertura para despesas de internamento e cirurgias.' },
        { title: 'Medicamentos', desc: 'Descontos e cobertura parcial para medicamentos prescritos.' },
        { title: 'Rede de Clínicas e Hospitais', desc: 'Acesso facilitado a uma rede credenciada de saúde.' }
      ],
      benefitsTitle: 'Vantagens exclusivas',
      benefits: [
        'Gestão digital da apólice e reembolsos',
        'Atendimento 24h para emergências',
        'Planos flexíveis para diferentes perfis',
        'Opção de cobertura para toda a família'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Simule o seu seguro saúde online ou fale com um consultor.',
        'Escolha o plano e coberturas que melhor se adaptam ao seu perfil.',
        'Envie os documentos necessários e finalize a contratação.'
      ]
    },
    product_home: {
      seoTitle: 'Seguro Multirriscos Habitação',
      seoDesc: 'Proteja o seu lar contra imprevistos com coberturas flexíveis.',
      headerTitle: 'Seguro Multirriscos Habitação',
      headerSubtitle: 'Proteja seu lar contra imprevistos e garanta tranquilidade para sua família',
      ctaSimulate: 'Simular Seguro Habitação',
      whyTitle: 'Por que escolher o Multirriscos Habitação?',
      whyItems: [
        'Proteção contra incêndio, inundação, roubo e outros riscos',
        'Assistência 24h para emergências domésticas',
        'Cobertura de responsabilidade civil',
        'Opções flexíveis de franquias e capitais'
      ],
      coveragesTitle: 'Coberturas disponíveis',
      coverages: [
        { title: 'Incêndio, Inundação e Fenómenos Naturais', desc: 'Proteção contra danos causados por fogo, água e eventos naturais.' },
        { title: 'Roubo e Furto', desc: 'Cobertura para bens roubados ou furtados na residência.' },
        { title: 'Responsabilidade Civil', desc: 'Proteção contra danos causados a terceiros.' },
        { title: 'Assistência 24h', desc: 'Serviços de emergência como chaveiro, eletricista e encanador.' }
      ],
      benefitsTitle: 'Vantagens exclusivas',
      benefits: [
        'Gestão digital da apólice e sinistros',
        'Atendimento 24h para emergências',
        'Planos flexíveis para diferentes perfis',
        'Opção de cobertura para toda a família'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Simule o seu seguro habitação online ou fale com um consultor.',
        'Escolha o plano e coberturas que melhor se adaptam ao seu perfil.',
        'Envie os documentos necessários e finalize a contratação.'
      ]
    },
    landing_kristina: {
      kristina: {
        seoTitle: 'Depressão Kristin — Multirriscos Habitação',
        seoDesc: 'Apoio rápido, orientação e simulação de Multirriscos Habitação para reforçar a proteção do seu lar.',
        heroAlt: 'Seguro Habitação — proteção do lar',
        heroTitle: 'Depressão Kristin: proteja a sua casa',
        heroSubtitle: 'Se teve danos ou quer reforçar a proteção, ajudamos a encontrar um Multirriscos Habitação ajustado ao seu risco.',
        ctaQuote: 'Simular Multirriscos Habitação',
        ctaContact: 'Falar connosco',
        emergencyNote: 'Em situação de emergência, contacte 112. Para apoio/seguro, fale connosco.',
        section1Title: 'Como podemos ajudar',
        section1Items: [
          { icon: '🧾', title: 'Apoio na participação', desc: 'Orientação sobre documentação e próximos passos.' },
          { icon: '🔎', title: 'Análise de coberturas', desc: 'Ajudamos a ajustar coberturas (ex.: fenómenos naturais, danos por água) ao seu caso.' },
          { icon: '⚡', title: 'Resposta rápida', desc: 'Encaminhamos o pedido e aceleramos o contacto com a equipa certa.' },
          { icon: '🛠️', title: 'Assistência ao lar', desc: 'Apoio em urgências domésticas, conforme as condições da apólice.' }
        ],
        section2Title: 'O que tipicamente se procura cobrir',
        section2Items: [
          { title: 'Fenómenos naturais', desc: 'Danos associados a vento forte, chuva intensa e eventos naturais, conforme apólice.' },
          { title: 'Danos por água', desc: 'Danos por ruturas, infiltrações e fugas, conforme condições contratadas.' },
          { title: 'Quebra de vidros', desc: 'Quebra acidental de vidros e outros elementos, conforme apólice.' },
          { title: 'Assistência 24h', desc: 'Serviços de urgência (ex.: canalizador/eletricista), conforme apólice.' }
        ],
        coverageDisclaimer: 'As coberturas, exclusões e capitais dependem da seguradora e das condições particulares do contrato.',
        section3Title: 'Próximos passos',
        section3Steps: [
          'Registe fotos/vídeos dos danos e garanta segurança (evite zonas instáveis).',
          'Fale connosco com a morada do risco e um resumo do ocorrido.',
          'Se já tem seguro, ajudamos a identificar coberturas e a preparar a participação.',
          'Se quer reforçar proteção, faça uma simulação e propomos opções.'
        ],
        ctaGuide: 'Guia rápido pós-tempestade',
        ctaQuoteSecondary: 'Fazer simulação'
      },
      guia: {
        seoTitle: 'Guia pós-tempestade — Depressão Kristin',
        seoDesc: 'Checklist rápido para agir após danos e preparar o contacto com a seguradora.',
        title: 'Guia rápido pós-tempestade',
        subtitle: 'Checklist para organizar informação e pedir apoio após a Depressão Kristin.',
        ctaContact: 'Pedir apoio',
        ctaQuote: 'Simular seguro',
        stepsTitle: 'Checklist',
        steps: [
          { title: 'Segurança primeiro', desc: 'Se houver risco imediato, afaste-se e contacte os serviços de emergência.' },
          { title: 'Registe os danos', desc: 'Fotografe/filme e anote data/hora aproximada e o que foi afetado.' },
          { title: 'Evite agravamentos', desc: 'Sempre que seguro, proteja áreas expostas (ex.: coberturas temporárias) e guarde recibos.' },
          { title: 'Organize documentos', desc: 'Tenha à mão identificação, morada do risco e, se existir, dados da apólice/seguradora.' },
          { title: 'Fale connosco', desc: 'Enviamos orientação e ajudamos a avançar com participação/simulação.' }
        ],
        disclaimer: 'Informação geral. Não substitui as condições da sua apólice nem orientações de entidades oficiais.',
        whatWeNeedTitle: 'Para o ajudar mais depressa, envie:',
        whatWeNeedItems: [
          'Nome e contacto',
          'Morada do risco',
          'Descrição do dano e data aproximada',
          'Fotos/vídeos e, se existir, nº apólice/seguradora'
        ],
        ctaBack: 'Voltar à landing',
        ctaContactSecondary: 'Falar connosco'
      }
    },
    product_mreb: {
      seoTitle: 'Seguro Multirriscos Empresarial',
      seoDesc: 'Proteja edifícios, equipamentos e mercadorias da sua empresa com coberturas flexíveis.',
      headerTitle: 'Seguro Multirriscos Empresarial',
      headerSubtitle: 'Proteja o património da sua empresa contra imprevistos e garanta a continuidade do seu negócio',
      ctaContact: 'Fale com um consultor',
      whatTitle: 'O que é o Seguro Multirriscos Empresarial?',
      whatDesc: 'O Seguro Multirriscos Empresarial foi desenvolvido para proteger edifícios, equipamentos, mercadorias e outros bens essenciais ao funcionamento da sua empresa, garantindo apoio em situações de sinistro e minimizando prejuízos.',
      whoTitle: 'Para quem é indicado?',
      whoItems: [
        'Empresas de todos os setores e dimensões',
        'Comércios, indústrias e serviços',
        'Proprietários de edifícios comerciais'
      ],
      coveragesTitle: 'Coberturas principais',
      coverages: [
        { title: 'Incêndio, Inundação e Fenómenos Naturais', desc: 'Proteção contra danos causados por fogo, água, tempestades e outros eventos naturais.' },
        { title: 'Roubo e Furto', desc: 'Cobertura para bens e mercadorias em caso de roubo ou furto nas instalações.' },
        { title: 'Responsabilidade Civil', desc: 'Proteção contra danos causados a terceiros no exercício da atividade empresarial.' },
        { title: 'Assistência 24h', desc: 'Serviços de emergência como chaveiro, eletricista e canalizador para situações imprevistas.' }
      ],
      advantagesTitle: 'Vantagens do seguro',
      advantages: [
        'Tranquilidade para gerir o seu negócio',
        'Assistência rápida em situações de emergência',
        'Planos flexíveis e adaptáveis à realidade da empresa',
        'Cobertura para edifícios, equipamentos e mercadorias'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Solicite uma proposta personalizada para a sua empresa.',
        'Escolha as coberturas e capitais que melhor se adaptam ao seu negócio.',
        'Finalize a contratação com o apoio de um consultor especializado.'
      ]
    },
    product_rcp: {
      seoTitle: 'Seguro Responsabilidade Civil Profissional',
      seoDesc: 'Proteção financeira contra reclamações por erros e omissões no exercício profissional. Simule já.',
      headerTitle: 'Seguro Responsabilidade Civil Profissional',
      headerSubtitle: 'Proteja a sua atividade profissional contra reclamações e imprevistos.',
      ctaSimulate: 'Simular seguro responsabilidade civil',
      ctaContact: 'Fale com um consultor',
      whatTitle: 'O que é este seguro?',
      whatDesc: 'O Seguro de Responsabilidade Civil Profissional protege profissionais e empresas contra prejuízos financeiros causados a terceiros, resultantes de erros, omissões ou negligência no exercício da sua atividade.',
      whoTitle: 'Para quem é indicado?',
      whoItems: [
        'Profissionais liberais (advogados, engenheiros, arquitetos, médicos, etc.)',
        'Empresas de consultoria e prestação de serviços',
        'Outros profissionais sujeitos a responsabilidade civil no exercício da sua atividade'
      ],
      coveragesTitle: 'Coberturas principais',
      coverages: [
        { title: 'Erros e Omissões', desc: 'Proteção em caso de danos causados a terceiros por falhas profissionais.' },
        { title: 'Despesas de Defesa', desc: 'Inclui custos legais e honorários de advogados em processos judiciais.' },
        { title: 'Indemnizações', desc: 'Cobre indemnizações devidas a terceiros por danos materiais ou patrimoniais.' },
        { title: 'Proteção da Reputação', desc: 'Apoio em situações que possam afetar a imagem profissional.' }
      ],
      advantagesTitle: 'Vantagens do seguro',
      advantages: [
        'Tranquilidade para exercer a sua profissão',
        'Proteção financeira em caso de reclamações',
        'Processo de contratação simples e rápido',
        'Adaptável a diferentes áreas profissionais'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Solicite uma proposta personalizada para a sua atividade.',
        'Analise as coberturas e escolha as opções que melhor se adaptam ao seu perfil.',
        'Finalize a contratação com o apoio de um consultor especializado.'
      ]
    },
    product_condo: {
      seoTitle: 'Seguro Condomínio',
      seoDesc: 'Proteção completa para edifícios e áreas comuns do seu condomínio. Saiba mais.',
      headerTitle: 'Seguro Condomínio',
      headerSubtitle: 'Proteção completa para edifícios e áreas comuns do seu condomínio',
      ctaSimulate: 'Simular seguro Condomínio',
      ctaContact: 'Fale com um consultor',
      whatTitle: 'O que é o Seguro de Condomínio?',
      whatDesc: 'O Seguro de Condomínio foi pensado para proteger o edifício e as suas partes comuns, cobrindo danos por incêndio, fenómenos naturais, inundações, responsabilidade civil e outras situações que podem afetar a tranquilidade dos condóminos.',
      whoTitle: 'Para quem é indicado?',
      whoItems: [
        'Condomínios residenciais e mistos',
        'Prédios com garagens, arrecadações e espaços comuns',
        'Administrações de condomínio e comissões de condóminos'
      ],
      coveragesTitle: 'Coberturas principais',
      coverages: [
        { title: 'Incêndio, Inundação e Fenómenos Naturais', desc: 'Proteção contra danos causados por fogo, água, tempestades e outros eventos naturais.' },
        { title: 'Responsabilidade Civil do Condomínio', desc: 'Cobertura por danos causados a terceiros nas áreas comuns do edifício.' },
        { title: 'Danos por Água e Quebra de Vidros', desc: 'Proteção para sinistros frequentes que afetam as zonas comuns e fachadas.' },
        { title: 'Assistência 24h', desc: 'Apoio imediato com técnicos especializados para emergências.' }
      ],
      advantagesTitle: 'Vantagens do seguro',
      advantages: [
        'Proteção abrangente das partes comuns do edifício',
        'Segurança para condóminos e visitantes',
        'Coberturas de responsabilidade civil ajustáveis',
        'Assistência técnica 24 horas por dia'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Solicite uma proposta para o seu condomínio.',
        'Escolha as coberturas e capitais de acordo com as necessidades do edifício.',
        'Finalize com o apoio de um consultor especializado.'
      ]
    },
    product_work: {
      seoTitle: 'Seguro Acidentes de Trabalho Empresas',
      seoDesc: 'Proteção obrigatória e assistência completa para colaboradores. Peça a sua proposta.',
      headerTitle: 'Seguro Acidentes de Trabalho Empresas',
      headerSubtitle: 'Proteja os colaboradores da sua empresa com cobertura obrigatória e assistência completa',
      ctaRequest: 'Solicitar proposta',
      ctaContact: 'Fale com um consultor',
      whyTitle: 'Por que escolher o Seguro Acidentes de Trabalho?',
      whyItems: [
        'Cumpre a legislação obrigatória para empresas',
        'Proteção para colaboradores em caso de acidente durante o trabalho',
        'Assistência médica, hospitalar e farmacêutica',
        'Gestão digital de apólice e sinistros'
      ],
      coveragesTitle: 'Coberturas disponíveis',
      coverages: [
        { title: 'Despesas Médicas e Hospitalares', desc: 'Cobertura para tratamentos, consultas, internamentos e medicamentos necessários após acidente de trabalho.' },
        { title: 'Indemnizações por Incapacidade', desc: 'Garantia de indemnização em caso de incapacidade temporária ou permanente do colaborador.' },
        { title: 'Assistência Farmacêutica', desc: 'Cobertura para despesas com medicamentos prescritos após acidente.' },
        { title: 'Gestão de Sinistros', desc: 'Apoio na gestão e acompanhamento dos processos de sinistro.' }
      ],
      advantagesTitle: 'Vantagens exclusivas',
      advantages: [
        'Gestão digital da apólice e sinistros',
        'Atendimento especializado para empresas',
        'Planos ajustáveis conforme o perfil da empresa',
        'Cobertura para todos os colaboradores'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Solicite uma proposta personalizada para a sua empresa.',
        'Escolha as coberturas e capitais que melhor se adaptam ao seu negócio.',
        'Finalize a contratação com o apoio de um consultor especializado.'
      ],
      formTitle: 'Solicitar Proposta - Acidentes de Trabalho'
    },
    products: {
      title: 'Produtos de Seguros — Particulares e Empresas',
      description: 'Conheça todas as soluções: Auto, Vida, Saúde, Habitação, Frota, Acidentes de Trabalho, Multirriscos Empresarial e RC Profissional.',
      heading: 'Os nossos produtos',
      subheading: 'Soluções para particulares e empresas.',
      individuals: 'Particulares',
      business: 'Empresas',
      // cards
      individualsCards: {
        auto: { name: 'Seguro Auto', desc: 'Proteção completa para o seu veículo.', to: 'produto-auto' },
        life: { name: 'Seguro Vida', desc: 'Segurança para si e para a sua família.', to: 'produto-vida' },
        health: { name: 'Seguro Saúde', desc: 'Cuide do seu bem-estar com planos flexíveis.', to: 'produto-saude' },
        home: { name: 'Seguro Multirriscos Habitação', desc: 'Proteja o seu lar contra imprevistos.', to: 'produto-habitacao' },
      },
      businessCards: {
        fleet: { name: 'Seguro Frota', desc: 'Proteção para todos os veículos da empresa.', to: 'produto-frota' },
        work: { name: 'Seguro Acidentes de Trabalho', desc: 'Cobertura para colaboradores em caso de acidente.', to: 'produto-acidentes-trabalho' },
        rcp: { name: 'Seguro Responsabilidade Civil Profissional', desc: 'Proteja a sua atividade contra danos a terceiros.', to: 'produto-responsabilidade-civil-profissional' },
        mreb: { name: 'Seguro Multirriscos Empresarial', desc: 'Cobertura para instalações e bens empresariais.', to: 'produto-multirriscos-empresarial' },
        condo: { name: 'Seguro Condomínio', desc: 'Proteção completa para edifícios e áreas comuns.', to: 'produto-condominio' },
      },
    },
    product_auto: {
      seoTitle: 'Seguro Automóvel',
      seoDesc: 'Proteja o seu veículo com coberturas completas e assistência 24h. Simule e fale com um consultor.',
      headerTitle: 'Seguro Automóvel',
      headerSubtitle: 'Proteja o seu veículo com as melhores coberturas do mercado',
      ctaSimulate: 'Simular Seguro Auto',
      ctaContact: 'Fale com um consultor',
      whyTitle: 'Por que escolher o Seguro Auto?',
      whyItems: [
        'Proteção completa contra danos próprios e a terceiros',
        'Assistência em viagem 24h em Portugal e no estrangeiro',
        'Opções flexíveis de coberturas e franquias',
        'Processo de sinistro simples e rápido',
        'Descontos para condutores experientes e famílias'
      ],
      coveragesTitle: 'Coberturas disponíveis',
      coverages: [
        { title: 'Responsabilidade Civil Obrigatória', desc: 'Cobre danos causados a terceiros, pessoas e bens.' },
        { title: 'Danos Próprios', desc: 'Cobre danos ao seu próprio veículo em caso de acidente, choque, colisão, capotamento, incêndio, furto ou roubo.' },
        { title: 'Proteção Jurídica', desc: 'Assistência legal em caso de litígio relacionado com o veículo.' },
        { title: 'Assistência em Viagem', desc: 'Reboque, transporte, alojamento e outros serviços em caso de avaria ou acidente.' }
      ],
      benefitsTitle: 'Vantagens exclusivas',
      benefits: [
        'Gestão digital de apólice e sinistros',
        'Rede de oficinas recomendadas',
        'Descontos para veículos elétricos e híbridos',
        'Franquias ajustáveis conforme sua necessidade'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Simule o seu seguro auto online ou fale com um consultor.',
        'Escolha as coberturas e franquias que melhor se adaptam ao seu perfil.',
        'Envie os documentos necessários e finalize a contratação.'
      ]
    },
    product_life: {
      seoTitle: 'Seguro de Vida',
      seoDesc: 'Proteção financeira e tranquilidade para si e para a sua família.',
      headerTitle: 'Seguro Vida',
      headerSubtitle: 'Proteção financeira e tranquilidade para você e sua família',
      ctaSimulate: 'Simular seguro Vida',
      ctaContact: 'Fale com um consultor',
      typesTitle: 'Tipos de Seguro Vida',
      types: [
        { title: 'Vida Risco', desc: 'Proteção em caso de morte ou invalidez, garantindo segurança financeira para os beneficiários.' },
        { title: 'Vida Financeiro', desc: 'Acumulação de capital e proteção, ideal para quem deseja poupar e garantir o futuro da família.' },
        { title: 'Vida Misto', desc: 'Combina proteção e poupança, oferecendo cobertura em caso de morte, invalidez e sobrevivência.' }
      ],
      coveragesTitle: 'Coberturas e Benefícios',
      coverages: [
        { title: 'Morte ou Invalidez', desc: 'Proteção financeira para a família em caso de falecimento ou invalidez do segurado.' },
        { title: 'Doenças Graves', desc: 'Cobertura para diagnóstico de doenças graves, garantindo apoio financeiro.' },
        { title: 'Sobrevivência', desc: 'Recebimento de capital ao final do contrato, caso o segurado esteja vivo.' },
        { title: 'Poupança e Investimento', desc: 'Acumulação de capital para projetos futuros, educação ou aposentadoria.' }
      ],
      advantagesTitle: 'Vantagens do Seguro Vida',
      advantages: [
        'Proteção para toda a família',
        'Flexibilidade de coberturas e capitais',
        'Opção de poupança e investimento',
        'Cobertura para doenças graves'
      ],
      howTitle: 'Como contratar?',
      howSteps: [
        'Simule o seu seguro vida online ou fale com um consultor.',
        'Escolha o tipo de seguro e coberturas que melhor se adaptam ao seu perfil.',
        'Envie os documentos necessários e finalize a contratação.'
      ]
    },
    home: {
      heroTitle: 'Seguros em Ansião (Leiria) — Auto, Vida, Saúde e Habitação',
      heroDesc: 'Ansião Seguros: simulações rápidas e propostas personalizadas para Auto, Vida, Saúde, Habitação e soluções para empresas.',
      featuredIndividuals: 'Produtos para pessoas particulares',
      heroSlides: [
        {
          title: 'Simule o seu seguro auto em segundos',
          text: 'Proteção completa para o seu veículo com atendimento personalizado.',
          cta: 'Simule seu seguro auto'
        },
        {
          title: 'Seguro Vida e Saúde',
          text: 'Segurança para você e sua família, com planos flexíveis.',
          cta: 'Simule seguro vida'
        },
        {
          title: 'Seguro Multirriscos Habitação',
          text: 'Proteja seu lar contra imprevistos e garanta tranquilidade.',
          cta: 'Simule seguro multirriscos habitação'
        }
      ],
      productsIndividuals: {
        auto: { name: 'Seguro Auto', desc: 'Proteção completa para seu veículo.' },
        life: { name: 'Seguro Vida', desc: 'Segurança para você e sua família.' },
        health: { name: 'Seguro Saúde', desc: 'Cuide do seu bem-estar.' },
        home: { name: 'Seguro Multirriscos Habitação', desc: 'Proteja seu lar contra imprevistos.' }
      },
      featuredBusiness: 'Produtos para empresas',
      productsBusiness: {
        fleet: { name: 'Seguro Frota', desc: 'Proteção para todos os veículos da empresa.' },
        work: { name: 'Seguro Acidentes de Trabalho', desc: 'Cobertura para colaboradores em caso de acidente.' },
        rcp: { name: 'Seguro Responsabilidade Civil Profissional', desc: 'Proteja sua empresa contra danos a terceiros.' },
        mreb: { name: 'Seguro Multirriscos Empresarial', desc: 'Cobertura para as suas instalações e bens empresariais.' },
        condo: { name: 'Seguro Condomínio', desc: 'Proteção completa para edifícios e áreas comuns.' }
      },
      benefitsTitle: 'Porque escolher Ansião Seguros?',
      benefits: [
        'Atendimento personalizado e consultoria especializada',
        'Simulação rápida e automática realizada pelos nossos sistemas inteligentes.',
        'Soluções para empresas e famílias',
        'Diversos produtos: auto, vida, saúde, residencial e mais'
      ],
      ctaMore: 'Saiba mais',
      ctaOpen: 'Abrir'
    }
  },
  en: {
    common: {
      brand: 'Ansião Seguros',
      yes: 'Yes',
      no: 'No',
      nav: {
        homeLink: 'Home',
        auto: 'Car Quote',
        life: 'Life Quote',
        health: 'Health Quote',
        homeInsurance: 'Home Insurance Quote',
        simulator: 'Quotes',
        individuals: 'Individuals',
        business: 'Business',
        businessRcp: 'Professional Liability Quote',
        businessCondo: 'Condominium Quote',
        businessMreb: 'Business Multi-risk (info)',
        businessFleet: 'Fleet (info)',
        businessWork: 'Workers’ Compensation (info)',
        products: 'Products',
        agenda: 'Agenda',
        news: 'News',
        contact: 'Contact',
        mySimulations: 'My quotes',
        myPolicies: 'My policies'
      },
      auth: {
        hello: 'Hello',
        loginCta: 'Hello! Sign in',
        signIn: 'Sign in',
        signOut: 'Sign out',
        loginTitle: 'Sign in',
        continueWithGoogle: 'Continue with Google',
        or: 'or',
        signInWithEmail: 'Sign in with Email/Password',
        createAccount: 'Create account',
        forgotPassword: 'Forgot password',
        loginWithEmailTitle: 'Sign in with Email',
        email: 'Email',
        password: 'Password',
        passwordMin: 'Password (min 6)',
        registerTitle: 'Create account',
        name: 'Name',
        register: 'Register',
        resetTitle: 'Recover password',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        googleLoginFailed: 'Failed to authenticate with Google',
        loginFailed: 'Login failed',
        provideName: 'Please provide your name.',
        registerFailed: 'Registration failed',
        emailSent: 'Recovery email sent.',
        emailSentSpamNote: 'If you don\'t see it, please also check your spam/junk folder.',
        resetFailed: 'Failed to send recovery email',
        errors: {
          generic: 'An error occurred. Please try again.',
          'invalid-credential': 'Invalid email or password.',
          'invalid-email': 'Invalid email address.',
          'user-not-found': 'No account found with this email.',
          'wrong-password': 'Incorrect password.',
          'missing-password': 'Please enter your password.',
          'too-many-requests': 'Too many attempts. Please try again later.',
          'network-request-failed': 'No internet connection. Please try again.',
          'email-already-in-use': 'An account with this email already exists.',
          'weak-password': 'Password must be at least 6 characters.',
          'popup-closed-by-user': 'Popup window closed before completing.',
          'popup-blocked': 'Popup blocked by the browser.'
        },
        verifyTitle: 'Verify email',
        verifyIntro: 'We sent a verification link to your email{{email}}. Please confirm to unlock all features.',
        resendVerification: 'Resend email',
        resending: 'Resending…',
        verificationEmailSent: 'Verification email resent.',
        sendResetLink: 'Send recovery link'
        , registerSuccess: 'Account created. Check your email to activate.'
      },
      actions: {
        back: 'Back',
        cancel: 'Cancel',
        send: 'Send'
      },
      status: {
        draft: 'Draft',
        submitted: 'In Process',
        quoted: 'Quoted',
        archived: 'Archived'
      },
      a11y: {
        switchToEN: 'Switch to English',
        switchToPT: 'Switch to Portuguese',
      },
      chat: {
        title: 'Chat with us',
        subtitle: 'Tell us your request and our consultants will reach out.',
        talkNow: 'Chat now',
        callNow: 'Call now',
        callShort: 'Call',
        close: 'Close',
        namePlaceholder: 'Your name (optional)',
        emailPlaceholder: 'Email (optional)',
        phonePlaceholder: 'Phone (optional)',
        messagePlaceholder: 'Type your message... (Ctrl/⌘+Enter to send)',
        send: 'Send',
        sending: 'Sending…',
        sent: 'Message sent. Thank you!',
        error: 'Failed to send. Please try again.',
        you: 'You',
        agent: 'Agent',
        empty: 'Start by telling us how we can help.',
        whatsappNow: 'WhatsApp',
        whatsPrefill: 'Hello! I would like to chat with Ansião Seguros.'
      }
    },
    mysims: {
      seoTitle: 'My quotes',
      seoDesc: 'User area to view your submitted quotes.',
      heading: 'My quotes',
      welcome: 'Welcome{{name}}. Here you can view the quotes you have submitted with your account.',
      authRequired: 'You need to sign in to see your quotes.',
      filters: {
        typeLabel: 'Insurance type:',
        statusLabel: 'Status:',
        all: 'All',
        types: {
          auto: 'Auto',
          vida: 'Life',
          saude: 'Health',
          habitacao: 'Home',
          rc_prof: 'Professional Liability',
          condominio: 'Condominium'
        }
      },
      statuses: {
        em_processamento: 'Processing',
        simulacao_enviada: 'Quote sent',
        simulacao_recebida: 'Quote received',
        simulacao_aprovada_por_si: 'Approved by you — check Policies'
      },
      loading: 'Loading…',
      empty: 'No quotes to display.',
      detail: {
        simTitle: 'Quote',
        propertyTitle: 'Property',
        brand: 'Make',
        model: 'Model',
        version: 'Version',
        year: 'Year',
        insuranceType: 'Insurance type',
        holderTitle: 'Policyholder details',
        holderName: 'Name',
        email: 'Email',
        phone: 'Phone',
        nif: 'NIF',
        holderAddressTitle: 'Policyholder address',
        riskAddressTitle: 'Risk address',
        riskAddressSameAsHolder: 'Same as policyholder',
        addressStreet: 'Address',
        addressPostalCode: 'Postcode',
        addressLocality: 'City/Town',
        birth: 'Date of birth',
        licenseDate: 'Driving licence date',
        postalCode: 'Postcode',
        propertyType: 'Property type',
        situation: 'Occupancy',
        usage: 'Use',
        constructionYear: 'Year built',
        area: 'Area',
        construction: 'Construction',
        security: 'Security',
        buildingCapital: 'Building sum insured',
        contentsCapital: 'Contents sum insured',
        product: 'Product',
        extras: 'Extras',
        details: 'Notes',
        coverages: 'Cover',
        others: 'Other requests'
      },
      admin: {
        inboxPt: 'Inbox Admin',
        inboxEn: 'Admin Inbox'
      },
      pdf: {
        viewCta: 'Open quote here',
        delete: 'Remove PDF attachment',
        uploadLabel: 'Upload PDF (admin only)',
        uploading: 'Uploading PDF…',
        successUpload: 'PDF uploaded successfully.',
        errorUpload: 'Failed to upload PDF.',
        tooLarge: 'The file is larger than 1 MB. Upload is not allowed.',
        confirmDelete: 'Remove the PDF attachment from this quote?',
        successDelete: 'PDF attachment removed.',
        errorDelete: 'Failed to remove PDF attachment.'
        , emailSuccess: 'Notification email sent to the user.',
        emailError: 'PDF attached, but failed to send notification email.'
        , emailSending: 'Sending notification email…'
  , emailBody: 'Your quote is ready. Access the PDF directly here: {{pdfLink}} or view it inside the site in "My quotes": {{mysimsLink}}.'
        , emailSubject: 'Quote ready — Ansião Seguros'
      },
      errors: {
        listenFallbackNote: 'Realtime updates unavailable (listen failed). Showing a one-time snapshot.',
        loadFailed: 'Failed to load quotes ({{code}}).'
      },
      simulationFallback: 'Quote'
    },
    policies: {
      seo: { title: 'My policies', desc: 'User area to create and edit policies generated from quotes.' },
      heading: 'My policies',
            statuses: {
              em_criacao: 'Draft',
              em_validacao: 'Under Review',
              em_vigor: 'Active'
            },
            pdf: {
              viewCta: 'View Policy',
              viewPolicy: 'View Policy',
              viewReceipt: 'View Receipt',
              viewConditions: 'View Particular Conditions',
              delete: 'Remove PDF',
              uploadLabel: 'Upload policy PDF (admins only)',
              uploading: 'Uploading PDF…',
              successUpload: 'Policy PDF uploaded. Status: Active.',
              errorUpload: 'Failed to upload policy PDF.',
              tooLarge: 'File is larger than 2 MB. Cannot attach.',
              successDelete: 'Policy PDF removed.',
              errorDelete: 'Failed to remove policy PDF.'
            },
      authRequired: 'You need to sign in to view and edit your policies.',
      loading: 'Loading…',
      empty: 'No policies yet.',
      itemTitle: 'Policy {{id}}',
      itemSub: 'Created from quote {{sim}}',
      fillPrompt: 'Please fill out the policy form to proceed.',
      fillPromptType: 'Please fill out the {{type}} policy details to proceed.',
      form: {
        title: 'Policy Details',
        holderName: 'Full name',
        nif: 'Tax ID',
        citizenCardNumber: 'Citizen Card Nº',
        address: 'Full address',
        phone: 'Phone',
        email: 'Email',
        paymentFrequency: 'Payment frequency',
        nib: 'IBAN',
        saveCta: 'Save',
        createCta: 'Create',
        resendCta: 'Resend',
        requestChangeCta: 'Request Change',
        saved: 'Policy saved successfully.'
      },
      placeholders: {
        holderName: 'Full name',
        nif: '123456789',
        citizenCardNumber: '00000000 0 ZZ0',
        address: 'Street, number, postal code, city',
        phone: '912345678',
        email: 'name@server.com',
        nib: 'PT50XXXXXXXXXXXXXXXXXXXXX'
      },
      frequencies: {
        anual: 'Annual',
        semestral: 'Semiannual',
        trimestral: 'Quarterly',
        mensal: 'Monthly'
      },
      help: { nibFormat: 'Format: PT50 + 21 digits.' },
      errors: {
        invalidForm: 'Please fill all valid fields.',
        saveFailed: 'Failed to save policy.',
        loadFailed: 'Failed to load policies.',
        invalidEmail: 'Invalid email.',
        invalidPhone: 'Phone must have 9 digits.',
        invalidNif: 'Tax ID must have 9 digits.',
        invalidNib: 'Invalid IBAN (PT50 + 21 digits).',
        invalidCitizenCard: 'Invalid Citizen Card Nº. Use format 00000000 0 ZZ0.',
        nameRequired: 'Provide full name (min 3 characters).',
        addressRequired: 'Provide full address.'
      }
    },
    sim_saude: {
      title: 'Health Insurance Quote',
      stepProgress: 'Step {{step}} of 2',
      step1Title: '1. Insured persons',
      step2Title: '2. Choose an option',
      placeholders: {
        fullName: 'Full name',
        birthDate: 'Date of birth (dd-mm-yyyy)',
        nif: 'NIF (Tax ID)',
        yourName: 'Your name',
        email: 'Email',
        phone: '9 digits'
      },
      buttons: {
        addInsured: 'Add insured person',
        remove: 'Remove',
        maxReached5: 'Maximum of 5 people reached',
        prev: 'Previous',
        next: 'Next',
  submit: 'Request quote'
      },
      validations: {
        insuredNameRequired: 'Please enter the full name.',
        insuredBirthRequired: 'Please fill in the date of birth.',
        insuredNifRequired: 'Please fill in the 9‑digit NIF.',
        planRequired: 'Please choose one of the plan options.',
        nameRequired: 'Please enter your name.',
        emailRequired: 'Please fill in your email.',
        emailInvalid: 'Please enter a valid email (e.g., name@server.pt).',
        phoneRequired: 'Please fill in the phone number (9 digits).'
      },
      table: {
        coverages: 'Cover',
        option1: 'Option 1',
        option2: 'Option 2',
        option3: 'Option 3',
        included: 'Included',
        notApplicable: '—',
        optional: 'Optional',
        add: 'Add',
        discounts: 'Discounts',
        partial: 'Partial',
        telemedicine: 'Telemedicine'
      },
      benefits: {
        consultas: 'Consultations (approved network)',
        exames: 'Tests and diagnostics',
        ambulatoria: 'Out‑patient care',
        internamento: 'Hospitalisation',
        urgencias: 'Emergency care',
        parto: 'Childbirth and maternity care',
        estomatologia: 'Dental care',
        medicamentos: 'Prescription medicines',
        internacional: 'Travel assistance (international)',
        domicilio: 'Home visit / Telemedicine'
      },
      messages: {
        submitSuccess: 'Request submitted successfully! You will receive further instructions by email.',
        submitError: 'Error sending request. Please try again or contact us.'
      },
      emailSummary: { person: 'Person', name: 'Name:', birth: 'Date of birth:', nif: 'NIF:' },
      backgroundAlt: 'Health Insurance'
    },
    sim_home: {
      title: 'Home Insurance Quote',
      stepProgress: 'Step {{step}} of 3',
      step1Title: '1. Property details',
      step2Title: '2. Personal details',
      step3Title: '3. Product',
      labels: {
        situacao: 'Situation',
        tipoImovel: 'Property type',
        utilizacao: 'Use',
        anoConstrucao: 'Year of construction',
        area: 'Area (m²)',
        codigoPostal: 'Risk postcode',
        construcao: 'Construction type',
        capitalEdificio: 'Buildings sum insured (€)',
        capitalConteudo: 'Contents sum insured (€)',
        seguranca: 'Security systems',
        nomeCompleto: 'Full name',
        email: 'Email',
        telefone: 'Phone',
        nif: 'Portuguese NIF (Tax ID)',
          addressHolderTitle: 'Policyholder address',
          addressRiskTitle: 'Risk address',
          addressStreet: 'Address',
          addressPostalCode: 'Postcode',
          addressLocality: 'City/Town',
          riskAddressSameAsHolder: 'Risk address is the same as the policyholder address',
  adicionais: 'Additional cover',
        detalhesAdicionais: 'Additional details',
        capitaisSelecionados: 'Selected sums insured',
        capitalImovel: 'Buildings capital',
        capitalConteudoLabel: 'Contents capital'
      },
      options: {
        selecione: 'Select',
        situacao: { proprietario: 'Owner', inquilino: 'Tenant' },
        tipoImovel: { apartamento: 'Apartment', moradia: 'House' },
        utilizacao: { permanente: 'Primary home', secundaria: 'Secondary home', arrendamento: 'Rental' },
        construcao: { betao: 'Reinforced concrete', alvenaria: 'Masonry (brick/stone)', madeira: 'Wood' },
        seguranca: { alarme: 'Alarm', portaBlindada: 'Security door', cctv: 'CCTV' }
      },
      placeholders: {
        year: 'YYYY',
        area: 'e.g., 120',
        postal: '____-___',
        capEdificio: 'e.g., 150000',
        capConteudo: 'e.g., 25 000',
        yourName: 'Your name',
        email: 'name@server.pt',
        phone: '__ _______',
        nif: '___ ___ ___',
        addressStreet: 'Street, number, floor…',
        addressLocality: 'e.g., Ansião',
        details: 'Describe any specific needs or desired cover...'
      },
      product: {
        cards: {
          base: { title: 'Buildings', desc: 'Buildings cover with liability, fire/explosion, electrical surge and water damage.' },
          intermedio: { title: 'Buildings + Contents', desc: 'Includes contents cover with liability, fire/explosion, electrical surge and water damage.' },
          completo: { title: 'Buildings + Contents + Seismic Events', desc: 'Extended cover including seismic events, with liability and cover for buildings and contents.' }
        },
        bullets: ['Liability','Fire and explosion','Electrical surge','Water damage','Theft (contents)','Seismic events']
      },
      extras: { earthquake: 'Seismic events', garageVehicles: 'Vehicles kept in a garage' },
  buttons: { prev: 'Previous', next: 'Next', submit: 'Request quote' },
      messages: {
        step1Missing: 'Please fill in all required property fields.',
        atLeastOneCapital: 'Provide at least one capital: building or contents.',
        postalInvalid: 'Invalid postcode. Format XXXX-XXX.',
        yearInvalid: 'Invalid construction year (YYYY).',
        nameRequired: 'Enter your name.',
        emailInvalid: 'Enter a valid email.',
        phoneInvalid: 'Phone must have 9 digits.',
        nifInvalid: 'NIF must have 9 digits.',
        addressHolderRequired: 'Enter the policyholder address (address, postcode and city/town).',
        addressRiskRequired: 'Enter the risk address (address and city/town).',
        productRequired: 'Select a product.',
        rgpdRequired: 'You must accept the Privacy Policy & GDPR.',
        submitSuccess: 'Request sent successfully! You will receive instructions by email.',
        submitError: 'An error occurred while sending the request. Please try again.'
      }
    },
    sim_vida: {
      title: 'Life Insurance Quote',
      step1Title: '1. Insured persons',
      step2Title: '2. Sums insured',
      step3Title: '3. Disability type',
      insuranceType: {
        individual: 'Individual Life',
        mortgage: 'Mortgage Life'
      },
      placeholders: {
        fullName: 'Full name',
        birthDate: 'Date of birth (dd-mm-yyyy)',
        nif: 'NIF (Tax ID)',
        capital: 'Sum insured',
        prazo: 'Policy term (years)',
        yourName: 'Name',
        email: 'Email',
        phone: 'Phone'
      },
      buttons: {
        addInsured: 'Add insured person',
        remove: 'Remove',
        maxReached: 'Maximum of 2 people reached',
        prev: 'Previous',
        next: 'Next',
        simulate: 'Get quote'
      },
      validations: {
        insuredNameRequired: 'Please enter the full name.',
        insuredBirthRequired: 'Please fill in the date of birth.',
        insuredNifRequired: 'Please fill in the 9‑digit NIF.',
        capitalRequired: 'Please fill in the sum insured.',
        prazoRequired: 'Please fill in the policy term.',
        nameRequired: 'Please enter your full name.',
        emailRequired: 'Please fill in your email.',
        emailInvalid: 'Please enter a valid email (e.g., name@server.pt).',
        phoneRequired: 'Please fill in the phone number (9 digits).'
      },
      disability: {
        label: 'Disability type',
        explanationPrefix: 'Explanation:',
        options: { IAD: 'IAD', ITP: 'ITP' },
        emailLabels: {
          IAD: 'Permanent and absolute disability (IAD)',
          ITP: 'Total and permanent disability (ITP)'
        },
        explanations: {
          IAD: 'Benefit is paid when the insured becomes totally dependent on others for basic daily activities (ADL‑based).',
          ITP: 'Benefit is paid when the insured is unable to perform any gainful occupation, though can perform basic tasks.'
        }
      },
      messages: {
        submitSuccess: 'Request submitted successfully! You will receive further instructions by email.',
        submitError: 'Error sending request. Please try again or contact us.'
      },
      emailSummary: {
        person: 'Person',
        name: 'Name:',
        birth: 'Date of birth:',
        nif: 'NIF:'
      },
      backgroundAlt: 'Family protection plan — Life Insurance'
    },
    sim_auto: {
      title: 'Car Insurance Quote',
      stepProgress: 'Step {{step}} of 3',
      step1Title: 'Step 1 — Driver details',
      step2Title: 'Step 2 — Vehicle details',
      step3Title: 'Step 3 — Product and additional cover',
      placeholders: {
        name: 'Full name',
        email: 'Email',
        birthDate: 'Date of birth (dd-mm-yyyy)',
        licenseDate: 'Driving licence issue date (dd-mm-yyyy)',
        postalCode: 'Postcode (____-___)',
        nif: 'NIF (Tax ID)',
        carBrand: 'Car make',
        carModel: 'Car model',
  carVersion: 'Version/trim',
        carYear: 'Year',
  plate: 'XX-XX-XX',
        otherRequests: 'E.g.: limits, young driver, desired deductibles, notes...'
      },
      examples: {
        brand: 'Example: Ford',
        model: 'Example: Focus',
        version: 'Example: 1.0 EcoBoost Titanium',
        year: 'Example: 2018',
        plate: 'Example: 12-AB-34'
      },
      validations: {
        under18: 'Only drivers aged 18 or older can proceed.',
        nameFull: 'Please enter your full name (at least two names).',
        emailRequired: 'Please fill in your email.',
        emailInvalid: 'Enter a valid email.',
        postalFormat: 'Postcode must have 7 numeric digits (format XXXX-XXX).',
        postalHelp: 'Please enter the postcode in the format XXXX-XXX with 7 numeric digits.',
        nifInvalid: 'Invalid NIF.',
        nifRequired: 'Enter a valid 9‑digit NIF.',
        plateFormat: 'Please enter the licence plate in the format XX-XX-XX.',
        brandRequired: 'Please fill in the car make.',
        modelRequired: 'Please fill in the car model.',
        yearRequired: 'Please fill in the car year.',
        rgpdRequired: 'You must accept the Privacy Policy & GDPR to proceed.'
      },
      typeLabel: 'Insurance type:',
      typeSelectPlaceholder: 'Select the insurance type',
      typeThirdParty: 'Third party',
      typeOwnDamage: 'Comprehensive',
      typeThirdPartyInfo: 'Third party insurance: covers liability to others (people and property); does not cover damage to your own vehicle.',
      typeOwnDamageInfo: 'Comprehensive insurance: includes damage to your own vehicle, as well as third party liability.',
      baseCoverLabel: 'Core cover:',
      additionalCoverages: 'Additional cover:',
      baseCoversThirdParty: ['Third party liability', 'Legal expenses'],
      baseCoversOwnDamage: ['Accidental damage', 'Theft', 'Fire'],
      coverageLabels: {
        occupants: 'Personal accident (occupants)',
        glass: 'Windscreen cover',
        assistance: 'Roadside assistance',
        fire: 'Fire',
        theft: 'Theft',
        naturalCatastrophes: 'Natural events',
        vandalism: 'Vandalism',
        replacementVehicle: 'Courtesy car'
      },
      buttons: { prev: 'Previous', next: 'Next', simulate: 'Get quote' },
      messages: {
        selectType: 'Please select the insurance type.',
        submitSuccess: 'Quote submitted successfully!\nEmail sent.',
        submitEmailError: 'Quote submitted, but there was an error sending the email.'
      },
      summary: {
        title: 'Quote',
        labels: {
          vehicle: 'Vehicle:',
          nif: 'NIF:',
          birthDate: 'Date of Birth:',
          licenseDate: 'Driving licence issue date:',
          postalCode: 'Postcode:',
          version: 'Version:',
          type: 'Type:',
          coverages: 'Cover:',
          otherRequests: 'Other requests:'
        }
      }
    },
    contact: {
      seoTitle: 'Contact',
      seoDesc: 'Get in touch for information requests, ad‑hoc quotes or tailored proposals.',
      pageTitle: 'Get in touch',
  pageSubtitle: 'Send us an information request or an ad‑hoc quote. We’ll reply shortly.',
      phoneHeadline: 'Call our team',
      phoneDesc: 'Direct line for support and clarifications.',
      phoneNumberLabel: 'Phone:',
      callNowCta: 'Call now',
      placeholders: {
        name: 'Full name',
        email: 'Email',
        phoneOptional: 'Phone (optional)',
        subjectOptional: 'Subject (optional)',
        message: 'Describe your request or question…',
        productInterestOptional: 'Product of interest (optional)'
      },
      requestType: {
        label: 'Request type',
        info: 'Information request',
        adhoc: 'Ad‑hoc quote request',
        contact: 'Callback request',
        change: 'Change request',
        other: 'Other'
      },
      productInterest: {
        label: 'Product of interest',
        auto: 'Auto',
        life: 'Life',
        health: 'Health',
        home: 'Home',
        fleet: 'Fleet',
        work: 'Workers’ Compensation',
        mreb: 'Business Multi‑risk',
        rcp: 'Professional Liability',
        other: 'Other'
      },
      labels: {
        contactDataTitle: 'Contact details',
        requestTitle: 'Request',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        requestType: 'Request type',
        productInterest: 'Product of interest',
        subject: 'Subject',
        message: 'Message',
      },
      messages: {
        success: 'Thank you! We’ve received your request and will get back to you shortly.',
        error: 'An error occurred while sending. Please try again.',
        sending: 'Sending…',
        submit: 'Send request'
      },
      map: {
        whereTitle: 'Where we are',
        whereDesc: 'Ansião town, Leiria district.',
        iframeTitle: 'Map of Ansião, Leiria',
        openInMaps: 'Open in Google Maps'
      },
      rgpdText: 'I have read and accept the <0>Privacy Policy & GDPR</0>.',
      validation: {
        nameRequired: 'Please enter your name.',
        emailInvalid: 'Enter a valid email.',
        messageRequired: 'Describe your request.',
        rgpdRequired: 'You must accept the Privacy Policy & GDPR.'
      },
      email: {
        subjectPrefix: 'Contact: ',
        typePrefix: 'General contact',
        typeWithProduct: 'Contact / {{product}}'
      }
    },
    product_fleet: {
      seoTitle: 'Business Fleet Insurance',
      seoDesc: 'Efficient management and comprehensive protection for your company vehicles. Request a tailored proposal.',
      headerTitle: 'Business Fleet Insurance',
      headerSubtitle: 'Efficient management and complete protection for all your company vehicles',
      badge: 'Fidelidade Product',
      ctaRequest: 'Request proposal',
  ctaContact: 'Talk to an adviser',
      whyTitle: 'Why choose Fleet Insurance?',
      whyItems: [
        'Centralised management of all company vehicles',
        'Protection against own damage, third‑party liability and accidents',
        '24/7 assistance across the country',
        'Flexible coverage options and sums insured'
      ],
      coveragesTitle: 'Available coverages',
      coverages: [
        { title: 'Accidental damage', desc: 'Covers damage to fleet vehicles caused by accident, collision, fire, theft or robbery.' },
        { title: 'Third party liability', desc: 'Protection against damage caused to third parties (people and property).' },
        { title: 'Roadside assistance', desc: 'Towing, transport, accommodation and support in case of breakdown or accident.' },
        { title: 'Legal expenses', desc: 'Legal expenses cover in dispute situations related to company vehicles.' }
      ],
      advantagesTitle: 'Exclusive advantages',
      advantages: [
        'Digital management of policy and claims',
        'Specialised support for businesses',
        'Plans tailored to your company profile',
        'Coverage for drivers and employees'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Request a tailored proposal for your company.',
        'Choose the cover and sums insured that best suit your fleet.',
        'Send the required documents and complete the purchase with support from an adviser.'
      ],
      formTitle: 'Request Proposal — Fleet',
      stepProgress: 'Step {{step}} of 3',
      step1Title: 'Step 1 — Responsible person details',
      step2Title: 'Step 2 — Vehicle details',
      step3Title: 'Step 3 — Product and additional cover',
      placeholders: {
        name: 'Full name',
        email: 'Email',
        nif: 'NIF (Tax ID)',
        postalCode: 'Postcode (____-___)',
        birthDate: 'Date of birth (dd-mm-yyyy)',
  licenseDate: 'Driving licence issue date (dd-mm-yyyy)',
        carBrand: 'Make',
        carModel: 'Model',
        carYear: 'Year',
        plate: 'XX-XX-XX',
        otherRequests: 'E.g.: per‑vehicle limits, named drivers, desired deductibles, notes...'
      },
      vehicles: { titlePrefix: 'Vehicle #', add: '+ Add vehicle', remove: 'Remove' },
      typeLabel: 'Insurance type:',
      typeSelectPlaceholder: 'Select the insurance type',
  typeThirdParty: 'Third party',
  typeOwnDamage: 'Comprehensive',
  typeThirdPartyInfo: 'Third party insurance: covers liability to others (people and property).',
  typeOwnDamageInfo: 'Comprehensive insurance: includes damage to your vehicles, as well as third party liability.',
  additionalCoverages: 'Additional cover:',
      coverageLabels: {
        occupants: 'Personal accident (occupants)',
        glass: 'Windscreen cover',
        assistance: 'Roadside assistance',
        fire: 'Fire',
        theft: 'Theft',
        naturalCatastrophes: 'Natural events',
        vandalism: 'Vandalism',
        replacementVehicle: 'Courtesy car'
      },
      otherRequestsLabel: 'Other requests / details',
  buttons: { prev: 'Previous', next: 'Next', submit: 'Request quote' },
      rgpdText: 'I have read and accept the <0>Privacy Policy & GDPR</0>.',
      messages: {
        selectType: 'Please select the insurance type.',
        submitSuccess: 'Request sent successfully!',
        submitEmailError: 'Request submitted, but there was an error sending the email.',
        under18: 'Only drivers aged 18 or older can proceed.'
      },
      summary: {
        title: 'Fleet Proposal',
        labels: {
          nif: 'NIF (Company):',
          birthDate: 'Date of Birth:',
          licenseDate: 'Driving Licence Date:',
          postalCode: 'Postcode:',
          vehicles: 'Vehicles:',
          type: 'Type:',
          coverages: 'Coverages:',
          otherRequests: 'Other requests:'
        }
      }
    },
    product_health: {
      seoTitle: 'Health Insurance',
      seoDesc: 'Health plans with a wide network and 24/7 assistance.',
      headerTitle: 'Health Insurance',
      headerSubtitle: 'Take care of your well-being with flexible plans and broad coverage',
      ctaSimulate: 'Get Health Quote',
  ctaContact: 'Talk to an adviser',
      whyTitle: 'Why choose Health Insurance?',
      whyItems: [
        'Access to a wide network of hospitals and clinics',
        'Discounts on medication and exams',
        'Specialist appointments without hassle',
        'Hospitalisation and surgeries covered'
      ],
      coveragesTitle: 'Available coverages',
      coverages: [
        { title: 'Appointments and Exams', desc: 'Coverage for medical appointments, lab tests and imaging.' },
        { title: 'Hospitalisation', desc: 'Coverage for hospital stay expenses and surgeries.' },
        { title: 'Medication', desc: 'Discounts and partial cover for prescribed medicines.' },
        { title: 'Clinics and Hospitals Network', desc: 'Easy access to an accredited health network.' }
      ],
      benefitsTitle: 'Exclusive advantages',
      benefits: [
        'Digital policy and reimbursements management',
        '24/7 emergency support',
        'Flexible plans for different profiles',
        'Family coverage options'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Get your health insurance quote online or talk to an advisor.',
        'Choose the plan and cover that best fit your profile.',
        'Send the required documents and complete the purchase.'
      ]
    },
    product_home: {
      seoTitle: 'Home Insurance (Buildings & Contents)',
      seoDesc: 'Protect your home against unforeseen events with flexible cover.',
      headerTitle: 'Home Insurance (Buildings & Contents)',
      headerSubtitle: 'Protect your home against unforeseen events and ensure peace of mind for your family',
      ctaSimulate: 'Get home insurance quote',
      ctaContact: 'Talk to an adviser',
      whyTitle: 'Why choose Home Insurance?',
      whyItems: [
        'Protection against fire, flood, theft and other risks',
        '24/7 assistance for household emergencies',
        'Third‑party liability coverage',
        'Flexible deductibles and sums insured'
      ],
      coveragesTitle: 'Available coverages',
      coverages: [
        { title: 'Fire, flood and natural events', desc: 'Protection against damage caused by fire, water and natural events.' },
        { title: 'Theft and burglary', desc: 'Cover for goods stolen or taken from the residence.' },
        { title: 'Liability', desc: 'Protection against damage caused to third parties.' },
        { title: '24/7 assistance', desc: 'Emergency services such as locksmith, electrician and plumber.' }
      ],
      benefitsTitle: 'Exclusive advantages',
      benefits: [
        'Digital policy and claims management',
        '24/7 emergency support',
        'Flexible plans for different profiles',
        'Family coverage options'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Get your home insurance quote online or talk to an adviser.',
        'Choose the plan and cover that best fit your profile.',
        'Send the required documents and complete the purchase.'
      ]
    },
    landing_kristina: {
      kristina: {
        seoTitle: 'Storm Kristin — Home Insurance',
        seoDesc: 'Fast support, guidance and a home insurance quote to strengthen protection for your home.',
        heroAlt: 'Home insurance — home protection',
        heroTitle: 'Storm Kristin: protect your home',
        heroSubtitle: 'If you had damage or want better protection, we help you find cover that fits your risk.',
        ctaQuote: 'Get a home insurance quote',
        ctaContact: 'Contact us',
        emergencyNote: 'In an emergency, call 112. For insurance support, contact us.',
        section1Title: 'How we can help',
        section1Items: [
          { icon: '🧾', title: 'Claims guidance', desc: 'Help with what to gather and next steps.' },
          { icon: '🔎', title: 'Cover review', desc: 'We help align cover (e.g., natural events, water damage) to your case.' },
          { icon: '⚡', title: 'Quick response', desc: 'We route your request to the right team with minimal friction.' },
          { icon: '🛠️', title: 'Home assistance', desc: 'Emergency home services, subject to policy terms.' }
        ],
        section2Title: 'Typical cover needs',
        section2Items: [
          { title: 'Natural events', desc: 'Damage linked to strong wind, heavy rain and other events, subject to policy terms.' },
          { title: 'Water damage', desc: 'Damage from leaks/bursts/infiltrations, subject to the selected cover.' },
          { title: 'Glass breakage', desc: 'Accidental glass breakage and related elements, subject to policy terms.' },
          { title: '24/7 assistance', desc: 'Emergency services (e.g., plumber/electrician), subject to policy terms.' }
        ],
        coverageDisclaimer: 'Cover, exclusions and sums insured depend on the insurer and your specific policy schedule/terms.',
        section3Title: 'Next steps',
        section3Steps: [
          'Take photos/videos of the damage and prioritise safety.',
          'Contact us with the risk address and a short summary of what happened.',
          'If you already have insurance, we help identify cover and prepare the claim notice.',
          'If you want stronger protection, run a quote and we will propose options.'
        ],
        ctaGuide: 'Post-storm quick guide',
        ctaQuoteSecondary: 'Get a quote'
      },
      guia: {
        seoTitle: 'Post-storm guide — Storm Kristin',
        seoDesc: 'Quick checklist to act after damage and prepare your insurer contact.',
        title: 'Post-storm quick guide',
        subtitle: 'Checklist to organise information and ask for support after Storm Kristin.',
        ctaContact: 'Get support',
        ctaQuote: 'Get a quote',
        stepsTitle: 'Checklist',
        steps: [
          { title: 'Safety first', desc: 'If there is immediate danger, move away and call emergency services.' },
          { title: 'Record the damage', desc: 'Take photos/videos and note an approximate date/time and what was affected.' },
          { title: 'Prevent further loss', desc: 'If safe, protect exposed areas and keep receipts for emergency mitigation.' },
          { title: 'Gather details', desc: 'Have your ID, risk address and (if available) policy/insurer information ready.' },
          { title: 'Contact us', desc: 'We guide you through claim notice or a new quote.' }
        ],
        disclaimer: 'General information only. It does not replace your policy terms or official guidance.',
        whatWeNeedTitle: 'To help faster, send:',
        whatWeNeedItems: [
          'Name and contact',
          'Risk address',
          'Damage summary and approximate date',
          'Photos/videos and (if available) policy/insurer details'
        ],
        ctaBack: 'Back to landing',
        ctaContactSecondary: 'Contact us'
      }
    },
    product_mreb: {
      seoTitle: 'Commercial Multi‑risk Insurance',
      seoDesc: 'Protect your company’s buildings, equipment and goods with flexible cover.',
      headerTitle: 'Commercial Multi‑risk Insurance',
      headerSubtitle: 'Protect your company assets against unforeseen events and ensure business continuity',
      ctaContact: 'Talk to an adviser',
      whatTitle: 'What is Business Multi‑risk Insurance?',
      whatDesc: 'Business Multi‑risk Insurance is designed to protect buildings, equipment, goods and other assets essential to your company’s operations, providing support in the event of a claim and minimising losses.',
      whoTitle: 'Who is it for?',
      whoItems: [
        'Companies of any size and sector',
        'Retail, manufacturing and services',
        'Owners of commercial buildings'
      ],
      coveragesTitle: 'Main coverages',
      coverages: [
        { title: 'Fire, flood and natural events', desc: 'Protection against damage caused by fire, water, storms and other natural events.' },
        { title: 'Theft and burglary', desc: 'Cover for goods and merchandise in case of theft or burglary at the premises.' },
        { title: 'Liability', desc: 'Protection against damage caused to third parties in the course of business activities.' },
        { title: '24/7 assistance', desc: 'Emergency services such as locksmith, electrician and plumber for unforeseen situations.' }
      ],
  advantagesTitle: 'Insurance advantages',
      advantages: [
        'Peace of mind to run your business',
        'Fast assistance in emergencies',
        'Flexible plans tailored to your company',
        'Coverage for buildings, equipment and merchandise'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Request a tailored proposal for your company.',
        'Choose the cover and sums insured that best suit your business.',
        'Complete the purchase with support from a specialist adviser.'
      ]
    },
    product_rcp: {
      seoTitle: 'Professional Indemnity Insurance',
      seoDesc: 'Financial protection against claims for errors and omissions in professional practice. Get a quote now.',
      headerTitle: 'Professional Indemnity Insurance',
      headerSubtitle: 'Protect your professional activity against claims and unforeseen events.',
      ctaSimulate: 'Get professional indemnity quote',
      ctaContact: 'Talk to an adviser',
      whatTitle: 'What is this insurance?',
      whatDesc: 'Professional indemnity insurance protects professionals and companies against financial losses caused to third parties as a result of errors, omissions or negligence in the course of their activity.',
      whoTitle: 'Who is it for?',
      whoItems: [
        'Liberal professionals (lawyers, engineers, architects, doctors, etc.)',
        'Consulting and service companies',
        'Other professionals exposed to liability in their activity'
      ],
      coveragesTitle: 'Main coverages',
      coverages: [
        { title: 'Errors and omissions', desc: 'Protection in case of damage caused to third parties due to professional failures.' },
        { title: 'Defence costs', desc: 'Includes legal costs and solicitors’ fees in court proceedings.' },
        { title: 'Indemnities', desc: 'Cover for indemnities owed to third parties for material or financial loss.' },
        { title: 'Reputation protection', desc: 'Support in situations that may affect professional reputation.' }
      ],
      advantagesTitle: 'Insurance advantages',
      advantages: [
        'Peace of mind to practice your profession',
        'Financial protection in case of claims',
        'Simple and fast purchase process',
        'Adaptable to different professional areas'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Request a tailored proposal for your activity.',
        'Review the cover and choose the options that best suit your profile.',
        'Complete the purchase with support from a specialist adviser.'
      ]
    },
    product_condo: {
      seoTitle: 'Condominium Insurance',
      seoDesc: 'Comprehensive protection for buildings and shared areas in your condominium. Learn more.',
      headerTitle: 'Condominium Insurance',
      headerSubtitle: 'Complete protection for your building and common areas',
      ctaSimulate: 'Get condo quote',
  ctaContact: 'Talk to an adviser',
      whatTitle: 'What is Condominium Insurance?',
      whatDesc: 'Condominium Insurance is designed to protect the building and its common parts, covering damage from fire, natural events, flooding, liability and other situations that can affect residents’ peace of mind.',
      whoTitle: 'Who is it for?',
      whoItems: [
        'Residential and mixed‑use condominiums',
        'Buildings with garages, storage and shared spaces',
        'Condo management companies and owners’ committees'
      ],
      coveragesTitle: 'Main coverages',
      coverages: [
        { title: 'Fire, flood and natural events', desc: 'Protection against damage caused by fire, water, storms and other natural events.' },
        { title: 'Condominium liability', desc: 'Cover for damage caused to third parties in the building’s common areas.' },
        { title: 'Water damage and glass breakage', desc: 'Protection for frequent incidents affecting common areas and facades.' },
        { title: '24/7 assistance', desc: 'Immediate support from specialised technicians for emergencies.' }
      ],
      advantagesTitle: 'Insurance advantages',
      advantages: [
        'Comprehensive protection of common parts of the building',
        'Safety for residents and visitors',
        'Adjustable liability coverages',
        '24‑hour technical assistance'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Request a proposal for your condominium.',
        'Choose the cover and sums insured according to the building’s needs.',
        'Complete with the support of a specialist adviser.'
      ]
    },
    product_work: {
      seoTitle: 'Occupational Accidents Insurance (Companies)',
      seoDesc: 'Mandatory protection and comprehensive assistance for employees. Request your proposal.',
      headerTitle: 'Occupational Accidents Insurance (Companies)',
      headerSubtitle: 'Protect your employees with mandatory coverage and comprehensive assistance',
      ctaRequest: 'Request proposal',
      ctaContact: 'Talk to an adviser',
      whyTitle: 'Why choose Occupational Accidents insurance?',
      whyItems: [
        'Complies with mandatory legislation for companies',
        'Protection for employees in case of accidents at work',
        'Medical, hospital and pharmaceutical assistance',
        'Digital policy and claims management'
      ],
      coveragesTitle: 'Available coverages',
      coverages: [
        { title: 'Medical and hospital expenses', desc: 'Cover for treatments, appointments, hospitalisation and medication after a workplace accident.' },
        { title: 'Disability compensation', desc: 'Indemnity in case of temporary or permanent disability of the employee.' },
        { title: 'Pharmaceutical assistance', desc: 'Cover for expenses with prescribed medicines after an accident.' },
        { title: 'Claims management', desc: 'Support in managing and following up claims processes.' }
      ],
      advantagesTitle: 'Exclusive advantages',
      advantages: [
        'Digital policy and claims management',
        'Specialised support for companies',
        'Plans adjustable to your company profile',
        'Coverage for all employees'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Request a tailored proposal for your company.',
        'Choose the cover and sums insured that best suit your business.',
        'Complete the purchase with the support of a specialist adviser.'
      ],
      formTitle: 'Request Proposal — Workers’ Compensation'
    },
    products: {
      title: 'Insurance Products — Individuals and Businesses',
      description: 'Explore our solutions: Auto, Life, Health, Home, Fleet, Workers’ Comp, Business Multi-risk and Professional Liability.',
      heading: 'Our products',
      subheading: 'Solutions for individuals and businesses.',
      individuals: 'Individuals',
      business: 'Businesses',
      individualsCards: {
        auto: { name: 'Car Insurance', desc: 'Comprehensive protection for your vehicle.', to: 'produto-auto' },
        life: { name: 'Life Insurance', desc: 'Security for you and your family.', to: 'produto-vida' },
        health: { name: 'Health Insurance', desc: 'Take care of your well-being with flexible plans.', to: 'produto-saude' },
        home: { name: 'Home Insurance (Buildings & Contents)', desc: 'Protect your home against unforeseen events.', to: 'produto-habitacao' },
      },
      businessCards: {
        fleet: { name: 'Fleet Insurance', desc: 'Protection for all company vehicles.', to: 'produto-frota' },
        work: { name: 'Occupational Accidents', desc: 'Cover for employees in case of accidents.', to: 'produto-acidentes-trabalho' },
        rcp: { name: 'Professional Indemnity', desc: 'Protect your activity against third‑party damage.', to: 'produto-responsabilidade-civil-profissional' },
        mreb: { name: 'Commercial Multi‑risk', desc: 'Cover for facilities and business assets.', to: 'produto-multirriscos-empresarial' },
        condo: { name: 'Condominium Insurance', desc: 'Complete protection for buildings and common areas.', to: 'produto-condominio' },
      },
    },
    product_auto: {
      seoTitle: 'Car Insurance',
      seoDesc: 'Protect your vehicle with comprehensive cover and 24/7 assistance. Get a quote and talk to an advisor.',
      headerTitle: 'Car Insurance',
      headerSubtitle: 'Protect your vehicle with the best coverages on the market',
      ctaSimulate: 'Get Auto Quote',
  ctaContact: 'Talk to an adviser',
      whyTitle: 'Why choose Car Insurance?',
      whyItems: [
        'Comprehensive protection against own damage and third‑party liability',
        '24/7 roadside assistance in Portugal and abroad',
        'Flexible coverage and deductible options',
        'Simple and fast claims process',
        'Discounts for experienced drivers and families'
      ],
      coveragesTitle: 'Available coverages',
      coverages: [
        { title: 'Mandatory third party liability', desc: 'Covers damage caused to third parties (people and property).'},
        { title: 'Accidental damage (Comprehensive)', desc: 'Includes damage to your vehicle in case of accident, impact, collision, rollover, fire, theft or robbery.' },
        { title: 'Legal expenses', desc: 'Legal expenses cover in case of disputes related to the vehicle.' },
        { title: 'Roadside assistance', desc: 'Towing, transport, accommodation and other services in case of breakdown or accident.' }
      ],
      benefitsTitle: 'Exclusive advantages',
      benefits: [
        'Digital policy and claims management',
        'Network of recommended repair shops',
        'Discounts for electric and hybrid vehicles',
        'Adjustable deductibles to suit your needs'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Get your auto quote online or talk to an adviser.',
        'Choose the cover and deductibles that best fit your profile.',
        'Send the required documents and complete the purchase.'
      ]
    },
    product_life: {
      seoTitle: 'Life Insurance',
      seoDesc: 'Financial protection and peace of mind for you and your family.',
      headerTitle: 'Life Insurance',
      headerSubtitle: 'Financial protection and peace of mind for you and your family',
      ctaSimulate: 'Get Life Quote',
  ctaContact: 'Talk to an adviser',
      typesTitle: 'Types of Life Insurance',
      types: [
        { title: 'Term Life', desc: 'Protection in case of death or disability, ensuring financial security for beneficiaries.' },
        { title: 'Savings Life', desc: 'Capital accumulation and protection—ideal for saving and securing your family’s future.' },
        { title: 'Mixed Life', desc: 'Combines protection and savings, offering coverage for death, disability and survival.' }
      ],
      coveragesTitle: 'Coverages and Benefits',
      coverages: [
        { title: 'Death or Disability', desc: 'Financial protection for the family in case of the insured’s death or disability.' },
        { title: 'Critical Illness', desc: 'Coverage for diagnosis of critical illnesses, ensuring financial support.' },
        { title: 'Survival', desc: 'Payment of capital at the end of the policy term if the insured is alive.' },
        { title: 'Savings and Investment', desc: 'Capital accumulation for future projects, education or retirement.' }
      ],
      advantagesTitle: 'Life Insurance Advantages',
      advantages: [
        'Protection for the whole family',
        'Flexible cover and sums insured',
        'Savings and investment option',
        'Coverage for critical illnesses'
      ],
      howTitle: 'How to get it?',
      howSteps: [
        'Get your life insurance quote online or talk to an advisor.',
        'Choose the type and cover that best fit your profile.',
        'Send the required documents and complete the purchase.'
      ]
    },
    home: {
      heroTitle: 'Insurance in Ansião (Leiria) — Auto, Life, Health and Home',
      heroDesc: 'Ansião Seguros: fast quotes and tailored proposals for Auto, Life, Health, Home and business solutions.',
      featuredIndividuals: 'Products for individuals',
      heroSlides: [
        {
          title: 'Get your car insurance quote in seconds',
          text: 'Comprehensive protection for your vehicle with personalised service.',
          cta: 'Get car insurance quote'
        },
        {
          title: 'Life and Health Insurance',
          text: 'Security for you and your family, with flexible plans.',
          cta: 'Get life insurance quote'
        },
        {
          title: 'Home Insurance (Buildings & Contents)',
          text: 'Protect your home against unforeseen events and ensure peace of mind.',
          cta: 'Get home insurance quote'
        }
      ],
      productsIndividuals: {
        auto: { name: 'Car Insurance', desc: 'Comprehensive protection for your vehicle.' },
        life: { name: 'Life Insurance', desc: 'Security for you and your family.' },
        health: { name: 'Health Insurance', desc: 'Take care of your well-being.' },
        home: { name: 'Home Multi-risk', desc: 'Protect your home against unforeseen events.' }
      },
      featuredBusiness: 'Products for businesses',
      productsBusiness: {
        fleet: { name: 'Fleet Insurance', desc: 'Protection for all company vehicles.' },
        work: { name: 'Workers’ Compensation', desc: 'Coverage for employees in case of accidents.' },
        rcp: { name: 'Professional Liability', desc: 'Protect your company against third-party damage.' },
        mreb: { name: 'Business Multi-risk', desc: 'Coverage for your facilities and business assets.' },
        condo: { name: 'Condominium Insurance', desc: 'Complete protection for buildings and common areas.' }
      },
      benefitsTitle: 'Why choose Ansião Seguros?',
      benefits: [
        'Personalized service and expert consulting',
        'Fast, automated quotes powered by our intelligent systems.',
        'Solutions for businesses and families',
        'Wide range of products: auto, life, health, home and more'
      ],
      ctaMore: 'Learn more',
      ctaOpen: 'Open'
    }
  }
};

const baseUrl = (import.meta as any)?.env?.BASE_URL || '/';
const pathIndex = baseUrl === '/' ? 0 : 1;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en'],
  ns: ['common', 'home', 'products', 'product_auto', 'product_life', 'product_health', 'product_home', 'product_mreb', 'product_rcp', 'product_condo', 'product_work', 'product_fleet', 'contact', 'sim_auto', 'sim_vida', 'sim_saude', 'sim_home', 'mysims'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupFromPathIndex: pathIndex,
    },
  });

export default i18n;
