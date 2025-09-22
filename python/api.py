from flask import Flask, request, jsonify, send_from_directory
from payment_validator_app import process_data_complete
from flask_cors import CORS   # 👈 importar

import os

app = Flask(__name__)
CORS(app)  

@app.route('/get_image/<path:filename>', methods=['GET'])
def serve_image(filename):
    # Devuelve la imagen desde la carpeta base
    return send_from_directory(BASE_FOLDER, filename)

@app.route('/process_path', methods=['POST'])
def process():
    data = request.get_json()

    if not data or "path" not in data:
        return jsonify({"error": "Falta el parámetro 'path'"}), 400

    path = data["path"]

    try:
        result = process_data_complete(path)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
