# Sesión: Random Forest — Módulo Predictivo Superadmin
**Fecha:** 2026-05-31  
**Agente:** Claude Sonnet 4.6  
**Fase PUDS:** Implementación

---

## Qué se hizo

### Backend: `backend/apps/platform_predictions/`

| Archivo | Descripción |
|---------|-------------|
| `apps.py` | AppConfig — nombre `apps.platform_predictions` |
| `models.py` | `PredictionModelRun` (runs de entrenamiento) + `PredictionResult` (predicciones por tenant) |
| `serializers.py` | DRF serializers para ambos modelos |
| `views.py` | 5 endpoints protegidos con `PlatformJWTAuthentication + IsPlatformAdministrator` |
| `urls.py` | Rutas bajo `/api/public/platform/predictions/` |
| `admin.py` | Registro Django Admin |
| `services/random_forest_service.py` | `RandomForestPredictionService` completo |
| `migrations/0001_initial.py` | Migración generada y aplicada al schema public |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/config/settings.py` | Agrega `apps.platform_predictions` a `SHARED_APPS` |
| `backend/requirements/base.txt` | Agrega scikit-learn, pandas, numpy, joblib |
| `backend/apps/tenant/urls.py` | Agrega `path('platform/predictions/', include('apps.platform_predictions.urls'))` |
| `frontend/src/components/platform/PlatformSidebar.tsx` | Nueva sección "Inteligencia" → "Reportes Predictivos" |

### Archivos creados (Frontend)

| Archivo | Descripción |
|---------|-------------|
| `frontend/src/lib/platformPredictions.ts` | Servicio API TypeScript con todos los endpoints |
| `frontend/src/app/platform/dashboard/predicciones/page.tsx` | UI completa con tabs: Predicciones, Variables, Historial |

---

## Flujo del módulo

```
Superadmin → POST /train/ → collect_training_data() → build_features() → train_model()
          → guarda PredictionModelRun + modelo .pkl
          → POST /predict/ → predict() → guarda PredictionResult por tenant
          → GET /feature-importance/ → importancia de variables
          → GET /runs/ → historial de entrenamientos
```

---

## Decisions técnicas

1. **Schema PUBLIC**: La app usa `SHARED_APPS` — las tablas viven en `public`, no en schemas de clínicas.
2. **Acceso multi-tenant**: El servicio usa `schema_context` de django-tenants para extraer solo conteos agregados de cada tenant, sin exponer datos individuales de pacientes.
3. **Fallback sintético**: Si hay < 10 tenants reales, se generan muestras sintéticas académicas para permitir entrenamiento. Documentado explícitamente en el código.
4. **Etiquetas heurísticas**: Las etiquetas `bajo/medio/alto` son reglas basadas en % canceladas, cantidad de pacientes y cobertura postoperatoria. En producción real deberían ser históricas verificadas.
5. **Modelo guardado en disco**: `ml_models/rf_riesgo_operativo_tenant.pkl` usando joblib. Volumen Docker montado en `./backend:/app`.

---

## Cómo probar

```bash
# 1. Verificar ML disponible
docker compose exec backend python -c "import sklearn; print(sklearn.__version__)"

# 2. Entrenar (POST con token platform)
curl -X POST http://localhost/api/public/platform/predictions/train/ \
  -H "Authorization: Bearer <platform_token>"

# 3. Predecir
curl -X POST http://localhost/api/public/platform/predictions/predict/ \
  -H "Authorization: Bearer <platform_token>"

# 4. Ver en UI
http://localhost:3000/platform/dashboard/predicciones
```

---

## Diagrama de componentes (PUDS)

```
[PlatformSidebar] → [/platform/dashboard/predicciones] 
                        ↓ (platformPredictions.ts)
                    [platformApi] → [/api/public/platform/predictions/]
                                        ↓
                                [views.py + PlatformJWTAuthentication]
                                        ↓
                            [RandomForestPredictionService]
                              ├── collect_training_data()
                              │     ↓ schema_context(tenant)
                              │   [Cita, Paciente, Cirugia, etc.]
                              ├── train_model() → [ml_models/*.pkl]
                              └── predict() → [PredictionResult]
```
