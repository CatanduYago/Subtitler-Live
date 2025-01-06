"use strict";

document.getElementById("start-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "start" });
});

document.getElementById("stop-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stop" });
});

  
  function getInputLang() {
    return document.getElementById("input-lang").value;
  }
  
  function getOutputLang() {
    return document.getElementById("output-lang").value;
  }
  