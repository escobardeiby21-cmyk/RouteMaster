from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import folium
import requests

from algorithm import calculate_optimal_route, calculate_optimal_routes_vrp
import models
from database import engine, get_db
import auth
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from fastapi import WebSocket, WebSocketDisconnect
import uuid
import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Radio de la Tierra en kilómetros
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Crear las tablas en la Base de Datos automáticamente al iniciar
models.Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RouteMaster API",
    description="Sistema de Logística con Optimización de Rutas (TSP) y Mapas Visuales.",
    version="2.1.0"
)

@app.on_event("startup")
def create_default_admin():
    db = next(get_db())
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        new_admin = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin"),
            role="admin"
        )
        db.add(new_admin)
        db.commit()

# Configurar CORS para permitir que la web pública (Vercel) se conecte
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=FileResponse)
def read_index():
    return FileResponse("index.html")

class Location(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    weight: int = 0
    time_window_start: int = 0
    time_window_end: int = 1440
    phone: Optional[str] = ""
    details: Optional[str] = ""

class DeliveryRequest(BaseModel):
    driver_id: int
    depot: Location
    deliveries: List[Location]
    use_real_maps: bool = True

class RouteResponse(BaseModel):
    route_id: int
    optimal_route: List[str]
    total_stops: int

class ChatRequest(BaseModel):
    message: str
    route_id: Optional[int] = None

class MultiDeliveryRequest(BaseModel):
    driver_ids: List[int]
    vehicle_capacities: Optional[List[int]] = None
    depot: Location
    deliveries: List[Location]
    use_real_maps: bool = True

class MultiRouteResponse(BaseModel):
    routes: List[RouteResponse]

# --- WebSocket Manager para GPS en vivo ---
class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, route_id: int):
        await websocket.accept()
        if route_id not in self.active_connections:
            self.active_connections[route_id] = []
        self.active_connections[route_id].append(websocket)

    def disconnect(self, websocket: WebSocket, route_id: int):
        if route_id in self.active_connections:
            self.active_connections[route_id].remove(websocket)

    async def broadcast_location(self, route_id: int, lat: float, lng: float):
        if route_id in self.active_connections:
            for connection in self.active_connections[route_id]:
                await connection.send_json({"route_id": route_id, "lat": lat, "lng": lng})

ws_manager = ConnectionManager()

@app.websocket("/ws/tracking/{route_id}")
async def websocket_endpoint(websocket: WebSocket, route_id: int):
    """Conexión WebSocket para enviar/recibir ubicación GPS en tiempo real."""
    await ws_manager.connect(websocket, route_id)
    try:
        while True:
            # En producción, esto recibe la señal GPS de la app del chofer
            data = await websocket.receive_json()
            # Retransmitir al dashboard del administrador
            await ws_manager.broadcast_location(route_id, data.get('lat'), data.get('lng'))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, route_id)

# --- Endpoints de la API ---

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.post("/drivers/")
def create_driver(name: str, phone: str = None, vehicle_plate: str = None, emergency_contact: str = None, db: Session = Depends(get_db)):
    """Endpoint para registrar un nuevo chofer con datos completos."""
    driver = models.Driver(name=name, phone=phone, vehicle_plate=vehicle_plate, emergency_contact=emergency_contact)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    
    # Crear su credencial de sistema automáticamente
    username = f"chofer_{driver.id}"
    new_user = models.User(
        username=username,
        hashed_password=auth.get_password_hash("1234"),
        role="driver",
        driver_id=driver.id
    )
    db.add(new_user)
    db.commit()
    
    return {"message": "Chofer creado", "driver_id": driver.id, "name": driver.name, "username": username}

@app.get("/drivers/", response_model=List[dict])
def get_drivers(db: Session = Depends(get_db)):
    """Obtiene la lista de todos los choferes registrados."""
    drivers = db.query(models.Driver).all()
    return [{
        "id": d.id, 
        "name": d.name, 
        "phone": d.phone,
        "vehicle_plate": d.vehicle_plate,
        "emergency_contact": d.emergency_contact,
        "status": "Disponible"
    } for d in drivers]

@app.put("/drivers/{driver_id}")
def update_driver(driver_id: int, name: str, phone: str = None, vehicle_plate: str = None, emergency_contact: str = None, db: Session = Depends(get_db)):
    """Actualiza la información de un chofer."""
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    
    driver.name = name
    driver.phone = phone
    driver.vehicle_plate = vehicle_plate
    driver.emergency_contact = emergency_contact
    db.commit()
    return {"success": True, "message": "Datos actualizados"}

