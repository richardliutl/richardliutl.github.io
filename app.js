const currentContentMap = {
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
"#index": `
# Richard Liu

## Recreating the Past (MAS.S62)
## Unofficially: MIT Confessions Compiled
## Y2023 Puzzle
## sudoku
`,
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // //
"#footer": `
***
[Back to home](${window.location.pathname}#index)
`,
};

const contentMap = {...currentContentMap};
const directoryListing = [
  ['#recreating-the-past-mas-s62-', './rtp/index.md'],
  ['#unofficially-mit-confessions-compiled', './unobcc/index.md'],
  ['#y2023-puzzle', './Y2023/index.md'],
  ['#sudoku', './sudoku/index.md'],
];
const listingContentMap = Promise.all(
  directoryListing.map(([hash, file]) => 
    fetch(file)
      .then(response => response.text())
      .then(text => {
        contentMap[hash] = text;
      })
  )
);

async function initContentHashmap(escapedTextMap) {
  if (!marked) {
    return;
  }
  let hashMap = {};
  await listingContentMap;
  // Override function
  const renderer = (hash) => {return {
    heading(text, level) {
      let escapedTextBase = text.toLowerCase().replace(/[^\w]+/g, '-');
      const escapedTextFn = (ix) => escapedTextBase+(ix > 0 ? ('-'+ix) : '');
      let ix = 0;
      for (ix; "#"+escapedTextFn(ix) in hashMap; ix++) {}
      const escapedText = escapedTextFn(ix); // De-duplicate hashes

      const anchor = `
              <a name="${escapedText}" class="anchor" href="${window.location.pathname}#${escapedText}"><span class="header-link">↪︎</span></a>`;
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
let hashMap = {}; // maps hashes to corresponding top-level hash

async function loadContent(event, hash, init=false) {
  if (!marked) {
    return;
  }
  
  if (init) {
    hashMap = await initContentHashmap(escapedTextMap); // maps hashes to corresponding top-level hash
  }
  // Override function
  const renderer = {
    heading(text, level) {
      const escapedTextBase = text.toLowerCase().replace(/[^\w]+/g, '-');
      let hashkey = hash || hashMap[window.location.hash];
      const escapedText = (escapedTextMap[hashkey] && escapedTextMap[hashkey][text]) ||
        escapedTextBase; // default
      const anchor = `
              <a name="${escapedText}" class="anchor" href="${window.location.pathname}#${escapedText}"><span class="header-link">↪︎</span></a>`;
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
    //  code.addEventListener('click', spotlightCode);
    }
    
    // Style code blocks
    hljs.highlightAll();
  }
}

// Defaults to home
loadContent(
  null,
  (window.location.hash && hashMap[window.location.hash]) || Object.keys(contentMap)[0],
  true
);
