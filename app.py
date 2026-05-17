from flask import Flask, request, jsonify
import numpy as np
import base64
import io
import os
import time
from PIL import Image

app = Flask(__name__)

# No CORS needed because Vite proxy handles it!

# Class accuracies from ResNet model
CLASS_ACCURACIES = {
    "Achnanthidium jackii": 0.6974,
    "Achnanthidium minutissimum": 0.5856,
    "Amphora pediculus": 0.9500,
    "Cocconeis placentula": 0.9836,
    "Discostella pseudostelligera": 0.9773,
    "Navicula gregaria": 0.9204,
    "Navicula lanceolata": 0.9868,
    "Nitzschia dissipata": 0.9392,
    "Nitzschia soratensis": 0.9367,
    "Planothidium lanceolatum": 0.9743,
}

DIATOM_INFO = {
    "Achnanthidium jackii": {
        "advantages": [
            "Excellent bioindicator for clean, oligotrophic freshwater systems",
            "Sensitive to pollution — used in water quality indices (IPS, TDI)",
            "Helps detect subtle increases in nutrient loading early",
            "Key reference species in paleolimnological reconstructions",
        ],
        "lab_methods": [
            "Light microscopy with phase contrast (striae visibility ~25 striae/10µm)",
            "Scanning Electron Microscopy (SEM) to confirm raphe system details",
            "Acid cleaning with H₂O₂ + HCl to remove organic matter before mounting",
            "Naphrax or Pleurax mounting medium (RI > 1.7) for optimal resolution",
        ],
        "habitat": "Cold, fast-flowing, oligotrophic streams",
        "ecology": "Oligotraphentic — thrives in ultra-clean water",
    },
    "Achnanthidium minutissimum": {
        "advantages": [
            "One of the most widely studied freshwater diatoms globally",
            "Robust pollution tolerance indicator across a gradient of conditions",
            "Used in EU Water Framework Directive bioassessment",
            "Model organism for diatom biofilm and adhesion research",
        ],
        "lab_methods": [
            "Phase contrast light microscopy (30–35 striae/10µm)",
            "SEM for raphe and stauros morphology confirmation",
            "Permanent slides with Naphrax mounting medium (RI ~1.74)",
            "Immunofluorescence labeling for biofilm EPS studies",
        ],
        "habitat": "Ubiquitous — streams, lakes, wetlands worldwide",
        "ecology": "Eurytopic — tolerates wide range of conditions",
    },
    "Amphora pediculus": {
        "advantages": [
            "Strong indicator of mesotrophic to eutrophic conditions",
            "Useful in benthic diatom indices for river monitoring",
            "Distinguishable half-valve structure aids morphological training",
            "Tolerant of organic enrichment — valuable in wastewater studies",
        ],
        "lab_methods": [
            "Brightfield microscopy — half-valve visible in girdle view",
            "SEM to resolve fibulae and raphe slit detail",
            "Acid digestion (HNO₃) for clean frustule preparation",
            "Settling chamber technique for quantitative analysis",
        ],
        "habitat": "Benthic in rivers, lakes, and brackish waters",
        "ecology": "Meso-eutraphentic, pollution tolerant",
    },
    "Cocconeis placentula": {
        "advantages": [
            "Highly reliable water quality indicator — tolerates moderate pollution",
            "Distinctive biraphid/monoraphid valve pair simplifies identification",
            "Common in periphyton — ideal for training and reference collections",
            "Epiphytic habit useful for macrophyte-associated bioassessment",
        ],
        "lab_methods": [
            "Brightfield or DIC microscopy — ornamentation clear at 1000×",
            "SEM reveals hymen structure in areolae",
            "Soft digestion with H₂O₂ recommended to preserve delicate ornamentation",
            "Voucher slide preparation per CEN standard EN 13946",
        ],
        "habitat": "Epiphytic on aquatic macrophytes and submerged surfaces",
        "ecology": "β-mesosaprobous, tolerates moderate nutrient enrichment",
    },
    "Discostella pseudostelligera": {
        "advantages": [
            "Key paleolimnological indicator — preserved excellently in lake sediments",
            "Signals thermal stratification and phosphorus dynamics in lakes",
            "Centric morphology aids automated image recognition research",
            "Used in climate reconstruction studies (lake sediment cores)",
        ],
        "lab_methods": [
            "DIC microscopy essential for fultoportula and rimoportula identification",
            "SEM for central area process confirmation",
            "Heavy liquid separation (SPT) to concentrate centric diatoms",
            "Freeze-drying samples before mounting preserves 3D frustule structure",
        ],
        "habitat": "Planktonic in deep, stratified lakes",
        "ecology": "Indicator of warm, stratified, oligotrophic lake conditions",
    },
    "Navicula gregaria": {
        "advantages": [
            "Broad salinity tolerance — valuable in estuarine biomonitoring",
            "Reliable indicator of elevated conductivity and organic enrichment",
            "High abundance facilitates statistical confidence in indices",
            "Used in saprobic and trophic diatom indices across Europe",
        ],
        "lab_methods": [
            "DIC or phase contrast at 1000× oil immersion for striae resolution",
            "SEM confirms proximal raphe end shape and areolae structure",
            "Standard acid digestion + Naphrax mounting",
            "Lugol's iodine for live cell identification in field samples",
        ],
        "habitat": "Benthic in rivers, brackish waters, and disturbed habitats",
        "ecology": "α-mesosaprobous to polysaprobous",
    },
    "Navicula lanceolata": {
        "advantages": [
            "Reliable indicator of eutrophic and organically enriched conditions",
            "Large size (30–60µm) makes it easy to identify by novice microscopists",
            "Frequently used in teaching collections and morphology training",
            "Useful in sediment records of historic nutrient pollution",
        ],
        "lab_methods": [
            "Brightfield microscopy sufficient at 400× for preliminary ID",
            "DIC at 1000× for striae density confirmation (8–12/10µm)",
            "SEM for proximal and distal raphe end morphology",
            "Acid cleaning with KMnO₄ + HCl for very siliceous frustules",
        ],
        "habitat": "Benthic in eutrophic rivers and lakes",
        "ecology": "Eutraphentic — thrives under high nutrient conditions",
    },
    "Nitzschia dissipata": {
        "advantages": [
            "Strong indicator of high conductivity and organic enrichment",
            "Fibulae pattern allows rapid genus-level identification",
            "Widely used in saprobity and IPS water quality indices",
            "Cosmopolitan distribution — useful in global comparison studies",
        ],
        "lab_methods": [
            "Phase contrast microscopy — fibulae clearly visible in valve view",
            "SEM to confirm raphe canal and poroids",
            "Standard H₂O₂ + HCl acid preparation",
            "Quantitative Lugol-fixed samples for community analysis",
        ],
        "habitat": "Benthic in nutrient-rich rivers and lakes",
        "ecology": "β- to α-mesosaprobous, eutraphentic",
    },
    "Nitzschia soratensis": {
        "advantages": [
            "Newly described species — valuable for understanding Nitzschia diversity",
            "Indicator of specific conductivity and ion composition regimes",
            "Contributes to understanding biogeographic patterns in diatoms",
            "Important for refining water quality classification in mountain streams",
        ],
        "lab_methods": [
            "SEM essential — close morphological similarity to N. dissipata requires fine detail",
            "Fibulae spacing (5–7/10µm) confirmation by DIC microscopy",
            "Molecular barcoding (rbcL gene) recommended to confirm species identity",
            "Permanent Naphrax slides essential for voucher documentation",
        ],
        "habitat": "Mountain streams and springs in central Europe",
        "ecology": "Indicator of clean to moderately impacted waters",
    },
    "Planothidium lanceolatum": {
        "advantages": [
            "Reliable indicator of slightly acidic to circumneutral pH conditions",
            "Distinctive horseshoe-shaped central area aids rapid identification",
            "Common in epilithic and epipsammic communities in rivers",
            "Useful reference taxon in long-term monitoring datasets",
        ],
        "lab_methods": [
            "DIC microscopy at 1000× — horseshoe marking diagnostic in rapheless valve",
            "SEM to resolve areolae and raphe detail on raphid valve",
            "Gentle H₂O₂ preparation recommended to preserve fine structures",
            "Permanent slides per standard protocols (ISO 10260)",
        ],
        "habitat": "Epilithic in streams and rivers with moderate current",
        "ecology": "Circumneutral pH preference, mesotraphentic",
    },
}

