# Data Preprocessing Backend (FastAPI, MVC)

## Structure

```
backend/
  app.py
  core/
    preprocessor.py
    storage.py
  routes/
    dataset_routes.py
    health_routes.py
    validation_routes.py
  controllers/
    dataset_controller.py
    validation_controller.py
  services/
    dataset_service.py
    validation_service.py
  utils/
    response_helper.py
```

## Run

```bash
pip install -r requirements.txt
python app.py
```

Server: `http://localhost:5000`

## Main APIs

- `GET /api/health`
- `POST /api/upload`
- `GET /api/dataset/{id}/status`
- `GET /api/dataset/{id}/summary`
- `GET /api/dataset/{id}/preview`
- `POST /api/dataset/{id}/refresh-random`
- `POST /api/dataset/{id}/missing-values`
- `POST /api/dataset/{id}/normalize`
- `POST /api/dataset/{id}/encode`
- `POST /api/dataset/{id}/outliers`
- `DELETE /api/dataset/{id}/duplicates`
- `GET /api/dataset/{id}/correlation`
- `GET /api/dataset/{id}/export`
- `POST /api/dataset/{id}/reset`
- `GET /api/dataset/{id}/history`
- `POST /api/validation/run/{dataset_id}`

