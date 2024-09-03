document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('appName').textContent = chrome.i18n.getMessage('appName');
    document.getElementById('silenceKeywords').textContent = chrome.i18n.getMessage('silenceKeywords');
    document.getElementById('silenceAccounts').textContent = chrome.i18n.getMessage('silenceAccounts');
    document.getElementById('actionSelectorLabel').textContent = chrome.i18n.getMessage('actionSelectorLabel');
    document.getElementById('blurOption').textContent = chrome.i18n.getMessage('blurOption');
    document.getElementById('deleteOption').textContent = chrome.i18n.getMessage('deleteOption');
    document.getElementById('keywordInput').placeholder = chrome.i18n.getMessage('keywordPlaceholder');
    document.getElementById('accountInput').placeholder = chrome.i18n.getMessage('accountPlaceholder');
    document.getElementById('addKeyword').title = chrome.i18n.getMessage('addKeywordButton');
    document.getElementById('addAccount').title = chrome.i18n.getMessage('addAccountButton');
    document.getElementById('donateP').textContent = chrome.i18n.getMessage('donate');
});
