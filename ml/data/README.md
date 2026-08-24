# UCI Online Retail II Dataset Directory

This directory contains the historical retail transaction dataset used for training the ML models.

### Dataset Overview
- **Dataset Name**: UCI Online Retail II Data Set
- **Source**: UCI Machine Learning Repository
- **Expected File**: `online_retail_II.xlsx`
- **Expected Path**: `ml/data/online_retail_II.xlsx`

### Setup Instructions
1. Download `online_retail_II.xlsx` from the UCI Machine Learning Repository or project source archives.
2. Place `online_retail_II.xlsx` in this `ml/data/` directory.
3. Run ingestion and feature engineering:
   ```bash
   python ml/preprocessing/ingest_dataset.py
   python ml/features/build_rfm_features.py
   ```
4. Train models:
   ```bash
   python ml/segmentation/train_kmeans.py
   python ml/prediction/train_propensity.py
   python ml/recommendation/train_recommendations.py
   ```
