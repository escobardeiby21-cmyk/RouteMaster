import pytest
from fastapi.testclient import TestClient
from main import app, get_db
from database import Base, engine
import models

# Configurar Base de Datos temporal en memoria para las pruebas
models.Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_read_index():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_create_driver():
    response = client.post("/drivers/?name=Test%20Driver")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Chofer creado"
    assert "driver_id" in data

def test_optimize_and_save_route():
    # 1. Crear un chofer para la prueba
    driver_res = client.post("/drivers/?name=Driver%20Test%20TSP")
    driver_id = driver_res.json()["driver_id"]

    # 2. Payload de TSP
    payload = {
        "driver_id": driver_id,
        "depot": {
            "id": "depot1",
            "name": "Depot Central",
            "lat": 39.489,
            "lng": -1.102,
            "weight": 0
        },
        "deliveries": [
            {
                "id": "del1",
                "name": "Cliente 1",
                "lat": 39.488,
                "lng": -1.100,
                "weight": 10
            },
            {
                "id": "del2",
                "name": "Cliente 2",
                "lat": 39.495,
                "lng": -1.104,
                "weight": 20
            }
        ],
        "use_real_maps": False
    }

    # 3. Solicitar optimización
    response = client.post("/optimize-and-save-route", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "route_id" in data
    assert "optimal_route" in data
    
    route = data["optimal_route"]
    # El primer elemento y el último deben ser el depósito para cerrar el ciclo TSP
    assert route[0] == "depot1"
    assert route[-1] == "depot1"

def test_optimize_and_save_multi_route():
    # 1. Crear dos choferes para el CVRP
    driver_res_1 = client.post("/drivers/?name=Driver%201")
    driver_res_2 = client.post("/drivers/?name=Driver%202")
    driver_id_1 = driver_res_1.json()["driver_id"]
    driver_id_2 = driver_res_2.json()["driver_id"]

    # 2. Payload de VRP con Capacidades
    payload = {
        "driver_ids": [driver_id_1, driver_id_2],
        "vehicle_capacities": [15, 30], # Vehículo 1 es pequeño, Vehículo 2 es grande
        "depot": {
            "id": "depot2",
            "name": "Depot Central VRP",
            "lat": 39.489,
            "lng": -1.102,
            "weight": 0
        },
        "deliveries": [
            {
                "id": "delA",
                "name": "Cliente A",
                "lat": 39.488,
                "lng": -1.100,
                "weight": 25 # Solo cabe en el vehículo 2
            },
            {
                "id": "delB",
                "name": "Cliente B",
                "lat": 39.495,
                "lng": -1.104,
                "weight": 10 # Cabe en el vehículo 1
            }
        ],
        "use_real_maps": False
    }

    # 3. Solicitar optimización
    response = client.post("/optimize-and-save-multi-route", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "routes" in data
    routes = data["routes"]
    
    # Debe haber generado rutas (puede que asigne ambas a un vehículo o las divida dependiendo de la distancia y capacidad)
    assert len(routes) > 0
    for r in routes:
        # Verificar retorno al depósito
        assert r["optimal_route"][0] == "depot2"
        assert r["optimal_route"][-1] == "depot2"
