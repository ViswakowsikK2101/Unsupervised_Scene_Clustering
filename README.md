# 🎬 Unsupervised Scene Clustering

**Digital Video Technology — Internal Assessment Project**

A full-stack web application that automatically clusters video frames into semantically coherent scenes using unsupervised machine learning techniques.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-darkgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Abstract

This project implements an end-to-end **unsupervised scene clustering** pipeline for video analysis. Given a video file, the system extracts frames, computes visual features using both classical (color histograms) and deep learning (ResNet-50 CNN) approaches, and groups frames into clusters representing distinct scenes. The system employs three clustering algorithms — **KMeans**, **Agglomerative Clustering**, and **DBSCAN** — and evaluates results using Silhouette, Calinski-Harabasz, and Davies-Bouldin metrics.

## 🏗️ Architecture

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│    Frontend (Next.js)       │      │     Backend (FastAPI)         │
│    Deployed on: Vercel      │◄────►│     Deployed on: Render       │
│                             │      │                              │
│  • Video Upload (drag-drop) │      │  • Frame Extraction (OpenCV) │
│  • Results Dashboard        │      │  • Feature Extraction        │
│  • Cluster Gallery          │      │    - HSV Histograms          │
│  • t-SNE / PCA Plots        │      │    - ResNet-50 CNN           │
│  • Scene Timeline           │      │  • Clustering Engine         │
│  • Scan History             │      │    - KMeans                  │
│                             │      │    - Agglomerative           │
└──────────┬──────────────────┘      │    - DBSCAN                  │
           │                         │  • Evaluation Metrics        │
           ▼                         └──────────┬───────────────────┘
┌─────────────────────────────┐                 │
│    Supabase                 │◄────────────────┘
│                             │
│  • PostgreSQL (scan history)│
│  • Storage (videos, frames) │
└─────────────────────────────┘
```

## 🔬 Methodology

### 1. Frame Extraction
- Video is read using OpenCV (`cv2.VideoCapture`)
- Frames are sampled at a configurable rate (default: 1 frame/second)
- Extracted frames are stored for inspection and visualization

### 2. Feature Extraction (Two Methods)

| Method | Dimensionality | Description |
|--------|---------------|-------------|
| **Color Histogram** | 3,000 | HSV color space, 2D histogram (50 Hue × 60 Saturation bins), normalized |
| **CNN (ResNet-50)** | 2,048 | Pre-trained on ImageNet, features from avgpool layer |

### 3. Dimensionality Reduction
- **PCA** reduces features to 50 components (configurable)
- Preserves ~95%+ variance while improving clustering stability

### 4. Clustering Algorithms

| Algorithm | Key Parameters | Characteristics |
|-----------|---------------|-----------------|
| **KMeans** | `n_clusters` | Fast, interpretable, uses Elbow method for optimal K |
| **Agglomerative** | `n_clusters`, `linkage=ward` | Hierarchical, produces dendrogram |
| **DBSCAN** | `eps`, `min_samples` | Density-based, auto-detects K, identifies noise |

### 5. Evaluation Metrics

| Metric | Range | Interpretation |
|--------|-------|----------------|
| **Silhouette Score** | [-1, 1] | Higher = better cluster separation |
| **Calinski-Harabasz** | [0, ∞) | Higher = denser, well-separated clusters |
| **Davies-Bouldin** | [0, ∞) | Lower = better cluster separation |

## 📁 Project Structure

```
Digital_Video_Technology/
├── backend/                    # FastAPI backend (Python)
│   ├── ml/                     # ML pipeline modules
│   │   ├── frame_extractor.py
│   │   ├── feature_extractor.py
│   │   ├── clustering.py
│   │   ├── evaluation.py
│   │   └── pipeline.py
│   ├── api/                    # REST API routes
│   │   └── routes/
│   │       ├── video.py
│   │       └── history.py
│   ├── db/                     # Database models & migrations
│   ├── scripts/                # Dataset & training scripts
│   │   ├── download_dataset.py
│   │   └── train_model.py
│   ├── models/                 # Saved model artifacts
│   └── main.py                 # FastAPI entry point
│
├── frontend/                   # Next.js frontend (TypeScript)
│   ├── app/                    # Pages (App Router)
│   │   ├── page.tsx            # Home / Upload
│   │   ├── results/[id]/       # Results viewer
│   │   └── history/            # Scan history
│   ├── components/             # React components
│   └── lib/                    # API & Supabase helpers
│
└── supabase/
    └── migrations/             # Database schema SQL
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Download training dataset
python scripts/download_dataset.py --lite

# Train the model
python scripts/train_model.py --feature-method cnn

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and Supabase keys

# Start development server
npm run dev
```

### Database Setup

1. Create a new project on [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the SQL from `backend/db/migrations.sql`
4. Create storage buckets: `video-uploads` and `frame-thumbnails`

## 🌐 Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Set root directory to `frontend/`
4. Add environment variables in Vercel dashboard

### Backend → Render
1. Connect repo to [Render](https://render.com)
2. Create a new Web Service
3. Set root directory to `backend/`
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in Render dashboard

## 📊 Dataset

The model is trained on the **Open Video Scene Detection (OVSD)** dataset and Creative Commons short films from the Blender Foundation:

- **Big Buck Bunny** — Animated short with distinct outdoor scenes
- **Sintel** — Diverse scenes: desert, cave, snow, village
- **Tears of Steel** — Sci-fi with indoor/outdoor/VFX transitions
- **Elephants Dream** — Surreal mechanical environments
- **Cosmos Laundromat** — Surreal comedy scenes

## 📚 References

1. Baraldi, L., Grana, C., & Cucchiara, R. (2015). *A Deep Siamese Network for Scene Detection in Broadcast Videos*. ACM Multimedia.
2. Rotman, D., Porat, D., & Ashour, G. (2017). *Optimal Sequential Grouping for Robust Video Scene Detection*. IEEE TPAMI.
3. He, K., Zhang, X., Ren, S., & Sun, J. (2016). *Deep Residual Learning for Image Recognition*. CVPR.
4. Arthur, D., & Vassilvitskii, S. (2007). *k-means++: The Advantages of Careful Seeding*. SODA.

## 📄 License

This project is for academic purposes (Digital Video Technology internal assessment).