# Model loading
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    
    MODEL_PATH = "diatom_model.keras"
    model = None
    
    # CRITICAL: Your model was trained on 128x128 images
    IMG_SIZE = (128, 128)
    
    if os.path.exists(MODEL_PATH):
        print(f"📦 Loading model from {MODEL_PATH}...")
        model = load_model(MODEL_PATH)
        print(f"✅ Model loaded successfully!")
        print(f"   Input shape: {model.input_shape}")
        print(f"   Image size: {IMG_SIZE}")
        USE_MODEL = True
    else:
        print(f"❌ Model not found at {MODEL_PATH}")
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Files found: {[f for f in os.listdir('.') if f.endswith('.keras')]}")
        USE_MODEL = False
    
    CLASS_NAMES = list(CLASS_ACCURACIES.keys())
    
    def preprocess_image(image_bytes):
        """Preprocess image for model prediction"""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(IMG_SIZE)
        arr = np.array(img) / 255.0
        return np.expand_dims(arr, axis=0)
        
except ImportError as e:
    print(f"❌ TensorFlow not available: {e}")
    USE_MODEL = False
    CLASS_NAMES = list(CLASS_ACCURACIES.keys())
    IMG_SIZE = (128, 128)
    
    def preprocess_image(image_bytes):
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(IMG_SIZE)
        arr = np.array(img) / 255.0
        return np.expand_dims(arr, axis=0)


