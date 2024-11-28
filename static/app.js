let cyInstances = {};

function showFlashMessage(type, message) {
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    if (type === 'success') {
        successMessage.innerHTML = `
            ${message}
        `;
        successMessage.classList.remove('opacity-0', 'pointer-events-none');
        successMessage.classList.add('opacity-100');

        setTimeout(() => {
            hideFlashMessage('success');
        }, 3000);
    } else if (type === 'error') {
        errorMessage.innerHTML = `
            
            ${message}
        `;
        errorMessage.classList.remove('opacity-0', 'pointer-events-none');
        errorMessage.classList.add('opacity-100');

        setTimeout(() => {
            hideFlashMessage('error');
        }, 3000);
    }
}

function hideFlashMessage(type) {
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    if (type === 'success') {
        successMessage.classList.remove('opacity-100');
        successMessage.classList.add('opacity-0', 'pointer-events-none');
        successMessage.innerHTML = '';
    } else if (type === 'error') {
        errorMessage.classList.remove('opacity-100');
        errorMessage.classList.add('opacity-0', 'pointer-events-none');
        errorMessage.innerHTML = '';
    }
}

function addWord() {
    const string = document.getElementById("stringInput").value.trim();

    if (!string) {
        showFlashMessage('error', "Please enter a string.");
        return;
    }

    fetch("/add_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: string }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showFlashMessage('error', data.error);
        } else {
            showFlashMessage('success', data.message);
            document.getElementById("stringInput").value = "";
            updateGraphs();
        }
    })
    .catch(error => {
        showFlashMessage('error', "Error adding string: " + error.message);
    });
}

function removeWord(string) {
    fetch("/remove_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: string }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showFlashMessage('error', data.error);
        } else {
            showFlashMessage('success', data.message);
            document.getElementById("removeInput").value = "";
            updateGraphs();
        }
    })
    .catch(error => {
        showFlashMessage('error', "Error removing string: " + error.message);
    });
}

function minimize() {
    fetch("/minimize", {
        method: "POST",
    })
    .then(response => response.json())
    .then(data => {
        showFlashMessage('success', data.message);
        updateGraphs();
    })
    .catch(error => {
        showFlashMessage('error', "Error minimizing DAFSA: " + error.message);
    });
}

function resetDafsa() {
    fetch("/reset", {
        method: "POST",
    })
    .then(response => response.json())
    .then(data => {
        showFlashMessage('success', data.message);
        renderGraph({ nodes: [], edges: [] }, "originalGraph");
        renderGraph({ nodes: [], edges: [] }, "minimizedGraph");
    })
    .catch(error => {
        showFlashMessage('error', "Error resetting DAFSA: " + error.message);
    });
}

function resetLayout() {
    showFlashMessage('success', "Layout has been reset.");

    for (const containerId in cyInstances) {
        const cy = cyInstances[containerId];
        cy.layout({
            name: "dagre",
            rankDir: "TB",
            nodeDimensionsIncludeLabels: true,
            rankSep: 100, 
            edgeSep: 80, 
            ranker: "network-simplex",
            animate: true,
            animationDuration: 1000,
        }).run();
    }
}

function searchWord() {
    const string = document.getElementById("searchInput").value.trim();

    if (!string) {
        showFlashMessage('error', "Please enter a string to search.");
        return;
    }

    fetch("/search_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: string }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showFlashMessage('error', data.error);
        } else if (data.exists) {
            showFlashMessage('success', "String found in DAFSA.");
            highlightNode(data.nodeId);
        } else {
            showFlashMessage('error', "String not found in DAFSA.");
        }
    })
    .catch(error => {
        showFlashMessage('error', "Error searching for string: " + error.message);
    });
}

function highlightNode(nodeId) {
    let found = false;

    for (const containerId in cyInstances) {
        const cy = cyInstances[containerId];
        const node = cy.getElementById(nodeId);
        if (node && node.length > 0) {
            cy.elements().removeClass('highlighted');
            node.addClass('highlighted');
            cy.animate({
                center: { eles: node },
                zoom: 1.5
            }, { duration: 1000 });
            found = true;
        }
    }

    if (!found) {
        showFlashMessage('error', "Node not found.");
    }
}

function updateGraphs() {
    fetch("/get_graph_data")
    .then(response => response.json())
    .then(data => {
        renderGraph(data, "originalGraph");
    })
    .catch(error => {
        showFlashMessage('error', "Error fetching original graph data.");
    });

    fetch("/get_minimized_graph_data")
    .then(response => response.json())
    .then(data => {
        renderGraph(data, "minimizedGraph");
    })
    .catch(error => {
        showFlashMessage('error', "Error fetching minimized graph data.");
    });
}

function renderGraph(graphData, containerId) {
    const elements = graphData.nodes.concat(graphData.edges);

    if (cyInstances[containerId]) {
        cyInstances[containerId].destroy();
    }

    const cy = cytoscape({
        container: document.getElementById(containerId),
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    label: 'data(label)',
                    'background-color': '#8B5CF6', 
                    width: '60px', 
                    height: '60px', 
                    'text-valign': 'center',
                    'text-halign': 'center',
                    color: '#fff',
                    'font-size': '16px',
                    'border-width': 2,
                    'border-color': '#C4B5FD', 
                    shape: 'ellipse',
                },
            },
            {
                selector: 'node[is_final = "true"]',
                style: {
                    'background-color': '#EC4899', 
                    'border-color': '#F472B6', 
                    'border-width': 4,
                },
            },
            {
                selector: 'edge',
                style: {
                    label: 'data(label)',
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#D1D5DB', 
                    'line-color': '#D1D5DB', 
                    width: 4, 
                    'font-size': '14px', 
                    color: '#E5E7EB', 
                },
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#FF0000', 
                    'border-color': '#FF0000',
                    'border-width': 6,
                },
            },
        ],
        layout: {
            name: 'dagre',
            rankDir: 'TB',
            nodeDimensionsIncludeLabels: true,
            rankSep: 100, 
            edgeSep: 80,  
            ranker: 'network-simplex',
            animate: true,
            animationDuration: 1000,
        },
        boxSelectionEnabled: false,
        autounselectify: true,
    });

    cyInstances[containerId] = cy;

    cy.elements().removeClass('highlighted');

    cy.fit();

    cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        node.style({
            'background-color': '#7C3AED', 
            'border-color': '#A78BFA', 
        });
    });

    cy.on('mouseout', 'node', (event) => {
        const node = event.target;
        node.style({
            'background-color': node.data('is_final') === "true" ? '#EC4899' : '#8B5CF6',
            'border-color': node.data('is_final') === "true" ? '#F472B6' : '#C4B5FD',
        });
    });

    cy.on('mouseover', 'edge', (event) => {
        const edge = event.target;
        edge.style({
            'line-color': '#A78BFA',
            'target-arrow-color': '#A78BFA',
        });
    });

    cy.on('mouseout', 'edge', (event) => {
        const edge = event.target;
        edge.style({
            'line-color': '#D1D5DB',
            'target-arrow-color': '#D1D5DB',
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateGraphs();
});
