document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // DOM Elements
    const providerForm = document.getElementById('provider-form');
    const providerCnpj = document.getElementById('provider-cnpj');
    const providerName = document.getElementById('provider-name');
    const providerIm = document.getElementById('provider-im');
    const providerRegime = document.getElementById('provider-regime');
    const providerServiceCode = document.getElementById('provider-service-code');
    const providerUf = document.getElementById('provider-uf');
    const providerCity = document.getElementById('provider-city');
    const providerSearchInput = document.getElementById('provider-search-input');
    const providerSelectDropdown = document.getElementById('provider-select-dropdown');
    const btnClearProviderSelect = document.getElementById('btn-clear-provider-select');
    const btnDeleteProvider = document.getElementById('btn-delete-provider');

    const downloadTemplateBtn = document.getElementById('download-template-btn');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    const statTotalNotes = document.getElementById('stat-total-notes');
    const statTotalValue = document.getElementById('stat-total-value');
    const statTotalIss = document.getElementById('stat-total-iss');
    const statStatus = document.getElementById('stat-status');

    const errorsPanel = document.getElementById('errors-panel');
    const errorCountSpan = document.getElementById('error-count');
    const errorList = document.getElementById('error-list');

    const tableRowCount = document.getElementById('table-row-count');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const generateTxtBtn = document.getElementById('generate-txt-btn');
    const tableBody = document.getElementById('table-body');
    const toast = document.getElementById('toast');

    // State Variables
    let importedRows = [];
    let validationErrors = [];
    let providersList = [];
    let activeProviderCnpj = '';

    // Render option list inside custom select dropdown
    const renderDropdown = (filterText = '') => {
        providerSelectDropdown.innerHTML = '';
        const search = filterText.toLowerCase().trim();
        
        const filtered = providersList.filter(p => 
            p.cnpj.replace(/\D/g, '').includes(search.replace(/\D/g, '')) || 
            p.name.toLowerCase().includes(search)
        );

        if (filtered.length === 0) {
            const div = document.createElement('div');
            div.className = 'custom-select-option empty-option';
            div.textContent = 'Nenhuma empresa encontrada';
            providerSelectDropdown.appendChild(div);
            return;
        }

        filtered.forEach(prov => {
            const div = document.createElement('div');
            div.className = `custom-select-option ${prov.cnpj === activeProviderCnpj ? 'active-item' : ''}`;
            div.textContent = `${prov.cnpj} - ${prov.name}`;
            div.addEventListener('click', () => {
                selectProvider(prov.cnpj);
                providerSelectDropdown.classList.remove('open');
            });
            providerSelectDropdown.appendChild(div);
        });
    };

    // Select a provider by CNPJ
    const selectProvider = (cnpj) => {
        const prov = providersList.find(p => p.cnpj === cnpj);
        if (prov) {
            activeProviderCnpj = cnpj;
            localStorage.setItem('nfts_active_provider_cnpj', cnpj);

            providerCnpj.value = prov.cnpj || '';
            providerName.value = prov.name || '';
            providerIm.value = prov.im || '';
            providerRegime.value = prov.regime || 'simples';
            
            // Update segmented buttons
            document.querySelectorAll('#provider-regime-group .regime-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-regime') === providerRegime.value);
            });

            providerServiceCode.value = prov.serviceCode || '';
            providerUf.value = prov.uf || '';
            providerCity.value = prov.city || '';

            // Set input value to display selected company (only name to fit perfectly)
            providerSearchInput.value = prov.name;
            providerSearchInput.title = prov.name;
            
            // Show clear and delete buttons inside input trigger
            btnClearProviderSelect.style.display = 'inline-flex';
            btnDeleteProvider.style.display = 'inline-flex';
        }
    };

    // Clear provider form and reset selection
    const clearProviderForm = () => {
        activeProviderCnpj = '';
        localStorage.removeItem('nfts_active_provider_cnpj');
        providerForm.reset();
        
        // Reset regime buttons
        document.querySelectorAll('#provider-regime-group .regime-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-regime') === 'simples');
        });
        providerRegime.value = 'simples';

        providerSearchInput.value = '';
        providerSearchInput.title = '';
        btnClearProviderSelect.style.display = 'none';
        btnDeleteProvider.style.display = 'none';
        renderDropdown();
    };

    // Fetch & database integrations using Vercel API
    const loadProvidersList = async () => {
        const activeCnpj = localStorage.getItem('nfts_active_provider_cnpj');
        providersList = [];

        try {
            const res = await fetch('/api/providers');
            if (res.ok) {
                providersList = await res.json();
            }
        } catch (err) {
            console.error("Erro ao carregar do banco de dados do Vercel", err);
        }

        renderDropdown();

        if (activeCnpj && providersList.some(p => p.cnpj === activeCnpj)) {
            selectProvider(activeCnpj);
        } else {
            clearProviderForm();
        }
    };

    // Custom select trigger events
    providerSearchInput.addEventListener('focus', () => {
        providerSelectDropdown.classList.add('open');
        renderDropdown(providerSearchInput.value);
    });

    providerSearchInput.addEventListener('input', (e) => {
        providerSelectDropdown.classList.add('open');
        renderDropdown(e.target.value);
    });

    // Close select dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!document.querySelector('.custom-select-container').contains(e.target)) {
            providerSelectDropdown.classList.remove('open');
        }
    });

    // Clear and Delete button events inside select trigger
    btnClearProviderSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        clearProviderForm();
    });

    btnDeleteProvider.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!activeProviderCnpj) return;

        if (confirm('Deseja realmente excluir este prestador do banco de dados?')) {
            try {
                const res = await fetch(`/api/providers?cnpj=${encodeURIComponent(activeProviderCnpj)}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    clearProviderForm();
                    await loadProvidersList();
                    showToast('Prestador excluído com sucesso!');
                } else {
                    showToast('Erro ao excluir do banco de dados.', true);
                }
            } catch (err) {
                console.error(err);
                showToast('Erro de rede ao excluir.', true);
            }
        }
    });

    // Regime Segmented control click event
    document.querySelectorAll('#provider-regime-group .regime-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#provider-regime-group .regime-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            providerRegime.value = btn.getAttribute('data-regime');
        });
    });

    // Initialize list load
    loadProvidersList();

    // Masks and formatting helper functions
    const formatCNPJ = (value) => {
        value = value.replace(/\D/g, "");
        if (value.length <= 11) {
            // CPF Format: 000.000.000-00
            return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4");
        } else {
            // CNPJ Format: 00.000.000/0000-00
            return value.substring(0, 14).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        }
    };

    providerCnpj.addEventListener('input', (e) => {
        e.target.value = formatCNPJ(e.target.value);
    });

    providerUf.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().substring(0, 2);
    });

    // Save Provider Data
    providerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cnpj = providerCnpj.value;
        const data = {
            cnpj: cnpj,
            name: providerName.value,
            im: providerIm.value,
            regime: providerRegime.value,
            serviceCode: providerServiceCode.value,
            uf: providerUf.value,
            city: providerCity.value
        };

        try {
            const res = await fetch('/api/providers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                localStorage.setItem('nfts_active_provider_cnpj', cnpj);
                await loadProvidersList();
                showToast('Prestador salvo no banco de dados com sucesso!');
            } else {
                showToast('Erro ao salvar no banco de dados.', true);
            }
        } catch (err) {
            console.error(err);
            showToast('Erro de conexão ao salvar.', true);
        }
    });

    // Show Toast Notification
    const showToast = (message, isError = false) => {
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMsg = toast.querySelector('.toast-message');

        toastMsg.textContent = message;
        if (isError) {
            toast.style.borderLeft = "4px solid var(--danger)";
            toastIcon.setAttribute('data-lucide', 'x-circle');
            toastIcon.style.color = "var(--danger)";
        } else {
            toast.style.borderLeft = "4px solid var(--success)";
            toastIcon.setAttribute('data-lucide', 'check-circle');
            toastIcon.style.color = "var(--success)";
        }
        
        lucide.createIcons();
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    };

    // Download Excel Template
    downloadTemplateBtn.addEventListener('click', () => {
        // Headers and sample records
        const headers = [
            'CNPJ_CPF_TOMADOR', 
            'NOME_RAZAO_TOMADOR', 
            'DATA_EMISSAO_DD_MM_AAAA',
            'VALOR_SERVICO',
            'ALIQUOTA_PERCENTUAL',
            'ISS_RETIDO_SIM_NAO',
            'DISCRIMINACAO_SERVICO'
        ];

        const sampleRows = [
            [
                '12.345.678/0001-90', 
                'Tomadora Exemplo S.A.', 
                '22/06/2026', 
                1500.00, 
                2.0, 
                'Sim', 
                'Serviços prestados de suporte técnico em TI conforme contrato.'
            ],
            [
                '987.654.321-00', 
                'Maria da Silva Oliveira', 
                '15/06/2026', 
                450.50, 
                5.0, 
                'Não', 
                'Conserto de aparelhos eletrodomésticos diversos.'
            ]
        ];

        const wb = XLSX.utils.book_new();
        const ws_data = [headers, ...sampleRows];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Styling widths roughly
        const wscols = [
            {wch: 22}, // CNPJ_CPF_TOMADOR
            {wch: 28}, // NOME_RAZAO_TOMADOR
            {wch: 24}, // DATA_EMISSAO_DD_MM_AAAA
            {wch: 16}, // VALOR_SERVICO
            {wch: 20}, // ALIQUOTA_PERCENTUAL
            {wch: 20}, // ISS_RETIDO_SIM_NAO
            {wch: 40}  // DISCRIMINACAO_SERVICO
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, 'Dados NFTS Lote');
        
        // Save using sheetjs writing mechanism
        XLSX.writeFile(wb, 'modelo_lote_nfts.xlsx');
        showToast('Modelo de planilha baixado com sucesso!');
    });

    // Dropzone Events
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Parse and handle uploaded file
    const handleFileUpload = (file) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Parse rows including empty strings, convert to JSON objects
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    defval: ''
                });

                if (jsonData.length === 0) {
                    showToast('O arquivo enviado está vazio.', true);
                    return;
                }

                processImportedData(jsonData);
            } catch (err) {
                console.error("Erro ao analisar arquivo", err);
                showToast('Erro ao processar a planilha. Verifique a extensão e o layout.', true);
            }
        };
        
        reader.readAsArrayBuffer(file);
    };

    // Helper functions for field extraction by possible names
    const getVal = (row, ...keys) => {
        for (let key of keys) {
            if (row[key] !== undefined) return String(row[key]).trim();
        }
        return '';
    };

    // Process and validate imported JSON data
    const processImportedData = (rows) => {
        importedRows = [];
        validationErrors = [];

        // Check if provider data is present
        const activeCnpj = localStorage.getItem('nfts_active_provider_cnpj');
        const provider = providersList.find(p => p.cnpj === activeCnpj);
        let defaultServiceCode = '';

        if (!activeCnpj || !provider) {
            showToast('Selecione e salve os dados do Prestador ativo antes de importar o lote!', true);
            // Flash provider form
            providerForm.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.4)";
            setTimeout(() => providerForm.style.boxShadow = "none", 2000);
        } else {
            defaultServiceCode = provider.serviceCode || '';
        }

        rows.forEach((row, index) => {
            const rowIndex = index + 2; // spreadsheet 1-indexed header is row 1
            
            // Map columns flexible to different casing
            const rawTomadorCnpjCpf = getVal(row, 'CNPJ_CPF_TOMADOR', 'cnpj_cpf_tomador', 'CNPJ', 'CPF');
            const rawNome = getVal(row, 'NOME_RAZAO_TOMADOR', 'nome_razao_tomador', 'NOME', 'RAZAO_SOCIAL');
            const rawIm = getVal(row, 'INSCRICAO_MUNICIPAL_TOMADOR', 'inscricao_municipal_tomador');
            const rawUf = getVal(row, 'UF_TOMADOR', 'uf_tomador', 'UF');
            const rawMunicipio = getVal(row, 'MUNICIPIO_TOMADOR', 'municipio_tomador', 'MUNICIPIO');
            const rawData = getVal(row, 'DATA_EMISSAO_DD_MM_AAAA', 'data_emissao', 'DATA_EMISSAO', 'DATA');
            const rawCodServico = getVal(row, 'CODIGO_SERVICO', 'codigo_servico', 'COD_SERVICO');
            const rawValor = getVal(row, 'VALOR_SERVICO', 'valor_servico', 'VALOR');
            const rawAliquota = getVal(row, 'ALIQUOTA_PERCENTUAL', 'aliquota_percentual', 'ALIQUOTA');
            const rawIssRetido = getVal(row, 'ISS_RETIDO_SIM_NAO', 'iss_retido_sim_nao', 'ISS_RETIDO', 'RETIDO');
            const rawDescricao = getVal(row, 'DISCRIMINACAO_SERVICO', 'discriminacao_servico', 'DESCRICAO');

            // Parsed Object
            const parsedItem = {
                line: rowIndex,
                cnpjCpf: rawTomadorCnpjCpf,
                nome: rawNome,
                im: rawIm,
                uf: rawUf,
                municipio: rawMunicipio,
                data: rawData,
                codServico: rawCodServico || defaultServiceCode,
                valor: parseFloat(rawValor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
                aliquota: parseFloat(rawAliquota.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
                issRetido: rawIssRetido.toLowerCase().includes('s') || rawIssRetido.toLowerCase().includes('y'), // Sim, Yes
                descricao: rawDescricao
            };

            // Validation rules
            const itemErrors = [];

            // 1. CPF/CNPJ validation
            const cleanCnpjCpf = parsedItem.cnpjCpf.replace(/\D/g, "");
            if (!cleanCnpjCpf) {
                itemErrors.push(`Linha ${rowIndex}: CNPJ/CPF do Tomador é obrigatório.`);
            } else if (cleanCnpjCpf.length !== 11 && cleanCnpjCpf.length !== 14) {
                itemErrors.push(`Linha ${rowIndex}: CNPJ/CPF do Tomador está com comprimento incorreto (esperado 11 ou 14 dígitos).`);
            }

            // 2. Name validation
            if (!parsedItem.nome) {
                itemErrors.push(`Linha ${rowIndex}: Razão Social do Tomador é obrigatória.`);
            }

            // 3. Date validation
            if (!parsedItem.data) {
                itemErrors.push(`Linha ${rowIndex}: Data de emissão é obrigatória.`);
            } else {
                const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if (!datePattern.test(parsedItem.data)) {
                    itemErrors.push(`Linha ${rowIndex}: Formato de data inválido (${parsedItem.data}). Use DD/MM/AAAA.`);
                }
            }

            // 4. Value validation
            if (parsedItem.valor <= 0) {
                itemErrors.push(`Linha ${rowIndex}: O valor do serviço deve ser maior que R$ 0,00.`);
            }

            // 5. Aliquot validation
            const isSimples = provider && provider.regime === 'simples';
            if (!isSimples && (parsedItem.aliquota < 2 || parsedItem.aliquota > 5)) {
                itemErrors.push(`Linha ${rowIndex}: Para empresas de Lucro Presumido/Real, a alíquota de ISS deve ser preenchida na planilha e estar entre 2% e 5%.`);
            } else if (isSimples && (parsedItem.aliquota < 0 || parsedItem.aliquota > 100)) {
                itemErrors.push(`Linha ${rowIndex}: A alíquota do ISS deve ser um valor percentual válido.`);
            }

            // 6. Service Code validation
            if (!parsedItem.codServico) {
                itemErrors.push(`Linha ${rowIndex}: Código de serviço é obrigatório.`);
            }

            if (itemErrors.length > 0) {
                validationErrors.push(...itemErrors);
                parsedItem.status = 'error';
            } else {
                parsedItem.status = 'valid';
            }

            importedRows.push(parsedItem);
        });

        // Update UI
        updateSummaryStats();
        renderTable();
        renderErrorsList();
        
        clearDataBtn.removeAttribute('disabled');
        
        if (validationErrors.length > 0) {
            generateTxtBtn.setAttribute('disabled', 'true');
            showToast('Lote importado com inconsistências.', true);
        } else {
            generateTxtBtn.removeAttribute('disabled');
            showToast('Planilha importada e validada com sucesso!');
        }
    };

    // Calculate totals and update dashboard
    const updateSummaryStats = () => {
        const totalNotes = importedRows.length;
        const totalValue = importedRows.reduce((acc, row) => acc + row.valor, 0);
        
        const totalIss = importedRows.reduce((acc, row) => {
            if (row.issRetido) {
                return acc + (row.valor * (row.aliquota / 100));
            }
            return acc;
        }, 0);

        statTotalNotes.textContent = totalNotes;
        statTotalValue.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue);
        statTotalIss.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIss);

        if (totalNotes === 0) {
            statStatus.textContent = 'Nenhum arquivo enviado';
            statStatus.className = 'stat-status-badge status-empty';
        } else if (validationErrors.length > 0) {
            statStatus.textContent = 'Erros no Lote';
            statStatus.className = 'stat-status-badge status-errors';
        } else {
            statStatus.textContent = 'Lote Válido';
            statStatus.className = 'stat-status-badge status-success';
        }

        tableRowCount.textContent = `${totalNotes} nota${totalNotes !== 1 ? 's' : ''}`;
    };

    // Render table data
    const renderTable = () => {
        tableBody.innerHTML = '';

        if (importedRows.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-table">
                        <div class="empty-state">
                            <i data-lucide="inbox"></i>
                            <p>Nenhuma nota importada. Baixe o modelo e faça o upload para visualizar os dados aqui.</p>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        importedRows.forEach((row) => {
            const tr = document.createElement('tr');
            
            const isError = row.status === 'error';
            const statusBadge = isError 
                ? '<span class="status-badge status-errors" style="padding:0.15rem 0.4rem; font-size:0.75rem;">Incorreto</span>'
                : '<span class="status-badge status-success" style="padding:0.15rem 0.4rem; font-size:0.75rem;">Válido</span>';

            tr.innerHTML = `
                <td>${row.line}</td>
                <td class="${isError && !row.cnpjCpf ? 'text-danger-row' : ''}">${row.cnpjCpf || 'Ausente'}</td>
                <td class="${isError && !row.nome ? 'text-danger-row' : ''}">${row.nome || 'Ausente'}</td>
                <td class="${isError && !row.data ? 'text-danger-row' : ''}">${row.data || 'Ausente'}</td>
                <td class="${isError && !row.codServico ? 'text-danger-row' : ''}">${row.codServico || 'Ausente'}</td>
                <td class="${isError && row.valor <= 0 ? 'text-danger-row' : ''}">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor)}</td>
                <td>${row.aliquota.toFixed(2)}%</td>
                <td>${row.issRetido ? 'Sim' : 'Não'}</td>
                <td>${statusBadge}</td>
            `;
            tableBody.appendChild(tr);
        });
    };

    // Render list of verification errors
    const renderErrorsList = () => {
        errorList.innerHTML = '';
        if (validationErrors.length === 0) {
            errorsPanel.style.display = 'none';
            return;
        }

        errorsPanel.style.display = 'block';
        errorCountSpan.textContent = validationErrors.length;

        validationErrors.forEach((err) => {
            const li = document.createElement('li');
            li.innerHTML = `<i data-lucide="x-circle"></i> <span>${err}</span>`;
            errorList.appendChild(li);
        });
        
        lucide.createIcons();
    };

    // Reset application state
    clearDataBtn.addEventListener('click', () => {
        importedRows = [];
        validationErrors = [];
        updateSummaryStats();
        renderTable();
        renderErrorsList();
        fileInput.value = '';
        clearDataBtn.setAttribute('disabled', 'true');
        generateTxtBtn.setAttribute('disabled', 'true');
        showToast('Dados do lote limpos.');
    });

    // Export standard NFTS format (TXT) layout compilation
    generateTxtBtn.addEventListener('click', () => {
        if (validationErrors.length > 0 || importedRows.length === 0) {
            showToast('Corrija os erros do lote antes de exportar o arquivo TXT.', true);
            return;
        }

        const activeCnpj = localStorage.getItem('nfts_active_provider_cnpj');
        const provider = providersList.find(p => p.cnpj === activeCnpj);
        
        if (!activeCnpj || !provider) {
            showToast('Selecione ou salve as informações do Prestador ativo na barra lateral antes de exportar!', true);
            return;
        }

        // Helper para converter data DD/MM/AAAA em AAAAMMDD
        const parseDateToYYYYMMDD = (dateStr) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return parts[2] + parts[1].padStart(2, '0') + parts[0].padStart(2, '0');
            }
            return new Date().toISOString().slice(0, 10).replace(/-/g, "");
        };

        // Calcular período inicial e final do lote baseado nas notas
        let minDateStr = "";
        let maxDateStr = "";
        
        if (importedRows.length > 0) {
            const dates = importedRows.map(r => {
                const parts = r.data.split('/');
                return {
                    original: r.data,
                    parsed: new Date(parts[2], parts[1] - 1, parts[0])
                };
            }).filter(d => !isNaN(d.parsed.getTime()));
            
            if (dates.length > 0) {
                dates.sort((a, b) => a.parsed - b.parsed);
                minDateStr = parseDateToYYYYMMDD(dates[0].original);
                maxDateStr = parseDateToYYYYMMDD(dates[dates.length - 1].original);
            }
        }
        
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        if (!minDateStr) minDateStr = todayStr;
        if (!maxDateStr) maxDateStr = todayStr;

        const cnpjLimpo = provider.cnpj.replace(/\D/g, "");
        const imLimpa = provider.im.replace(/\D/g, "");
        const dateToday = new Date().toLocaleDateString('pt-BR').replace(/\D/g, ""); // DDMMYYYY

        // Build Fixed-Width TXT File matching typical Brazilian NFTS layout
        // Type 1: CABECALHO
        // Type 2: DETALHE (NFTS)
        // Type 9: RODAPE
        
        let txtContent = "";

        // CABECALHO: Tipo (1) + Versao (002) + IM Tomador (8) + Data Inicio (8) + Data Fim (8)
        txtContent += `1002${imLimpa.padStart(8, '0')}${minDateStr}${maxDateStr}\r\n`;

        // DETALHES
        importedRows.forEach((row, i) => {
            const tomadorCnpjCpf = (row.cnpjCpf || "").replace(/\D/g, "");
            const tomadorIm = (row.im || "").replace(/\D/g, "");
            
            // Format dates
            let dataPrestacao = "";
            const dateParts = (row.data || "").split('/');
            if (dateParts.length === 3) {
                dataPrestacao = dateParts[2] + dateParts[1].padStart(2, '0') + dateParts[0].padStart(2, '0');
            } else {
                dataPrestacao = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            }
            
            // Format values (15 pos)
            const valCents = Math.round(row.valor * 100).toString().padStart(15, '0');
            
            // Format Aliquot (4 pos)
            const aliqFmt = Math.round(row.aliquota * 100).toString().padStart(4, '0');
            
            // ISS Retido: 1 for Sim, 2 for Nao (1 pos)
            const issRet = row.issRetido ? "1" : "2";
            
            // Service Code (5 pos)
            const codServ = (row.codServico || "").replace(/\D/g, "").substring(0, 5).padStart(5, '0');
            
            // Indicator of CNPJ/CPF (1 pos)
            const indicadorCnpjCpf = tomadorCnpjCpf.length === 11 ? "1" : (tomadorCnpjCpf.length === 14 ? "2" : "3");
            const cnpjCpfPrest = tomadorCnpjCpf.padStart(14, '0');
            const imPrest = tomadorIm.padEnd(8, ' ');
            
            // Regime: 4 for Simples Nacional, 0 for Presumido/Real
            const regimeTrib = provider && provider.regime === 'simples' ? "4" : "0";
            
            // Address fields
            const tipoEndereco = "   "; // Size 3
            const logradouro = "".padEnd(50, ' ');
            const numero = "".padEnd(10, ' ');
            const complemento = "".padEnd(30, ' ');
            const bairro = "".padEnd(30, ' ');
            const rawCep = (row.cep || "").replace(/\D/g, "");
            const cep = rawCep ? rawCep.padStart(8, '0') : "01001000"; // Default CEP if missing
            
            // Cidade and UF of prestador
            const cidadePrest = (row.municipio || "SÃO PAULO").substring(0, 50).padEnd(50, ' ');
            const ufPrest = (row.uf || "SP").substring(0, 2).toUpperCase().padEnd(2, ' ');
            
            // Prestador Name (Razao Social)
            const nomePrest = (row.nome || "").substring(0, 75).padEnd(75, ' ');
            
            // Email and description
            const email = (row.email || "").substring(0, 75).padEnd(75, ' ');
            const descServico = (row.descricao || "").replace(/\r/g, "").replace(/\n/g, "|").substring(0, 1000);

            // New fields required for Layout V.002 to reach 664 character line head length:
            const dataPagamento = "        "; // Size 8
            const cei = "000000000000";           // Size 12
            const obra = "000000000000";          // Size 12
            const reservado = "".padEnd(200, ' '); // Size 200

            // Detalhe Layout (664 characters line head):
            const lineHead = `401     000000000000${dataPrestacao}NT${valCents}000000000000000${codServ}    ${aliqFmt}${issRet}${indicadorCnpjCpf}${cnpjCpfPrest}${imPrest}${nomePrest}${tipoEndereco}${logradouro}${numero}${complemento}${bairro}${cidadePrest}${ufPrest}${cep}${email}1${regimeTrib}${dataPagamento}${cei}${obra}${reservado}`;
            
            const line = lineHead + descServico;
            txtContent += line + "\r\n";
        });

        // RODAPE: Tipo (9) + Qtd Regs (7) + Total Valor (15) + Total Deduções (15 zeros)
        const numRegs = importedRows.length.toString().padStart(7, '0');
        const totalValCents = Math.round(importedRows.reduce((acc, r) => acc + r.valor, 0) * 100).toString().padStart(15, '0');
        
        let footerLine = `9${numRegs}${totalValCents}${"".padStart(15, '0')}`;
        txtContent += footerLine + "\r\n";

        // Convert string to ISO-8859-1 (Latin-1) bytes to prevent UTF-8 characters from shifting layout offsets
        const uint8Array = new Uint8Array(txtContent.length);
        for (let i = 0; i < txtContent.length; i++) {
            uint8Array[i] = txtContent.charCodeAt(i) & 0xff;
        }

        // Create and trigger download
        const blob = new Blob([uint8Array], { type: 'text/plain;charset=iso-8859-1' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `LOTE_NFTS_${cnpjLimpo}_${dateToday}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Arquivo de Lote TXT gerado com sucesso!');
    });
});
