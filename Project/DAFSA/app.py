from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

class DAFSANode:
    def __init__(self, label, char=""):
        self.is_final = False
        self.transitions = {}
        self.label = label 
        self.char = char


class DAFSA:
    def __init__(self):
        self.root = DAFSANode("")  
        self.nodes = {self.root.label: self.root}  
        self.edges = []

    def add(self, word):
        node = self.root
        prefix = ""
        for char in word:
            prefix += char
            if prefix not in node.transitions:
                new_node = DAFSANode(prefix, char)
                node.transitions[prefix] = new_node
                self.nodes[prefix] = new_node
                self.edges.append((node.label, prefix, char))
            node = node.transitions[prefix]
        node.is_final = True

    def get_graph_data(self):
        nodes = [{"id": label, "char": node.char, "is_final": node.is_final} for label, node in self.nodes.items()]
        return nodes, self.edges

    def accepts(self, word):
        node = self.root
        path = [node.label]
        prefix = ""
        for char in word:
            prefix += char
            if prefix not in node.transitions:
                return False, []
            node = node.transitions[prefix]
            path.append(node.label)
        return node.is_final, path

    def minimize(self):

        equivalent_classes = {}
        for node_label, node in self.nodes.items():
            key = (frozenset((char, target) for char, target in node.transitions.items()), node.is_final)
            if key not in equivalent_classes:
                equivalent_classes[key] = []
            equivalent_classes[key].append(node_label)

        minimized = DAFSA()
        mapping = {}

        for key, group in equivalent_classes.items():
            representative = group[0]
            merged_char = "".join(self.nodes[label].char for label in group)
            mapping.update({label: representative for label in group})
            minimized.nodes[representative] = DAFSANode(representative, merged_char)
            minimized.nodes[representative].is_final = any(self.nodes[label].is_final for label in group)

        # Add edges minimized 
        for edge in self.edges:
            from_node, to_node, char = edge
            minimized_from = mapping[from_node]
            minimized_to = mapping[to_node]
            if (minimized_from, minimized_to, char) not in minimized.edges:
                minimized.edges.append((minimized_from, minimized_to, char))

        return minimized


dafsa = DAFSA()


@app.route("/")
def index():
    return render_template("index.html")  


@app.route("/add_word", methods=["POST"])
def add_word():
    word = request.json.get("word")
    if word:
        dafsa.add(word)
        return jsonify({"message": f"'{word}' added to DAFSA."})
    return jsonify({"error": "Word is required."}), 400


@app.route("/check_word", methods=["POST"])
def check_word():
    word = request.json.get("word")
    if word:
        accepted, path = dafsa.accepts(word)
        return jsonify({"accepted": accepted, "path": path})
    return jsonify({"error": "Word is required."}), 400


@app.route("/graph")
def graph():
    nodes, edges = dafsa.get_graph_data()
    minimized_dafsa = dafsa.minimize()
    min_nodes, min_edges = minimized_dafsa.get_graph_data()
    return jsonify({
        "original": {"nodes": nodes, "edges": edges},
        "minimized": {"nodes": min_nodes, "edges": min_edges}
    })


if __name__ == "__main__":
    app.run(debug=True)
