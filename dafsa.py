class Node:
    id_counter = 0

    def __init__(self, is_final=False):
        self.is_final = is_final
        self.transitions = {}  
        Node.id_counter += 1
        self.id = f"Q{Node.id_counter}"

    def __eq__(self, other):
        if self.is_final != other.is_final:
            return False
        if len(self.transitions) != len(other.transitions):
            return False
        for char in self.transitions:
            if char not in other.transitions:
                return False
            if self.transitions[char] != other.transitions[char]:
                return False
        return True

    def __hash__(self):
        transitions_hash = tuple(sorted((char, id(child)) for char, child in self.transitions.items()))
        return hash((self.is_final, transitions_hash))

class DAFSA:
    def __init__(self):
        Node.id_counter = 0  
        self.root = Node()
        self.register = {}

    def add(self, word):
        node = self.root
        for char in word:
            if char not in node.transitions:
                node.transitions[char] = Node()
            node = node.transitions[char]
        node.is_final = True

    def minimize(self):
        self.register = {}
        self.root = self._minimize(self.root)

    def _minimize(self, node):
        for char in list(node.transitions.keys()):
            child = self._minimize(node.transitions[char])
            node.transitions[char] = child
        key = (node.is_final, tuple(sorted(node.transitions.items())))
        if key in self.register:
            return self.register[key]
        else:
            self.register[key] = node
            return node

    def get_graph_data(self):
        nodes = []
        edges = []
        visited = set()
        queue = [self.root]

        while queue:
            current_node = queue.pop(0)
            if current_node.id in visited:
                continue
            visited.add(current_node.id)
            nodes.append({
                'data': {
                    'id': current_node.id,
                    'label': current_node.id,
                    'is_final': current_node.is_final
                }
            })
            for char, child in current_node.transitions.items():
                edges.append({
                    'data': {
                        'source': current_node.id,
                        'target': child.id,
                        'label': char
                    }
                })
                queue.append(child)

        return {'nodes': nodes, 'edges': edges}

    def search(self, word):
        node = self.root
        for char in word:
            if char in node.transitions:
                node = node.transitions[char]
            else:
                return False
        return node.is_final
