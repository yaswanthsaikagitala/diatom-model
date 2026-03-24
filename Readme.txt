🔬 DiatomVision: Advanced Micro-Algae Classification
An end-to-end computer vision pipeline for the taxonomic classification of diatoms. This project leverages classical Machine Learning and Deep Learning (ResNet50) to achieve high-accuracy identification of microscopic species.
🌟 Key Features
Multi-Model Architecture: Compare performance across 6 different algorithms.
Deep Learning Integration: State-of-the-art ResNet50 for complex feature extraction.
Robust Metrics: Evaluated using Accuracy, Precision, Recall, and F1-score.
📊 Performance Analysis
The model shows exceptional performance across most species, particularly with Navicula lanceolata and Cocconeis placentula.
Species,Accuracy
Achnanthidium jackii: 0.6974
Achnanthidium minutissimum: 0.5856
Amphora pediculus: 0.9500
Cocconeis placentula: 0.9836
Discostella pseudostelligera: 0.9773
Navicula gregaria: 0.9204
Navicula lanceolata: 0.9868
Nitzschia dissipata: 0.9392
Nitzschia soratensis: 0.9367
Planothidium lanceolatum: 0.9743

Note: The lower accuracy in A. minutissimum suggests morphological similarities with other classes, providing a great opportunity for future data augmentation or fine-tuning.
🏗️ Models Compared
We implemented a comprehensive benchmark to find the best balance between speed and precision:
Classical ML: SVM, Logistic Regression, Random Forest.
Boosting Algorithms: Gradient Boosting, XGBoost.
Deep Learning: CNN (ResNet50 Architecture).\

🧪 Future Roadmap
[ ] Implement Vision Transformers (ViT) for comparison.
[ ] Expand dataset to include more rare diatom genera.
[ ] Deploy the Streamlit app via Docker.
