const currentContentMap = {
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
"#foo": `
Hello world
`,
};

const contentMap = {...currentContentMap, ...baseContentMap};

function initContentHashmap(escapedTextMap) {
  if (!marked) {
    return;
  }
  let hashMap = {};
  // Override function
  const renderer = (hash) => {return {
    heading(text, level) {
      let escapedTextBase = text.toLowerCase().replace(/[^\w]+/g, '-');
      const escapedTextFn = (ix) => escapedTextBase+(ix > 0 ? ('-'+ix) : '');
      let ix = 0;
      for (ix; "#"+escapedTextFn(ix) in hashMap; ix++) {}
      const escapedText = escapedTextFn(ix); // De-duplicate hashes

      const anchor = `
              <a name="${escapedText}" class="anchor" href="#${escapedText}"><span class="header-link">↪︎</span></a>`;
      hashMap[`#${escapedText}`] = hash;
      
      if (!(hash in escapedTextMap)) escapedTextMap[hash] = {};
      escapedTextMap[hash][text] = escapedText;
    }
  }};
  for (let hash of Object.keys(contentMap)) {
    if (hash == "#all-weeks") continue; // all-weeks is never the source
    marked.use({ renderer: renderer(hash) });
    marked.parse(contentMap[hash]);
  }
  return hashMap;
}
const escapedTextMap = {};
const hashMap = initContentHashmap(escapedTextMap); // maps hashes to corresponding top-level hash

function loadContent(event, hash) {
  if (!marked) {
    return;
  }
  // Override function
  const renderer = {
    heading(text, level) {
      const escapedTextBase = text.toLowerCase().replace(/[^\w]+/g, '-');
      let hashkey = hash || hashMap[window.location.hash];
      const escapedText = (escapedTextMap[hashkey] && escapedTextMap[hashkey][text]) ||
        escapedTextBase; // default
      const anchor = `
              <a name="${escapedText}" class="anchor" href="#${escapedText}"><span class="header-link">↪︎</span></a>`;
      return `
              <h${level}>
                ${level > 1 ? anchor : ""}
                ${text}
              </h${level}>`;
    },
    image(href, title, text) {
      const classStr = (title && `class="${title}"`) || '';
      return `<img src="${href}" alt="${text}" title="${text}" ${classStr}>`;
    }
  };
  marked.use({ renderer });

  let hashContent = contentMap[hash]; 
  if (window.location.hash) hashContent = contentMap[window.location.hash] || // Top-level hash
    (hashMap[window.location.hash] && contentMap[hashMap[window.location.hash]]) || // Nested hash
    contentMap['#all-weeks']; // Default for broken links

  // To-Do: Map this to correct destination
  if (hashContent) {
    document.getElementById('content').innerHTML = marked.parse(hashContent + contentMap['#footer']);
    
    // Update styling
    document.getElementById('content').style.whiteSpace = "normal";
    
    // Prevent double-load
    window.removeEventListener('hashchange', loadContent);
    window.addEventListener('hashchange', loadContent);
    
    // Add spotlights
    for (const code of document.querySelectorAll('#content pre code')) {
      code.addEventListener('click', spotlightCode);
    }
    
    // Style code blocks
    hljs.highlightAll();
  }
}
loadContent(null, (window.location.hash && hashMap[window.location.hash]) || Object.keys(contentMap)[0]); // Defaults to week 11