@app.route("/predict", methods=["POST"])
def predict():
    start_time = time.time()
    
    # Check if file was uploaded
    if "file" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    image_file = request.files["file"]
    if image_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Read image
        image_bytes = image_file.read()
        
        # Limit file size (5MB max)
        if len(image_bytes) > 5 * 1024 * 1024:
            return jsonify({"error": "Image too large (max 5MB)"}), 400
        
        # Make prediction
        if USE_MODEL and model is not None:
            # Preprocess and predict
            arr = preprocess_image(image_bytes)
            predictions = model.predict(arr, verbose=0)[0]
            
            # Get top predictions
            top_indices = np.argsort(predictions)[::-1]
            top_idx = top_indices[0]
            confidence = float(predictions[top_idx])
            predicted_class = CLASS_NAMES[top_idx]
            
            # Get top 3
            top3 = []
            for i in range(min(3, len(top_indices))):
                idx = top_indices[i]
                top3.append({
                    "name": CLASS_NAMES[idx],
                    "confidence": float(predictions[idx])
                })
        else:
            # Demo mode (random predictions for testing without model)
            print("⚠️  Running in DEMO mode (random predictions)")
            random_probs = np.random.dirichlet(np.ones(len(CLASS_NAMES)) * 0.5)
            top_idx = np.argmax(random_probs)
            predicted_class = CLASS_NAMES[top_idx]
            confidence = float(random_probs[top_idx])
            top3 = [
                {"name": CLASS_NAMES[i], "confidence": float(random_probs[i])}
                for i in np.argsort(random_probs)[::-1][:3]
            ]
        
        # Get species information
        info = DIATOM_INFO.get(predicted_class, {})
        model_accuracy = CLASS_ACCURACIES.get(predicted_class, 0.0)
        
        inference_time = time.time() - start_time
        print(f"🎯 Prediction: {predicted_class} ({confidence:.3f}) - {inference_time:.2f}s")
        
        # Return response matching your React frontend
        response = {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "model_accuracy": round(model_accuracy, 4),
            "top3": [{"name": t["name"], "confidence": round(t["confidence"], 4)} for t in top3],
            "advantages": info.get("advantages", []),
            "lab_methods": info.get("lab_methods", []),
            "habitat": info.get("habitat", ""),
            "ecology": info.get("ecology", ""),
            "demo_mode": not USE_MODEL,
            "inference_time": round(inference_time, 2)
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/classes", methods=["GET"])
def get_classes():
    """Return list of all classes with their accuracies"""
    classes_list = [
        {"name": name, "accuracy": round(acc, 4)}
        for name, acc in CLASS_ACCURACIES.items()
    ]
    return jsonify(classes_list)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": USE_MODEL,
        "image_size": IMG_SIZE,
        "num_classes": len(CLASS_ACCURACIES),
        "model_path": MODEL_PATH if os.path.exists(MODEL_PATH) else None
    })


if __name__ == "__main__":
    print("=" * 60)
    print("🌊 DIATOM AI - Flask Backend")
    print("=" * 60)
    print(f"📊 Model loaded: {USE_MODEL}")
    print(f"🖼️  Image size: {IMG_SIZE}")
    print(f"🔢 Classes: {len(CLASS_ACCURACIES)}")
    print(f"🌐 Flask server: http://localhost:5000")
    print(f"🔗 React will proxy requests via Vite (port 5173)")
    print("=" * 60)
    print("\n⚠️  Make sure your React app is running on port 5173")
    print("   Start React with: npm run dev")
    print("=" * 60)
    
    # Run Flask server (no CORS needed)
    app.run(debug=True, host="localhost", port=5000, use_reloader=False, threaded=True)