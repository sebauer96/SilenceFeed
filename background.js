// Escuchar cuando una pestaña es actualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log(`Pestaña actualizada: ${tab.url}`);
      // Podrías realizar alguna acción aquí, como reiniciar el filtrado
    }
  });
  
  // Escuchar mensajes desde otros scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_KEYWORDS') {
      // Ejemplo de respuesta con datos almacenados
      chrome.storage.sync.get('keywords', function(data) {
        sendResponse(data.keywords || []);
      });
      return true; // Indica que responderás de forma asíncrona
    }
  });
  