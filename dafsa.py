class Node:
    _id_counter = 1  

    def __init__(self, is_final=False):
        self.transitions = {}
        self.is_final = is_final
        self.id = f'Q{Node._id_counter}' 
        Node._id_counter += 1

    def __eq__(self, other):
        return self.is_final == other.is_final and self.transitions == other.transitions

    def __hash__(self):
        return hash((self.is_final, frozenset(self.transitions.items())))

def clone_node(node, clones):
    if node in clones:
        return clones[node]
    new_node = Node(is_final=node.is_final)
    new_node.id = node.id  
    clones[node] = new_node
    for char, child in node.transitions.items():
        new_node.transitions[char] = clone_node(child, clones)
    return new_node

class DAFSA:
    def __init__(self):
        self.root = Node()
        self.register = {}

    def add(self, word):
        node = self.root
        for char in word:
            if char not in node.transitions:
                node.transitions[char] = Node()
            node = node.transitions[char]
        node.is_final = True

    def remove(self, word):
        """
        Remove a word from the DAFSA.
        Returns True if the word was successfully removed, False otherwise.
        """
        node = self.root
        stack = [] 

        for char in word:
            if char in node.transitions:
                parent = node
                node = node.transitions[char]
                stack.append((parent, char, node))
            else:
                return False

        if not node.is_final:
            return False

        node.is_final = False

        for parent, char, current in reversed(stack):
            if current.is_final or current.transitions:
                break  
            del parent.transitions[char]

        return True

    def minimize(self):
        self.register = {}
        self.root = self._minimize(self.root)

    def _minimize(self, node):
        for char in list(node.transitions.keys()):
            child = self._minimize(node.transitions[char])
            node.transitions[char] = child
        key = (node.is_final, frozenset(node.transitions.items()))
        if key in self.register:
            return self.register[key]
        else:
            self.register[key] = node
            return node

    def get_graph_data(self):
        nodes = []
        edges = []
        visited = set()
        queue = [(self.root, "")]  

        while queue:
            current_node, prefix = queue.pop(0)
            if current_node.id in visited:
                continue
            visited.add(current_node.id)
            label = prefix if current_node != self.root else "Start"
            nodes.append({
                'data': {
                    'id': current_node.id,  
                    'label': label,
                    'is_final': 'true' if current_node.is_final else 'false'  
                }
            })
            for char, child in current_node.transitions.items():
                child_prefix = prefix + char
                edges.append({
                    'data': {
                        'source': current_node.id,
                        'target': child.id,
                        'label': char
                    }
                })
                queue.append((child, child_prefix))

        return {'nodes': nodes, 'edges': edges}

    def search(self, word):
        node = self.root
        for char in word:
            if char in node.transitions:
                node = node.transitions[char]
            else:
                return None
        return node if node.is_final else None

    def clone(self):
        clones = {}
        new_dafsa = DAFSA()
        new_dafsa.root = clone_node(self.root, clones)
        return new_dafsa
