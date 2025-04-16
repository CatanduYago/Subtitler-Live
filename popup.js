let currentTabId = null;

document.getElementById("start").addEventListener("click", async () => {
  console.log("Botón iniciar presionado");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Pestaña actual:", tab.id);
    
    // Verificar que no sea la pestaña de la extensión
    if (tab.url.startsWith('chrome-extension://')) {
      console.error("No se puede grabar en la pestaña de la extensión");
      document.getElementById("status").textContent = "Error: No se puede grabar en esta pestaña";
      document.getElementById("status").className = "status inactive";
      return;
    }

    currentTabId = tab.id;
    
    // Primero, intentamos inyectar el script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log("Script inyectado correctamente");
    } catch (error) {
      console.log("El script ya está inyectado o hubo un error:", error);
    }

    // Esperamos un momento para asegurarnos de que el script esté listo
    setTimeout(async () => {
      try {
        console.log("Enviando mensaje de inicio...");
        await chrome.tabs.sendMessage(tab.id, { action: "start" });
        console.log("Mensaje de inicio enviado correctamente");
        document.getElementById("status").textContent = "Activo";
        document.getElementById("status").className = "status active";
      } catch (error) {
        console.error("Error al enviar mensaje de inicio:", error);
        document.getElementById("status").textContent = "Error";
        document.getElementById("status").className = "status inactive";
      }
    }, 500);
  } catch (error) {
    console.error("Error general al iniciar:", error);
    document.getElementById("status").textContent = "Error";
    document.getElementById("status").className = "status inactive";
  }
});

document.getElementById("stop").addEventListener("click", async () => {
  console.log("Botón detener presionado");
  if (!currentTabId) {
    console.log("No hay grabación activa");
    return;
  }

  try {
    console.log("Enviando mensaje de parada...");
    await chrome.tabs.sendMessage(currentTabId, { action: "stop" });
    console.log("Mensaje de parada enviado correctamente");
    document.getElementById("status").textContent = "Inactivo";
    document.getElementById("status").className = "status inactive";
    currentTabId = null;
  } catch (error) {
    console.error("Error al enviar mensaje de parada:", error);
    // Si hay error, asumimos que la grabación se detuvo
    document.getElementById("status").textContent = "Inactivo";
    document.getElementById("status").className = "status inactive";
    currentTabId = null;
  }
});

// Limpiar cuando se cierra el popup
window.addEventListener('unload', () => {
  if (currentTabId) {
    chrome.tabs.sendMessage(currentTabId, { action: "stop" }).catch(() => {});
  }
});