@app.delete("/drivers/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    """Elimina permanentemente a un chofer del sistema."""
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    
    # Eliminar su usuario de acceso
    user = db.query(models.User).filter(models.User.driver_id == driver_id).first()
    if user:
        db.delete(user)
    
    db.delete(driver)
    db.commit()
    return {"success": True, "message": "Chofer eliminado del sistema"}

@app.get("/analytics/")
def get_analytics(db: Session = Depends(get_db)):
    """Devuelve métricas de rendimiento globales del negocio."""
    total_routes = db.query(models.Route).count()
    total_stops = db.query(models.DeliveryStop).count()
    delivered_stops = db.query(models.DeliveryStop).filter(models.DeliveryStop.is_delivered == True).count()
    
    total_distance_km = sum([r.total_distance for r in db.query(models.Route).all() if r.total_distance is not None])
    saved_distance_km = total_distance_km * 0.20 
    fuel_saved_liters = saved_distance_km * 0.15 

    return {
        "total_routes": total_routes,
        "active_drivers": db.query(models.Driver).count(),
        "delivered_stops": delivered_stops,
        "pending_stops": total_stops - delivered_stops,
        "total_distance_km": round(total_distance_km, 2),
        "fuel_saved_liters": round(fuel_saved_liters, 2)
    }

from typing import List, Optional

class PublicOrderRequest(BaseModel):
    client_name: str
    address: str
    lat: float
    lng: float
    weight: int
    phone: Optional[str] = ""
    details: Optional[str] = ""

@app.post("/public/order")
def create_public_order(order: PublicOrderRequest, db: Session = Depends(get_db)):
    """Endpoint público sin JWT para que los clientes soliciten recolecciones."""
    
    # 1. Generar Número de Guía (Tracking ID)
    tracking = f"RM-{str(uuid.uuid4())[:6].upper()}"
    
    # 2. Calcular Distancia Satelital al Almacén (39.4699, -0.3774)
    DEPOT_LAT, DEPOT_LNG = 39.4699, -0.3774
    distance_km = calculate_haversine_distance(DEPOT_LAT, DEPOT_LNG, order.lat, order.lng)
    
    # 3. Fórmula Comercial Económica: $2 Base + ($0.1 x Kg) + ($0.05 x Km)
    calculated_price = 2.0 + (order.weight * 0.1) + (distance_km * 0.05)
    
    new_stop = models.DeliveryStop(
        location_name=f"{order.client_name} - {order.address}",
        lat=order.lat,
        lng=order.lng,
        weight=order.weight,
        phone=order.phone,
        details=order.details,
        tracking_number=tracking,
        price=calculated_price,
        route_id=None # ¡Pedido Huérfano! Aún no tiene camión
    )
    db.add(new_stop)
    db.commit()
    return {
        "message": "Pedido de recolección recibido con éxito", 
        "tracking_number": tracking,
        "price": calculated_price
    }

@app.get("/all_stops")
def get_all_stops_for_accounting(db: Session = Depends(get_db)):
    """Endpoint para exportar a Excel (Contabilidad)."""
    stops = db.query(models.DeliveryStop).all()
    return [{
        "id": s.id,
        "cliente": s.location_name,
        "direccion": s.address if hasattr(s, 'address') else "Ubicación GPS",
        "guia": s.tracking_number,
        "precio": s.price,
        "peso": s.weight,
        "entregado": s.is_delivered,
        "chofer": s.route.driver.name if s.route and s.route.driver else "Sin Asignar"
    } for s in stops]

@app.get("/pending_orders")
def get_pending_orders(db: Session = Depends(get_db)):
    """El Administrador obtiene los pedidos sin camión asignado."""
    stops = db.query(models.DeliveryStop).filter(models.DeliveryStop.route_id == None).all()
    return [{
        "id": str(s.id),
        "name": s.location_name.split(" - ")[0] if " - " in s.location_name else s.location_name,
        "address": s.location_name.split(" - ")[1] if " - " in s.location_name else "",
        "lat": s.lat,
        "lng": s.lng,
        "weight": s.weight,
        "phone": s.phone,
        "details": s.details,
        "tracking_number": s.tracking_number,
        "price": s.price
    } for s in stops]

@app.get("/public/track/{tracking_number}")
def track_package(tracking_number: str, db: Session = Depends(get_db)):
    """Endpoint público para que el cliente rastree su paquete."""
    stop = db.query(models.DeliveryStop).filter(models.DeliveryStop.tracking_number == tracking_number).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Número de guía no encontrado.")
        
    status = "Entregado" if stop.is_delivered else ("En Ruta" if stop.route_id else "Pendiente de Asignación")
    driver_name = stop.route.driver.name if stop.route_id and stop.route else "Aún no asignado"
    
    return {
        "tracking_number": stop.tracking_number,
        "client": stop.location_name.split(" - ")[0],
        "status": status,
        "driver": driver_name,
        "price": stop.price
    }

@app.post("/optimize-and-save-route", response_model=RouteResponse)
def optimize_and_save(request: DeliveryRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin)):
    """
    Recibe los puntos, calcula la ruta óptima usando mapas reales y guarda la orden en Base de Datos.
    """
    driver = db.query(models.Driver).filter(models.Driver.id == request.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chofer no encontrado en la Base de Datos")
        
    all_locations = [request.depot.model_dump()] + [d.model_dump() for d in request.deliveries]
    optimal_order_ids = calculate_optimal_route(all_locations, use_real_maps=request.use_real_maps)
    
    new_route = models.Route(driver_id=driver.id)
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    
    loc_dict = {loc['id']: loc for loc in all_locations}
    
    for order_index, loc_id in enumerate(optimal_order_ids):
        loc_data = loc_dict[loc_id]
        stop = models.DeliveryStop(
            route_id=new_route.id,
            location_name=loc_data['name'],
            lat=loc_data['lat'],
            lng=loc_data['lng'],
            stop_order=order_index + 1
        )
        db.add(stop)
        
    db.commit()

    return RouteResponse(
        route_id=new_route.id,
        optimal_route=optimal_order_ids,
        total_stops=len(optimal_order_ids)
    )

@app.post("/optimize-and-save-multi-route", response_model=MultiRouteResponse)
def optimize_and_save_multi(request: MultiDeliveryRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin)):
    """
    Recibe un listado de choferes, un depósito y paradas de entrega.
    Divide y optimiza las rutas usando VRP para los vehículos disponibles,
    y guarda la ruta individual de cada chofer en la Base de Datos.
    """
    # Validar que los choferes existan
    drivers = []
    for d_id in request.driver_ids:
        driver = db.query(models.Driver).filter(models.Driver.id == d_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail=f"Chofer con ID {d_id} no encontrado en la Base de Datos")
        drivers.append(driver)
        
    if not drivers:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un ID de chofer válido")

    # Preparar locaciones. El índice 0 es el depot.
    all_locations = [request.depot.model_dump()] + [d.model_dump() for d in request.deliveries]
    
    # Calcular rutas con VRP (CVRP con capacidades)
    num_vehicles = len(drivers)
    capacities = request.vehicle_capacities if request.vehicle_capacities else [1000000] * num_vehicles
    
    vrp_routes = calculate_optimal_routes_vrp(all_locations, num_vehicles, capacities, use_real_maps=request.use_real_maps)
    
    loc_dict = {loc['id']: loc for loc in all_locations}
    saved_routes = []
    
    # Guardar cada ruta individual
    for vehicle_index, loc_ids in vrp_routes.items():
        # Cada ruta debe tener al menos el depósito
        # Si una ruta solo tiene el depósito (longitud <= 1), no se le asigna ruta a este conductor
        if len(loc_ids) <= 1:
            continue
            
        driver = drivers[vehicle_index]
        
        new_route = models.Route(driver_id=driver.id)
        db.add(new_route)
        db.commit()
        db.refresh(new_route)
        
        for order_index, loc_id in enumerate(loc_ids):
            loc_data = loc_dict[loc_id]
            stop = models.DeliveryStop(
                route_id=new_route.id,
                location_name=loc_data['name'],
                lat=loc_data['lat'],
                lng=loc_data['lng'],
                stop_order=order_index + 1
            )
            db.add(stop)
            
        db.commit()
        
        saved_routes.append(RouteResponse(
            route_id=new_route.id,
            optimal_route=loc_ids,
            total_stops=len(loc_ids)
        ))
        
    return MultiRouteResponse(routes=saved_routes)

@app.get("/routes/{route_id}")
def get_route(route_id: int, db: Session = Depends(get_db)):
    """Consulta una ruta guardada y sus paradas ordenadas."""
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
    stops = db.query(models.DeliveryStop).filter(models.DeliveryStop.route_id == route_id).order_by(models.DeliveryStop.stop_order).all()
    
    return {
        "route_id": route.id,
        "driver": route.driver.name,
        "status": route.status,
        "stops": [{"id": s.id, "order": s.stop_order, "name": s.location_name, "delivered": s.is_delivered, "lat": s.lat, "lng": s.lng} for s in stops]
    }

@app.patch("/routes/{route_id}/status")
def update_route_status(route_id: int, status: str, db: Session = Depends(get_db)):
    """Actualiza el estado de una ruta (pending, in_progress, completed)."""
    valid_statuses = ["pending", "in_progress", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de {valid_statuses}")
        
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
    route.status = status
    db.commit()
    return {"message": "Estado de la ruta actualizado", "route_id": route_id, "status": route.status}

class DeliveryUpdate(BaseModel):
    delivered: bool = True
    signature_data: Optional[str] = None

@app.patch("/stops/{stop_id}/deliver")
def update_stop_delivery_status(stop_id: int, update_data: DeliveryUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Marca una parada de entrega y guarda la firma del cliente (Comprobante POD)."""
    stop = db.query(models.DeliveryStop).filter(models.DeliveryStop.id == stop_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Parada no encontrada")
        
    stop.is_delivered = update_data.delivered
    if update_data.signature_data:
        stop.signature_data = update_data.signature_data
        
    db.commit()
    return {
        "message": "Comprobante de entrega registrado exitosamente",
        "stop_id": stop_id,
        "is_delivered": stop.is_delivered,
        "has_signature": bool(stop.signature_data)
    }

@app.get("/routes/{route_id}/map", response_class=HTMLResponse)
def get_route_map(route_id: int, db: Session = Depends(get_db)):
    """
    Genera un mapa visual interactivo en HTML con la ruta calculada.
    """
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
    stops = db.query(models.DeliveryStop).filter(models.DeliveryStop.route_id == route_id).order_by(models.DeliveryStop.stop_order).all()
    
    if not stops:
        return "<h3>No hay paradas en esta ruta.</h3>"

    # Centrar el mapa en la primera parada (El Almacén)
    start_lat = stops[0].lat
    start_lng = stops[0].lng
    
    # Crear el mapa base de Folium
    m = folium.Map(location=[start_lat, start_lng], zoom_start=13)
    
    # Añadir las líneas que conectan la ruta
    coordinates = [(stop.lat, stop.lng) for stop in stops]
    
    folium.PolyLine(
        locations=coordinates,
        color='blue',
        weight=5,
        opacity=0.8,
        tooltip="Ruta Óptima"
    ).add_to(m)

    # Añadir los pines al mapa
    for stop in stops:
        if stop.stop_order == 1:
            color = 'green'
            icon_type = 'home'
        elif stop.is_delivered:
            color = 'lightgray'
            icon_type = 'ok-sign'
        else:
            color = 'red'
            icon_type = 'info-sign'
            
        status_label = "Entregado" if stop.is_delivered else "Pendiente"
        popup_text = f"<b>{stop.stop_order}. {stop.location_name}</b><br>Estado: {status_label}"
        
        folium.Marker(
            location=[stop.lat, stop.lng],
            popup=popup_text,
            icon=folium.Icon(color=color, icon=icon_type)
        ).add_to(m)

    # Devolver el HTML interactivo del mapa
    return m.get_root().render()

@app.post("/chat")
def chat_with_assistant(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Habla con el asistente de IA (Ollama) sobre el estado de las rutas y paradas.
    """
    # 1. Recopilar contexto de la base de datos
    context_lines = ["Información actual de RouteMaster:"]
    
    # Choferes
    drivers = db.query(models.Driver).all()
    drivers_list = [f"- {d.name} (ID: {d.id}, Activo: {d.is_active})" for d in drivers]
    context_lines.append("Choferes:")
    context_lines.extend(drivers_list if drivers_list else ["No hay choferes registrados."])
    
    # Si se proporcionó un ID de ruta específico, damos contexto de esa ruta
    if request.route_id is not None:
        route = db.query(models.Route).filter(models.Route.id == request.route_id).first()
        if route:
            stops = db.query(models.DeliveryStop).filter(models.DeliveryStop.route_id == route.id).order_by(models.DeliveryStop.stop_order).all()
            context_lines.append(f"\nRuta consultada ID {route.id}:")
            context_lines.append(f"- Chofer asignado: {route.driver.name}")
            context_lines.append(f"- Estado de la ruta: {route.status}")
            context_lines.append("- Paradas:")
            for s in stops:
                status = "Entregado" if s.is_delivered else "Pendiente"
                context_lines.append(f"  * Parada {s.stop_order}: {s.location_name} (ID Parada: {s.id}, Estado: {status}, Lat: {s.lat}, Lng: {s.lng})")
        else:
            context_lines.append(f"\nRuta con ID {request.route_id} no encontrada.")
    else:
        # Contexto general de rutas
        routes = db.query(models.Route).all()
        context_lines.append("\nRutas registradas:")
        if routes:
            for r in routes:
                stops = db.query(models.DeliveryStop).filter(models.DeliveryStop.route_id == r.id).all()
                delivered = sum(1 for s in stops if s.is_delivered)
                context_lines.append(f"- Ruta ID {r.id}: Chofer {r.driver.name}, Estado: {r.status}, Paradas: {delivered}/{len(stops)} completadas.")
        else:
            context_lines.append("No hay rutas registradas.")

    context = "\n".join(context_lines)

    # 2. Configurar el prompt para Ollama
    system_prompt = (
        "Eres el asistente de IA de RouteMaster, un sistema inteligente de optimización de rutas logísticas.\n"
        "Tu tarea es ayudar al administrador o a los choferes respondiendo sus preguntas sobre las rutas, paradas y choferes basándote ÚNICAMENTE en el contexto proporcionado a continuación.\n"
        "Sé profesional, amigable y muy conciso. Responde en español.\n\n"
        f"Contexto actual de la base de datos:\n{context}"
    )

    ollama_url = "http://localhost:11434/api/chat"
    payload = {
        "model": "llama3",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ],
        "stream": False
    }

    try:
        # Hacemos la llamada al servicio local de Ollama
        response = requests.post(ollama_url, json=payload, timeout=12)
        if response.status_code == 200:
            result = response.json()
            reply = result["message"]["content"]


            return {"response": reply}
        else:
            return {
                "error": "Ollama devolvió un error",
                "status_code": response.status_code,
                "details": response.text,
                "hint": "Verifica que el servicio Ollama esté iniciado y que tengas descargado el modelo 'llama3' ('ollama run llama3')."
            }
    except Exception as e:
        return {
            "error": "No se pudo establecer conexión con Ollama en el puerto 11434.",
            "details": str(e),
            "hint": "Asegúrate de ejecutar en tu terminal local: 'ollama run llama3'"
        }

@app.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    """Obtiene todos los paquetes con su estado."""
    stops = db.query(models.DeliveryStop).all()
    return [{
        "id": s.id,
        "client_name": s.location_name.split(" - ")[0] if " - " in s.location_name else s.location_name,
        "address": s.location_name.split(" - ")[1] if " - " in s.location_name else "",
        "lat": s.lat,
        "lng": s.lng,
        "weight": s.weight,
        "phone": s.phone,
        "details": s.details,
        "tracking_number": s.tracking_number,
        "status": "Entregado" if s.is_delivered else "Pendiente",
        "driver": s.route.driver.name if s.route and s.route.driver else None
    } for s in stops]

@app.post("/driver/delivered/{tracking_number}")
def mark_delivered(tracking_number: str, db: Session = Depends(get_db)):
    stop = db.query(models.DeliveryStop).filter(models.DeliveryStop.tracking_number == tracking_number).first()
    if stop:
        stop.is_delivered = True
        db.commit()
        return {"success": True}
    raise HTTPException(status_code=404, detail="Order not found")

@app.post("/reassign/{tracking_number}/{new_driver_id}")
def reassign_order(tracking_number: str, new_driver_id: int, db: Session = Depends(get_db)):
    """Transfiere un paquete de una ruta a un nuevo chofer."""
    stop = db.query(models.DeliveryStop).filter(models.DeliveryStop.tracking_number == tracking_number).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
        
    driver = db.query(models.Driver).filter(models.Driver.id == new_driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="El nuevo chofer no existe")
        
    active_route = db.query(models.Route).filter(models.Route.driver_id == driver.id, models.Route.status.in_(["pending", "in_progress"])).first()
    
    if not active_route:
        active_route = models.Route(driver_id=driver.id)
        db.add(active_route)
        db.commit()
        db.refresh(active_route)
        
    stop.route_id = active_route.id
    db.commit()
    return {"success": True, "message": "Paquete reasignado exitosamente"}
