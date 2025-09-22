# 🏦 Validador OCR de Transferencias Bancarias

## 📋 Descripción General

Aplicación Python que utiliza **EasyOCR** y **Flask** para extraer,
procesar y servir información de comprobantes de transferencias
bancarias (ej. Bancolombia).\
Permite integrar la extracción OCR a través de una API REST.

------------------------------------------------------------------------

## 🚀 Características

-   OCR en español con **EasyOCR**.
-   Limpieza y normalización de texto OCR.
-   Extracción automática de:
    -   **Comprobante**
    -   **Fecha y hora**
    -   **Valor de la transacción**
    -   **Producto origen y destino**
-   Generación automática de **CSV** con resultados.
-   API REST con **Flask** para procesar carpetas de imágenes.
-   Soporte **CORS** para integración con aplicaciones web.

------------------------------------------------------------------------

## 📂 Estructura del Proyecto

    .
    ├── api.py                   # Servidor Flask y endpoints
    ├── payment_validator_app.py  # Lógica OCR y parsers
    ├── resultados.csv            # Export de resultados procesados

------------------------------------------------------------------------

## 🔧 Instalación

### 📋 Prerrequisitos

-   Python 3.8+
-   pip
-   git (opcional)

### 📦 Instalación de dependencias

``` bash
# 1. Clonar repositorio
git clone <repo-url>
cd proyecto-ocr

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# 3. Instalar dependencias
pip install flask flask-cors easyocr pillow spacy scikit-learn pandas
```

------------------------------------------------------------------------

## ▶️ Ejecución

``` bash
# Levantar servidor Flask
python api.py
```

Servidor disponible en:\
👉 `http://localhost:5000`

------------------------------------------------------------------------

## 🌐 Endpoints API

### **POST /process_path**

Procesa todas las imágenes dentro de la carpeta indicada.

**Request**:

``` json
{ "path": "D:/carpeta/con/comprobantes/" }
```

**Response**:

``` json
[
  {
    "comprobante": "95123",
    "fecha": "2024-02-29 12:16",
    "valor": 1433000,
    "producto_origen": { "tipo": "ahorros", "cuenta": "377-000223" },
    "producto_destino": { "nombre": "pyphs", "tipo": "corriente", "cuenta": "543-478177" },
    "image": "ruta/imagen.jpeg"
  }
]
```

------------------------------------------------------------------------

### **GET /get_image/`<filename>`{=html}**

Devuelve la imagen solicitada desde la carpeta base.

------------------------------------------------------------------------

## 📊 Resultados

-   Exporta automáticamente un archivo **`resultados.csv`** con los
    datos procesados.

------------------------------------------------------------------------

## 🛠 Tecnologías Utilizadas

-   **Python 3.8+**
-   **Flask** (API REST)
-   **Flask-CORS**
-   **EasyOCR**
-   **Pillow**
-   **spaCy**
-   **scikit-learn**
-   **pandas**

------------------------------------------------------------------------

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
