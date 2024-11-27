let cyInstances = {};

function showFlashMessage(type, message) {
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    if (type === 'success') {
        successMessage.textContent = message;
        successMessage.classList.remove('opacity-0', 'pointer-events-none');
        successMessage.classList.add('opacity-100');

        setTimeout(() => {
            successMessage.classList.remove('opacity-100');
            successMessage.classList.add('opacity-0', 'pointer-events-none');
        }, 3000);
    } else if (type === 'error') {
        errorMessage.textContent = message;
        errorMessage.classList.remove('opacity-0', 'pointer-events-none');
        errorMessage.classList.add('opacity-100');

        setTimeout(() => {
            errorMessage.classList.remove('opacity-100');
            errorMessage.classList.add('opacity-0', 'pointer-events-none');
        }, 3000);
    }
}

function addWord() {
    const word = document.getElementById("wordInput").value.trim();
 
    if (!word) {
        showFlashMessage('error', "Please enter a word.");
        return;
    }

    fetch("/add_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showFlashMessage('error', data.error);
        } else {
            showFlashMessage('success', data.message);
            document.getElementById("wordInput").value = "";
            updateGraphs();
        }
    })
    .catch(error => {
        showFlashMessage('error', "Error adding word: " + error.message);
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
            rankSep: 70,
            edgeSep: 50,
            ranker: "network-simplex",
            fit: true,
        }).run();
    }
}

function searchWord() {
    const word = document.getElementById("searchInput").value.trim();

    if (!word) {
        showFlashMessage('error', "Please enter a word to search.");
        return;
    }

    fetch("/search_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showFlashMessage('error', data.error);
        } else if (data.exists) {
            showFlashMessage('success', "Word found in DAFSA.");
            highlightNode(data.nodeId);
        } else {
            showFlashMessage('error', "Word not found in DAFSA.");
        }
    })
    .catch(error => {
        showFlashMessage('error', "Error searching for word: " + error.message);
    });
}

function highlightNode(nodeId) {
    console.log(`Highlighting node: ${nodeId}`);
    let found = false;

    for (const containerId in cyInstances) {
        const cy = cyInstances[containerId];
        const node = cy.getElementById(nodeId);
        console.log(`Searching for node with ID: ${nodeId}`);
        if (node && node.length > 0) {
            console.log(`Node found: ${nodeId} with label: ${node.data('label')}`);
            cy.elements().unselect();
            node.select();
            node.addClass('highlighted');
            setTimeout(() => {
                node.removeClass('highlighted');
            }, 2000);
            cy.animate({
                center: { eles: node },
                zoom: 1.2
            }, { duration: 1000 });
            found = true;
        }
    }

    if (!found) {
        console.log(`Node with id ${nodeId} not found.`);
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
        console.log("Error fetching original graph data:", error);
        showFlashMessage('error', "Error fetching original graph data.");
    });

    fetch("/get_minimized_graph_data")
    .then(response => response.json())
    .then(data => {
        renderGraph(data, "minimizedGraph");
    })
    .catch(error => {
        console.log("Error fetching minimized graph data:", error);
        showFlashMessage('error', "Error fetching minimized graph data.");
    });
}

function renderGraph(graphData, containerId) {
    const elements = graphData.nodes.concat(graphData.edges);
    console.log(`Rendering graph in container: ${containerId}`);
    console.log(`Nodes:`, graphData.nodes);
    console.log(`Edges:`, graphData.edges);

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
                    width: '40px',
                    height: '40px',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    color: '#fff',
                    'font-size': '12px',
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
                selector: 'node[is_final = "false"]',
                style: {
                    'background-color': '#8B5CF6',
                    'border-color': '#C4B5FD',
                    'border-width': 2,
                },
            },
            {
                selector: 'edge',
                style: {
                    label: 'data(label)',
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    width: 2,
                    'line-color': '#D1D5DB',
                    'target-arrow-color': '#D1D5DB',
                    'font-size': '10px',
                    color: '#E5E7EB',
                },
            },
            {
                selector: '.highlighted',
                style: {
                    'border-color': '#FF0000',
                    'border-width': 8,
                },
            },
        ],
        layout: {
            name: 'dagre',
            rankDir: 'TB',
            nodeDimensionsIncludeLabels: true,
            rankSep: 70,
            edgeSep: 50, 
            ranker: 'network-simplex',
            fit: true,
        },
        boxSelectionEnabled: false,
        autounselectify: true,
    });

    cyInstances[containerId] = cy;

    cy.elements().hide();
    cy.layout({ name: 'dagre' }).run();
    cy.nodes().forEach((node, index) => {
        setTimeout(() => {
            node.show();
        }, index * 100);
    });
    cy.edges().forEach((edge, index) => {
        setTimeout(() => {
            edge.show();
        }, (cy.nodes().length + index) * 100);
    });

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
