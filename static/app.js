const searchBox = document.getElementById('q');

// Find where we match text and then get 2 lines above and beyond for context.
// TODO: get multiple matches in one file...
function extractBodyLines(body, query) {
  const results = [];
  const lines = body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (!line.match('<em>')) {
      continue;
    }

    // A match, now we want to grab the context
    const lower = (i - 2 < 0) ? 0: i - 2;
    const upper = (i + 2 > lines.length) ? lines.length: i + 2;

    let text = lines.slice(lower, upper).join("\n");
    results.push(text);
    
    // Skip next two lines as they are already in context
    i += 2;
  }

  return results;
}

function createCodeBlock(body) {
  const content = document.createElement("div");
  content.className = "body content";

  // TODO: remove starting \n
  // TODO: figure out how this can happen: "latex" search
  body = body.replace(/^\n+|\n+$/, '');
  body = body.replace(/\n/g, "<br/>");
  body += "<hr>";
  content.innerHTML = body;

  return content;
}

function showData(data) {
  const results = document.getElementById("results");
  const stats = document.getElementById("stats");
  results.textContent = "";

  const fragment = new DocumentFragment();

  for (let i = 0; i < data.hits.length; i++) {
    const result = data.hits[i];
    // TODO: Escape body HTML
    const pkgbase = result.pkgbase_id;
    // TODO: check that _formatted is there
    let body = result._formatted.body;

    const div = document.createElement("div");
    div.className = "box";

    const h4 = document.createElement("h4");
    h4.className = "title is-4";

    const link = document.createElement("a");
    // TODO: community/packages difference
    link.href = "https://git.archlinux.org/svntogit/packages.git/tree/trunk/PKGBUILD?h=packages/" + pkgbase
    link.innerHTML = pkgbase;

    h4.appendChild(link);
    div.appendChild(h4);

    const searchMatches = extractBodyLines(body, data.query);
    for (let j = 0; j < searchMatches.length; j++) {
      div.appendChild(createCodeBlock(searchMatches[j]));
    }

    fragment.appendChild(div);
  }

  results.appendChild(fragment);

  stats.innerHTML = data.processingTimeMs + ' ms / ' + data.nbHits + ' documents';
}

// TODO: deboucning....
function search() {
  let query = searchBox.value.trim();

  searchBox.value = query;
  window.location.hash = query;

  if (query == '') {
    return;
  }

  fetch('/search/indexes/pkgbuilds/search?attributesToHighlight=*&q=' + query).then(function(response) {
    return response.json();
  }).then(function(data) {
    showData(data);
  });
}


searchBox.addEventListener('keyup', function(event) {
  if (event.key == 'Enter') {
    search();
  }
});

document.getElementById('button').addEventListener('click', function(event) {
  search();
});

if (window.location.hash) {
  let hash = window.location.hash.substring(1)
  searchBox.value = hash;
  search();
}
