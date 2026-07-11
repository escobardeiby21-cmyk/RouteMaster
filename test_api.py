import requests
import json

base_url = "http://127.0.0.1:8000"

print("1. Creando un chofer...")
res = requests.post(f"{base_url}/drivers/?name=Deiby%20Escobar")
if res.status_code != 200:
    print("Error al crear el chofer:", res.text)
    exit()

driver_id = res.json()["driver_id"]
print(f"Chofer creado con ID: {driver_id}")

print("\n2. Solicitando ruta óptima (Google Maps + OR-Tools)...")
payload = {
    "driver_id": driver_id,
    "depot": {
        "id": "almacen_principal",
        "name": "Almacén Principal (Requena)",
        "lat": 39.489112,
        "lng": -1.102652
    },
    "deliveries": [
        {
            "id": "entrega_1",
            "name": "Cliente 1 (Centro)",
            "lat": 39.488345,
            "lng": -1.100123
        },
        {
            "id": "entrega_2",
            "name": "Cliente 2 (Norte)",
            "lat": 39.495231,
            "lng": -1.104456
        },
        {
            "id": "entrega_3",
            "name": "Cliente 3 (Sur)",
            "lat": 39.482100,
            "lng": -1.108899
        }
    ],
    "use_real_maps": False  # Usar False por defecto para evitar requerir API Key de Google Maps en la prueba
}

res2 = requests.post(f"{base_url}/optimize-and-save-route", json=payload)
print("Respuesta del servidor:")
print(json.dumps(res2.json(), indent=2))

if res2.status_code == 200:
    route_id = res2.json()["route_id"]
    
    print(f"\n3. Consultando el estado de la ruta {route_id}...")
    res_get = requests.get(f"{base_url}/routes/{route_id}")
    route_data = res_get.json()
    print(json.dumps(route_data, indent=2))
    
    # Obtener el ID de la primera parada de entrega (excluyendo el depósito, que suele ser la parada 1)
    # Busquemos una parada que no sea la primera o simplemente la primera disponible
    stops = route_data.get("stops", [])
    if len(stops) > 1:
        target_stop = stops[1]  # La primera parada de entrega
        stop_id = target_stop["id"]
        stop_name = target_stop["name"]
        
        print(f"\n4. Marcando parada '{stop_name}' (ID: {stop_id}) como ENTREGADA...")
        res_patch = requests.patch(f"{base_url}/stops/{stop_id}/deliver?delivered=true")
        print("Respuesta PATCH:", res_patch.json())
        
        print(f"\n5. Cambiando estado de la ruta {route_id} a 'in_progress'...")
        res_status = requests.patch(f"{base_url}/routes/{route_id}/status?status=in_progress")
        print("Respuesta PATCH Status:", res_status.json())
        
        print("\n6. Consultando la ruta actualizada para verificar cambios...")
        res_get_updated = requests.get(f"{base_url}/routes/{route_id}")
        print(json.dumps(res_get_updated.json(), indent=2))
        
        print(f"\n7. Puedes ver el mapa interactivo actualizado abriendo tu navegador en:")
        print(f"{base_url}/routes/{route_id}/map")
    
    print("\n8. Probando Asistente de IA (Chat con Ollama)...")
    chat_payload = {
        "message": "¿Cuál es la siguiente parada y su estado para la ruta?",
        "route_id": route_id
    }
    try:
        res_chat = requests.post(f"{base_url}/chat", json=chat_payload)
        print("Respuesta del Asistente de IA:")
        print(json.dumps(res_chat.json(), indent=2))
    except Exception as e:
        print("Error al conectar con la API de chat:", e)
else:
    print("Error al calcular la ruta:", res2.text)
