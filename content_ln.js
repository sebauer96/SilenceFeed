chrome.storage.sync.get(["keywords", "accounts", "selectedAction"], function(data) {
    let keywords = data.keywords || [];
    let accounts = data.accounts || [];
    let selectedAction = data.selectedAction || 'blur';
    // Función para verificar si el texto contiene alguna palabra clave
    function containsKeyword(text, keywords) {
        return keywords.some(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            return regex.test(text.toLowerCase());
        });
    }

    // Función para aplicar desenfoque a un tweet
    function applyBlur(post) {
        post.style.filter = 'blur(5px)';
        post.style.pointerEvents = 'none'; // Evita la interacción con el contenido borroso
        post.style.transition = 'filter 0.3s ease-in-out'; // Añade una transición suave
    }

    // Función para eliminar el desenfoque de un tweet
    function removeBlur(post) {
        post.style.filter = '';
        post.style.pointerEvents = ''; // Rehabilita la interacción con el contenido
    }

    function hidePost(post) {
        post.style.display = 'none';
    }

    function seePost(post) {
        post.style.display = 'block';
    }

    function addAccount(account) {
        chrome.storage.sync.get('accounts', function (data) {
            const accounts = data.accounts || [];
            if (!accounts.includes(account)) {
                accounts.push(account);
                chrome.storage.sync.set({ accounts: accounts }, function () {
                    filterContent();
                });
            }
        });
    }
    function createBlockButton(author) {
        const button = document.createElement('button');
        button.innerHTML = `
           <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ff0a0e" version="1.1" id="Capa_1" width="16px" height="16px" viewBox="0 0 34.25 34.25" xml:space="preserve">
<g>
	<path d="M17.125,0C7.668,0,0,7.667,0,17.125S7.668,34.25,17.125,34.25c9.459,0,17.125-7.667,17.125-17.125S26.584,0,17.125,0z    M10.805,16.328c-1.354,0-2.453-1.099-2.453-2.453s1.1-2.453,2.453-2.453c1.355,0,2.453,1.099,2.453,2.453   S12.161,16.328,10.805,16.328z M21.227,25.148c0.398,0.397,0.398,1.047,0,1.444l-1.178,1.179c-0.199,0.198-0.461,0.299-0.723,0.299   s-0.523-0.101-0.725-0.299l-1.479-1.479l-1.479,1.479c-0.201,0.198-0.463,0.299-0.725,0.299c-0.262,0-0.523-0.101-0.723-0.299   l-1.178-1.179c-0.398-0.397-0.398-1.047,0-1.444l1.479-1.479l-1.479-1.478c-0.398-0.399-0.398-1.047,0-1.447l1.178-1.178   c0.4-0.398,1.047-0.398,1.447,0l1.479,1.479l1.478-1.479c0.399-0.398,1.049-0.398,1.446,0l1.179,1.178   c0.397,0.398,0.397,1.047,0,1.447l-1.479,1.478L21.227,25.148z M23.445,16.328c-1.354,0-2.452-1.099-2.452-2.453   s1.101-2.453,2.452-2.453c1.354,0,2.453,1.099,2.453,2.453S24.801,16.328,23.445,16.328z"/>
</g>
</svg>
        `;
        button.style.marginLeft = '5px';
        button.style.border = 'none';
        button.style.background = 'transparent';
        button.style.cursor = 'pointer';
        button.title = `Block @${author}`;
        button.type = 'button'

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            addAccount(author);
        });

        return button;
    }

    // Filtrar y desenfocar contenido
    function filterContent() {
        // Selector para posts en LinkedIn
        const posts = document.querySelectorAll('.relative');

        posts.forEach(post => {
            const postTextElement = post.querySelector('.update-components-text .break-words');
            const postText = postTextElement ? postTextElement.innerText || postTextElement.textContent : ''; // Capturar el texto del post
            
            // Buscar el autor del post en LinkedIn
            const authorElement = post.querySelector('.update-components-actor__name span span'); // Selector para el nombre del autor
            const author = authorElement ? authorElement.textContent.trim() : '';
            const parentAuthor = post.querySelector('.update-components-actor__title')

            // Desenfocar u ocultar si contiene palabra clave o si es de una cuenta bloqueada
            if (containsKeyword(postText, keywords) || (author && containsKeyword(author, accounts))) {
                if (selectedAction === 'blur') {
                    applyBlur(post);
                    seePost(post); // Asegurar que esté visible y blureado
                } else if (selectedAction === 'delete') {
                    removeBlur(post); // Eliminar cualquier blur si estaba aplicado
                    hidePost(post);  // Oculta el post usando display: none
                }
            } else {
                if (selectedAction === 'blur') {
                    removeBlur(post);
                }
                if (selectedAction === 'delete') {
                    seePost(post);  // Rehabilita el display si no cumple con los criterios
                }
            }

            if (authorElement && !post.querySelector('.block-button')) {
                const blockButton = createBlockButton(author);
                blockButton.classList.add('block-button');
                parentAuthor.appendChild(blockButton)
            }
        });
    }

    // Filtrar y desenfocar contenido al cargar la página y en cada cambio del DOM (para detectar nuevo contenido cargado)
    filterContent();
    const observer = new MutationObserver(filterContent);
    observer.observe(document.body, { childList: true, subtree: true });

    // Escuchar mensajes desde el popup o desde las opciones
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "addKeyword") {
            keywords.push(request.keyword);
            filterContent(); // Aplicar el desenfoque inmediatamente
        }
        if (request.action === "removeKeyword") {
            keywords = keywords.filter(keyword => keyword !== request.keyword);
            filterContent(); // Actualizar el filtrado para eliminar el desenfoque si ya no es necesario
        }

        if (request.action === "addAccount") {
            accounts.push(request.account);
            filterContent(); // Aplicar el desenfoque inmediatamente
        }
        if (request.action === "removeAccount") {
            accounts = accounts.filter(account => account !== request.account);
            filterContent(); // Actualizar el filtrado para eliminar el desenfoque si ya no es necesario
        }
        if (request.action === "updateAction") {
            selectedAction = request.selectedAction;
            filterContent();  // Reaplicar el filtrado con la nueva acción seleccionada
        }
    });

    chrome.storage.onChanged.addListener(function(changes, namespace) {
        let shouldFilterContent = false;
    
        if (changes.keywords) {
            keywords = changes.keywords.newValue || [];
            shouldFilterContent = true;
        }
    
        if (changes.accounts) {
            accounts = changes.accounts.newValue || [];
            shouldFilterContent = true;
        }
    
        if (changes.selectedAction) {
            selectedAction = changes.selectedAction.newValue || 'blur';
            shouldFilterContent = true;
        }
    
        if (shouldFilterContent) {
            filterContent(); // Aplicar el desenfoque o eliminar el post según los nuevos datos
        }
    });
    
});
