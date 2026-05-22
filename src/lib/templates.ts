import type { TemplateSnippet } from "./types";

export const templates: TemplateSnippet[] = [
  {
    id: "load-csv",
    title: "Load CSV with pandas",
    category: "Data Prep",
    code: `import pandas as pd

df = pd.read_csv("sample_project/datasets/iris.csv")
df.head()`
  },
  {
    id: "missing-values",
    title: "Clean missing values",
    category: "Data Prep",
    code: `numeric_columns = df.select_dtypes(include="number").columns
categorical_columns = df.select_dtypes(exclude="number").columns
df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())
for column in categorical_columns:
    df[column] = df[column].fillna(df[column].mode().iloc[0])
df.isna().sum()`
  },
  {
    id: "encode-categorical",
    title: "Encode categorical columns",
    category: "Data Prep",
    code: `from sklearn.preprocessing import OneHotEncoder

categorical_columns = df.select_dtypes(exclude="number").columns.tolist()
encoded = pd.get_dummies(df, columns=categorical_columns, drop_first=True)
encoded.head()`
  },
  {
    id: "split",
    title: "Train/test split",
    category: "Classical ML",
    code: `from sklearn.model_selection import train_test_split

features = ["sepal_length", "sepal_width"]
target = "species"
X_train, X_test, y_train, y_test = train_test_split(
    df[features], df[target], test_size=0.25, random_state=42, stratify=df[target]
)`
  },
  {
    id: "logistic",
    title: "Logistic Regression classifier",
    category: "Classical ML",
    code: `from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=500)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
model.score(X_test, y_test)`
  },
  {
    id: "random-forest",
    title: "Random Forest classifier",
    category: "Classical ML",
    code: `from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
model.score(X_test, y_test)`
  },
  {
    id: "svm",
    title: "SVM classifier",
    category: "Classical ML",
    code: `from sklearn.svm import SVC

model = SVC(kernel="rbf", probability=True)
model.fit(X_train, y_train)
predictions = model.predict(X_test)`
  },
  {
    id: "knn",
    title: "KNN classifier",
    category: "Classical ML",
    code: `from sklearn.neighbors import KNeighborsClassifier

model = KNeighborsClassifier(n_neighbors=5)
model.fit(X_train, y_train)
predictions = model.predict(X_test)`
  },
  {
    id: "gb",
    title: "Gradient Boosting classifier",
    category: "Classical ML",
    code: `from sklearn.ensemble import GradientBoostingClassifier

model = GradientBoostingClassifier(random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)`
  },
  {
    id: "xgb-placeholder",
    title: "XGBoost placeholder if installed",
    category: "Classical ML",
    code: `try:
    from xgboost import XGBClassifier
    model = XGBClassifier(eval_metric="mlogloss")
    model.fit(X_train, y_train)
except ImportError:
    print("Install optional extra: pip install xgboost")`
  },
  {
    id: "lgbm-placeholder",
    title: "LightGBM placeholder if installed",
    category: "Classical ML",
    code: `try:
    from lightgbm import LGBMClassifier
    model = LGBMClassifier()
    model.fit(X_train, y_train)
except ImportError:
    print("Install optional extra: pip install lightgbm")`
  },
  {
    id: "regression",
    title: "Regression template",
    category: "Classical ML",
    code: `from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

regressor = LinearRegression()
regressor.fit(X_train, y_train)
r2_score(y_test, regressor.predict(X_test))`
  },
  {
    id: "kmeans",
    title: "Clustering template with KMeans",
    category: "Classical ML",
    code: `from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42, n_init="auto")
clusters = kmeans.fit_predict(df.select_dtypes(include="number"))
clusters[:10]`
  },
  {
    id: "pca",
    title: "PCA visualization template",
    category: "Visualization",
    code: `from sklearn.decomposition import PCA
import plotly.express as px

numeric = df.select_dtypes(include="number")
pca = PCA(n_components=2)
coords = pca.fit_transform(numeric)
pca_df = pd.DataFrame(coords, columns=["pc1", "pc2"])
pca_df["species"] = df["species"]
px.scatter(pca_df, x="pc1", y="pc2", color="species")`
  },
  {
    id: "confusion",
    title: "Confusion matrix template",
    category: "Visualization",
    code: `from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix
import matplotlib.pyplot as plt

cm = confusion_matrix(y_test, predictions)
ConfusionMatrixDisplay(cm, display_labels=model.classes_).plot(cmap="viridis")
plt.title("Confusion matrix")`
  },
  {
    id: "report",
    title: "Classification report template",
    category: "Classical ML",
    code: `from sklearn.metrics import classification_report

print(classification_report(y_test, predictions))`
  },
  {
    id: "roc",
    title: "ROC curve template",
    category: "Visualization",
    code: `from sklearn.metrics import RocCurveDisplay

RocCurveDisplay.from_estimator(model, X_test, y_test)`
  },
  {
    id: "precision-recall",
    title: "Precision-recall curve template",
    category: "Visualization",
    code: `from sklearn.metrics import PrecisionRecallDisplay

PrecisionRecallDisplay.from_estimator(model, X_test, y_test)`
  },
  {
    id: "importance",
    title: "Feature importance template",
    category: "Visualization",
    code: `import pandas as pd

if hasattr(model, "feature_importances_"):
    pd.Series(model.feature_importances_, index=features).sort_values().plot(kind="barh")
elif hasattr(model, "coef_"):
    pd.Series(model.coef_[0], index=features).sort_values().plot(kind="barh")
else:
    print("This model does not expose feature importances.")`
  },
  {
    id: "save-model",
    title: "Save model with joblib",
    category: "Classical ML",
    code: `import joblib

joblib.dump(model, "sample_project/models/iris_model.joblib")`
  },
  {
    id: "load-model",
    title: "Load model and predict",
    category: "Classical ML",
    code: `import joblib

loaded_model = joblib.load("sample_project/models/iris_model.joblib")
loaded_model.predict(X_test.head())`
  },
  {
    id: "torch-device",
    title: "Device detection: CPU/CUDA/MPS",
    category: "Deep Learning",
    code: `import torch

device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu"))
device`
  },
  {
    id: "torch-mlp-classifier",
    title: "Simple PyTorch MLP classifier",
    category: "Deep Learning",
    code: `import torch
from torch import nn

class MLPClassifier(nn.Module):
    def __init__(self, input_size=4, hidden_size=16, output_size=3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_size, output_size)
        )

    def forward(self, x):
        return self.net(x)

torch_model = MLPClassifier()
torch_model`
  },
  {
    id: "torch-regressor",
    title: "PyTorch MLP regressor",
    category: "Deep Learning",
    code: `import torch
from torch import nn

regressor = nn.Sequential(
    nn.Linear(4, 16),
    nn.ReLU(),
    nn.Linear(16, 1)
)`
  },
  {
    id: "torch-binary",
    title: "Binary classification neural network",
    category: "Deep Learning",
    code: `binary_model = nn.Sequential(
    nn.Linear(2, 8),
    nn.ReLU(),
    nn.Linear(8, 1),
    nn.Sigmoid()
)`
  },
  {
    id: "torch-multiclass",
    title: "Multiclass classification neural network",
    category: "Deep Learning",
    code: `multiclass_model = nn.Sequential(
    nn.Linear(4, 16),
    nn.ReLU(),
    nn.Linear(16, 3)
)`
  },
  {
    id: "torch-cnn",
    title: "Image classification CNN",
    category: "Deep Learning",
    code: `class SmallCNN(nn.Module):
    def __init__(self, classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(16 * 16 * 16, classes)
        )

    def forward(self, x):
        return self.classifier(self.features(x))`
  },
  {
    id: "transfer",
    title: "Transfer learning with torchvision models",
    category: "Deep Learning",
    code: `try:
    from torchvision import models
    model = models.resnet18(weights="DEFAULT")
    model.fc = nn.Linear(model.fc.in_features, 3)
except ImportError:
    print("Install optional extras: pip install torch torchvision torchaudio")`
  },
  {
    id: "autoencoder",
    title: "Autoencoder",
    category: "Deep Learning",
    code: `autoencoder = nn.Sequential(
    nn.Linear(4, 2),
    nn.ReLU(),
    nn.Linear(2, 4)
)`
  },
  {
    id: "lstm",
    title: "Basic RNN/LSTM for sequences",
    category: "Deep Learning",
    code: `lstm = nn.LSTM(input_size=8, hidden_size=16, batch_first=True)`
  },
  {
    id: "transformer",
    title: "Transformer classifier skeleton",
    category: "Deep Learning",
    code: `encoder_layer = nn.TransformerEncoderLayer(d_model=32, nhead=4, batch_first=True)
transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)`
  },
  {
    id: "dataset-loader",
    title: "Custom Dataset/DataLoader template",
    category: "Deep Learning",
    code: `from torch.utils.data import Dataset, DataLoader

class TabularDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.long)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, index):
        return self.X[index], self.y[index]`
  },
  {
    id: "training-loop",
    title: "Training loop template",
    category: "Deep Learning",
    code: `for epoch in range(epochs):
    model.train()
    for xb, yb in train_loader:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()
        loss = loss_fn(model(xb), yb)
        loss.backward()
        optimizer.step()`
  },
  {
    id: "eval-loop",
    title: "Evaluation loop template",
    category: "Deep Learning",
    code: `model.eval()
predictions = []
with torch.no_grad():
    for xb, _ in test_loader:
        logits = model(xb.to(device))
        predictions.extend(logits.argmax(dim=1).cpu().tolist())`
  },
  {
    id: "torch-save",
    title: "Save/load PyTorch model",
    category: "Deep Learning",
    code: `torch.save({"model_state": model.state_dict()}, "sample_project/models/model.pt")
checkpoint = torch.load("sample_project/models/model.pt", map_location=device)
model.load_state_dict(checkpoint["model_state"])`
  },
  {
    id: "plot-training",
    title: "Plot training curves",
    category: "Deep Learning",
    code: `import plotly.express as px

history_df = pd.DataFrame(history)
px.line(history_df, x="epoch", y=["train_loss", "val_loss"], title="Training curves")`
  },
  {
    id: "torch-cm",
    title: "Confusion matrix for PyTorch",
    category: "Deep Learning",
    code: `from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix

cm = confusion_matrix(y_true, y_pred)
ConfusionMatrixDisplay(cm).plot()`
  },
  {
    id: "early-stopping",
    title: "Early stopping",
    category: "Deep Learning",
    code: `best_loss = float("inf")
patience = 5
bad_epochs = 0
if val_loss < best_loss:
    best_loss = val_loss
    bad_epochs = 0
else:
    bad_epochs += 1
    if bad_epochs >= patience:
        print("Stopping early")`
  },
  {
    id: "scheduler",
    title: "Learning rate scheduler",
    category: "Deep Learning",
    code: `scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", patience=3)
scheduler.step(val_loss)`
  },
  {
    id: "mixed-precision",
    title: "Mixed precision placeholder",
    category: "Deep Learning",
    code: `# Mixed precision is CUDA-specific and optional.
scaler = torch.cuda.amp.GradScaler(enabled=torch.cuda.is_available())`
  }
];
