chrome.storage.sync.get(["keywords", "accounts", "selectedAction"], function (data) {
    let keywords = data.keywords || [];
    let accounts = data.accounts || [];
    let selectedAction = data.selectedAction || 'blur';

    function containsKeyword(text, keywords) {
        return keywords.some(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            return regex.test(text.toLowerCase());
        });
    }

    function applyBlur(post) {
        post.style.filter = 'blur(5px)';
        post.style.pointerEvents = 'none';
        post.style.transition = 'filter 0.3s ease-in-out';
        // const button = post.parentNode.querySelector('.view-button');
        // if (!button) {
        //     post.parentNode.appendChild(createViewContentButton(post))
        // }
        // else {
        //     button.style.display = 'flex'
        // }
    }

    function removeBlur(post) {
        post.style.filter = '';
        post.style.pointerEvents = '';
        const button = post.parentNode.querySelector('.view-button');
        if (button) {
            button.style.display = 'none'
        }
    }

    function hidePost(post) {
        post.style.display = 'none';
    }

    function seePost(post) {
        post.style.display = 'flex';
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
           <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ff0a0e" version="1.1" id="Capa_1" width="16px" height="16px" viewBox="0 0 34.25 34.25" xml:space="preserve"><g><path d="M17.125,0C7.668,0,0,7.667,0,17.125S7.668,34.25,17.125,34.25c9.459,0,17.125-7.667,17.125-17.125S26.584,0,17.125,0z    M10.805,16.328c-1.354,0-2.453-1.099-2.453-2.453s1.1-2.453,2.453-2.453c1.355,0,2.453,1.099,2.453,2.453   S12.161,16.328,10.805,16.328z M21.227,25.148c0.398,0.397,0.398,1.047,0,1.444l-1.178,1.179c-0.199,0.198-0.461,0.299-0.723,0.299   s-0.523-0.101-0.725-0.299l-1.479-1.479l-1.479,1.479c-0.201,0.198-0.463,0.299-0.725,0.299c-0.262,0-0.523-0.101-0.723-0.299   l-1.178-1.179c-0.398-0.397-0.398-1.047,0-1.444l1.479-1.479l-1.479-1.478c-0.398-0.399-0.398-1.047,0-1.447l1.178-1.178   c0.4-0.398,1.047-0.398,1.447,0l1.479,1.479l1.478-1.479c0.399-0.398,1.049-0.398,1.446,0l1.179,1.178   c0.397,0.398,0.397,1.047,0,1.447l-1.479,1.478L21.227,25.148z M23.445,16.328c-1.354,0-2.452-1.099-2.452-2.453   s1.101-2.453,2.452-2.453c1.354,0,2.453,1.099,2.453,2.453S24.801,16.328,23.445,16.328z"/></g></svg>
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

    function createViewContentButton(tweet) {
        const button = document.createElement('button');
        button.textContent = `Ver Tweet`;
        button.type = 'button';

        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style.backgroundColor = '#007BFF';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.fontSize = '15px';
        button.style.transition = 'background-color 0.3s';
        button.style.fontFamily = 'sans-serif';
        button.style.padding = '10px';
        button.style.width = '100%';

        button.classList.add('view-button');

        button.addEventListener('click', (event) => {
            removeBlur(tweet);
            tweet.classList.add("view-post")
        });

        return button;
    }


    function filterContent() {
        const tweets = document.querySelectorAll('article[role="article"][data-testid="tweet"]');

        tweets.forEach(tweet => {
            const tweetText = tweet.innerText || tweet.textContent;
            const authorElement = tweet.querySelector('a[role="link"][href*="/"]');
            const author = authorElement ? authorElement.getAttribute('href').split('/').pop() : '';
            const timeElement = tweet.querySelector('time');
            if (containsKeyword(tweetText, keywords) || (author && containsKeyword(author, accounts)) && !tweet.classList.contains("view-post")) {
                if (selectedAction === 'blur') {
                    applyBlur(tweet);
                    seePost(tweet);
                } else if (selectedAction === 'delete') {
                    removeBlur(tweet);
                    hidePost(tweet);
                }
            } else {
                if (selectedAction === 'blur') {
                    removeBlur(tweet);
                }
                if (selectedAction === 'delete') {
                    seePost(tweet);
                }
            }
            if (authorElement && !tweet.querySelector('.block-button')) {
                const blockButton = createBlockButton(author);
                blockButton.classList.add('block-button');
                timeElement.parentNode.parentNode.insertBefore(blockButton, timeElement.parentNode.nextSibling);
            }
        });
    }

    filterContent();
    const observer = new MutationObserver(filterContent);
    observer.observe(document.body, { childList: true, subtree: true });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "addKeyword") {
            keywords.push(request.keyword);
            filterContent();
        }
        if (request.action === "removeKeyword") {
            keywords = keywords.filter(keyword => keyword !== request.keyword);
            filterContent();
        }

        if (request.action === "addAccount") {
            accounts.push(request.account);
            filterContent();
        }
        if (request.action === "removeAccount") {
            accounts = accounts.filter(account => account !== request.account);
            filterContent();
        }
        if (request.action === "updateAction") {
            selectedAction = request.selectedAction;
            filterContent();
        }
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {
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
            filterContent();
        }
    });
});
