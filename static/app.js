function addWord() {
    const word = document.getElementById('wordInput').value.trim();
    const messageElem = document.getElementById('message');
    messageElem.textContent = '';

    if (!word) {
        messageElem.textContent = 'Please enter a word.';
        return;
    }

    fetch('/add_word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            messageElem.textContent = data.error;
        } else {
            messageElem.textContent = data.message;
            document.getElementById('wordInput').value = '';
            updateGraphs();
        }
    });
}

function minimize() {
    fetch('/minimize', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('message').textContent = data.message;
        updateGraphs();
    });
}

function searchWord() {
    const word = document.getElementById('searchInput').value.trim();
    const messageElem = document.getElementById('message');
    messageElem.textContent = '';

    if (!word) {
        messageElem.textContent = 'Please enter a word to search.';
        return;
    }

    fetch('/search_word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
    })
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            messageElem.textContent = `'${word}' exists in the DAFSA.`;
        } else {
            messageElem.textContent = `'${word}' does not exist in the DAFSA.`;
        }
    });
}

function updateGraphs() {
    fetch('/get_graph_data')
    .then(response => response.json())
    .then(data => {
        renderGraph(data, 'originalGraph');
    });

    fetch('/get_minimized_graph_data')
    .then(response => response.json())
    .then(data => {
        renderGraph(data, 'minimizedGraph');
    });
}

function renderGraph(graphData, containerId) {
    const cy = cytoscape({
        container: document.getElementById(containerId),
        elements: graphData.nodes.concat(graphData.edges),
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': '#007bff',
                    'width': '50px',
                    'height': '50px',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': '#fff',
                    'font-size': '12px',
                }
            },
            {
                selector: 'node[is_final]',
                style: {
                    'background-color': '#28a745',
                }
            },
            {
                selector: 'edge',
                style: {
                    'label': 'data(label)',
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'width': 2,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'font-size': '10px',
                    'color': '#000',
                }
            }
        ],
        layout: {
            name: 'dagre',
            rankDir: 'TB',
            nodeDimensionsIncludeLabels: true,
            rankSep: 75,
            edgeSep: 50,
            ranker: 'network-simplex',
        },
        boxSelectionEnabled: false,
        autounselectify: true
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateGraphs();
});
