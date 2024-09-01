document.addEventListener('DOMContentLoaded', function () {
    const keywordInput = document.getElementById('keywordInput');
    const addKeywordButton = document.getElementById('addKeyword');
    const keywordsList = document.getElementById('keywordsList');
    const accountInput = document.getElementById('accountInput');
    const addAccountButton = document.getElementById('addAccount');
    const accountsList = document.getElementById('accountsList');
    const actionSelector = document.getElementById('actionSelector');
    const accountAccountGroup = document.querySelector('.account-group');
    const accountLabel = accountAccountGroup.querySelector('span');
    // Detectar la página activa y ajustar la interfaz
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        const url = activeTab.url;
        if (url.includes('x.com')) {
            // Si estamos en Twitter, usar el formato para usuario con @
            if(accountLabel)
                accountLabel.style.display = 'inline'; // Mostrar @
            accountInput.placeholder = chrome.i18n.getMessage('user');
            accountInput.maxLength = 20;
        } else if (url.includes('linkedin.com')) {
            // Si estamos en LinkedIn, usar el formato para nombre completo
            if(accountLabel)
                accountLabel.style.display = 'none'; // Ocultar @
            accountInput.placeholder = chrome.i18n.getMessage('fullName');
            accountInput.maxLength = 30;
        }
    });

    chrome.storage.sync.get('selectedAction', function (data) {
        actionSelector.value = data.selectedAction || 'blur';
    });

    // Cargar y mostrar palabras clave almacenadas
    chrome.storage.sync.get('keywords', function (data) {
        const keywords = data.keywords || [];
        keywords.forEach(addKeywordToList);
    });

    // Cargar y mostrar cuentas bloqueadas almacenadas
    chrome.storage.sync.get('accounts', function (data) {
        const accounts = data.accounts || [];
        accounts.forEach(addAccountToList);
    });

    actionSelector.addEventListener('change', function () {
        const selectedAction = actionSelector.value;
        chrome.storage.sync.set({ selectedAction: selectedAction }, function () {
            // Enviar mensaje a content.js para aplicar el efecto inmediatamente
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "updateAction", selectedAction: selectedAction });
            });
        });
    });

    // Añadir palabra clave
    addKeywordButton.addEventListener('click', function () {
        const keyword = keywordInput.value.trim();
        if (keyword) {
            chrome.storage.sync.get('keywords', function (data) {
                const keywords = data.keywords || [];
                if (keywords.find(k => k === keyword)) {
                    keywordInput.value = '';
                    return;
                }
                keywords.push(keyword);
                chrome.storage.sync.set({ keywords: keywords }, function () {
                    addKeywordToList(keyword);
                    keywordInput.value = '';

                    // Enviar mensaje a content.js para aplicar el desenfoque inmediatamente
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: "addKeyword", keyword: keyword });
                    });
                });
            });
        }
    });

    // Añadir cuenta bloqueada
    addAccountButton.addEventListener('click', function () {
        const account = accountInput.value.trim();
        if (account) {
            chrome.storage.sync.get('accounts', function (data) {
                const accounts = data.accounts || [];
                if (accounts.find(a => a === account)) {
                    accountInput.value = '';
                    return;
                }
                accounts.push(account);
                chrome.storage.sync.set({ accounts: accounts }, function () {
                    addAccountToList(account);
                    accountInput.value = '';

                    // Enviar mensaje a content.js para aplicar el desenfoque inmediatamente
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: "addAccount", account: account });
                    });
                });
            });
        }
    });

    // Función para eliminar palabras clave
    function removeKeyword(keyword) {
        chrome.storage.sync.get('keywords', function (data) {
            const keywords = data.keywords || [];
            const updatedKeywords = keywords.filter(item => item !== keyword);
            chrome.storage.sync.set({ keywords: updatedKeywords }, function () {
                keywordsList.innerHTML = '';
                updatedKeywords.forEach(addKeywordToList);

                // Enviar mensaje a content.js para actualizar el filtrado inmediatamente
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "removeKeyword", keyword: keyword });
                });
            });
        });
    }

    // Función para eliminar cuentas bloqueadas
    function removeAccount(account) {
        chrome.storage.sync.get('accounts', function (data) {
            const accounts = data.accounts || [];
            const updatedAccounts = accounts.filter(item => item !== account);
            chrome.storage.sync.set({ accounts: updatedAccounts }, function () {
                accountsList.innerHTML = '';
                updatedAccounts.forEach(addAccountToList);

                // Enviar mensaje a content.js para actualizar el filtrado inmediatamente
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "removeAccount", account: account });
                });
            });
        });
    }

    function addKeywordToList(keyword) {
        const li = document.createElement('li');
        li.textContent = keyword;
        const removeButton = document.createElement('button');
        removeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M10 12L14 16M14 12L10 16M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        removeButton.addEventListener('click', function () {
            removeKeyword(keyword);
        });
        li.appendChild(removeButton);
        keywordsList.appendChild(li);
    }
    
    function addAccountToList(account) {
        const li = document.createElement('li');
        li.textContent = account;
        const removeButton = document.createElement('button');
        removeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M10 12L14 16M14 12L10 16M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        removeButton.addEventListener('click', function () {
            removeAccount(account);
        });
        li.appendChild(removeButton);
        accountsList.appendChild(li);
    }
});
