# Contenido mínimo de backend/app.py para probar
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return {"message": "API Autopoiesis Operativa"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)