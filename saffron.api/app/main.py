from importlib.metadata import files
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.api.v1.endpoints import auth, fields, folders, files

app = FastAPI(title="Saffron API", version="1.0")


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Saffron API",
        version="1.0.0",
        description="API with JWT authentication",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/login",
                    "scopes": {}
                }
            }
        }
    }
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation.setdefault("security", []).append({"OAuth2PasswordBearer": []})
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.include_router(fields.router, prefix="/api/v1", tags=["Fields"])
app.include_router(folders.router, prefix="/api/v1", tags=["Folders"])
app.include_router(files.router, prefix="/api/v1", tags=["Files"])
app.include_router(auth.router, tags=["Auth"])