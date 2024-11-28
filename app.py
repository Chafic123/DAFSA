from flask import Flask, render_template, request, jsonify
from dafsa import DAFSA

app = Flask(__name__)
dafsa = DAFSA()
minimized_dafsa = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_word', methods=['POST'])
def add_word():
    word = request.json.get('word')
    if word:
        dafsa.add(word)
        return jsonify({'message': f"'{word}' added to DAFSA."})
    return jsonify({'error': 'Word is required.'}), 400

@app.route('/remove_word', methods=['POST'])
def remove_word():
    word = request.json.get('word')
    if word:
        success = dafsa.remove(word)
        if success:
            return jsonify({'message': f"'{word}' removed from DAFSA."})
        else:
            return jsonify({'error': f"'{word}' not found in DAFSA."}), 404
    return jsonify({'error': 'Word is required.'}), 400

@app.route('/get_graph_data')
def get_graph_data():
    data = dafsa.get_graph_data()
    return jsonify(data)

@app.route('/get_minimized_graph_data')
def get_minimized_graph_data():
    global minimized_dafsa
    if minimized_dafsa is None:
        return jsonify({'nodes': [], 'edges': []})
    data = minimized_dafsa.get_graph_data()
    return jsonify(data)

@app.route('/minimize', methods=['POST'])
def minimize():
    global dafsa, minimized_dafsa
    minimized_dafsa = dafsa.clone()
    minimized_dafsa.minimize()
    return jsonify({'message': 'DAFSA minimized.'})

@app.route('/search_word', methods=['POST'])
def search_word():
    word = request.json.get('word')
    if word:
        node = dafsa.search(word)
        if node:
            return jsonify({'exists': True, 'nodeId': node.id})
        return jsonify({'exists': False})
    return jsonify({'error': 'Word is required.'}), 400

@app.route('/reset', methods=['POST'])
def reset():
    global dafsa, minimized_dafsa
    dafsa = DAFSA()
    minimized_dafsa = None
    return jsonify({'message': 'DAFSA has been reset.'})

if __name__ == '__main__':
    app.run(debug=True)
