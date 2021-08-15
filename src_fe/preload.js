// preload.ts: Runs after the processing (main.js) and before the renderer(renderer.js).
// Copyright (C) 2021  erikoui


window.addEventListener('DOMContentLoaded', () => {
    // Replaces innerText of stuff with id `selector`
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
    
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })