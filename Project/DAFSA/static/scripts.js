async function showModal(message) {
    const modal = document.getElementById("modal");
    const modalMessage = document.getElementById("modalMessage");
    modalMessage.innerHTML = message; // Display message as HTML (e.g., icon)
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

async function addWord() {
    const word = document.getElementById("addWordInput").value;
    const response = await fetch("/add_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
    });
    const result = await response.json();
    showModal(result.message || result.error);
    updateGraphs();
}

async function checkWord() {
    const word = document.getElementById("checkWordInput").value;
    const response = await fetch("/check_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
    });
    const result = await response.json();

    const resultIcon = document.getElementById("resultIcon");
    const successSound = document.getElementById("success-sound");

    if (result.accepted) {
        // Display the true icon (check mark)
        resultIcon.innerHTML = "✔"; // Use check mark for success
        resultIcon.classList.add("visible");
        resultIcon.style.color = "green";

        // Play success sound
        successSound.play();

        // Show check icon in modal as well
        showModal("<span style='color: green;'>✔</span>"); // Green check mark in modal
    } else {
        // Display a cross icon
        resultIcon.innerHTML = "✖"; // Use cross for failure
        resultIcon.classList.add("visible");
        resultIcon.style.color = "red";

        // Show cross icon in modal
        showModal("<span style='color: red;'>✖</span>"); // Red cross in modal
    }

    // Remove the icon after 3 seconds
    setTimeout(() => {
        resultIcon.classList.remove("visible");
    }, 3000);
}

async function updateGraphs() {
    const response = await fetch("/graph");
    const data = await response.json();

    renderGraph("originalGraph", data.original);
    renderGraph("minimizedGraph", data.minimized);
}

function renderGraph(svgId, graphData) {
    const svg = d3.select(`#${svgId}`);
    svg.selectAll("*").remove();

    const nodes = graphData.nodes.map((d, i) => ({
        id: d.id,
        char: d.char,
        x: Math.random() * 500,
        y: Math.random() * 300,
        isFinal: d.is_final,
    }));

    const links = graphData.edges.map(d => ({
        source: d[0],
        target: d[1],
        label: d[2],
    }));

    // Draw links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("x1", d => nodes.find(n => n.id === d.source).x)
        .attr("y1", d => nodes.find(n => n.id === d.source).y)
        .attr("x2", d => nodes.find(n => n.id === d.target).x)
        .attr("y2", d => nodes.find(n => n.id === d.target).y)
        .attr("stroke", "black");

    // Draw nodes
    svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 10)
        .attr("fill", d => (d.isFinal ? "green" : "blue"));

    // Add labels
    svg.selectAll(".text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x + 12)
        .attr("y", d => d.y + 4)
        .text(d => d.char);
}

updateGraphs();
