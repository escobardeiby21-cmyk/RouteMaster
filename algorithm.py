import os
import requests
import googlemaps
from dotenv import load_dotenv
from scipy.spatial.distance import euclidean
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

load_dotenv()

# Obtener la API key de las variables de entorno
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def get_google_distance_matrix(locations):
    """
    Llama a la API de Google Maps Distance Matrix para obtener distancias reales de conducción.
    Requiere una GOOGLE_MAPS_API_KEY válida.
    """
    if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY == "tu_clave_de_api_aqui":
        print("Advertencia: API Key de Google Maps no configurada. Usando distancia en línea recta.")
        return None

    try:
        gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
        
        # Formato de coordenadas para Google Maps: (lat, lng)
        coords = [(loc['lat'], loc['lng']) for loc in locations]
        
        # Llamada a la API
        matrix = gmaps.distance_matrix(origins=coords, destinations=coords, mode="driving")
        
        if matrix['status'] == 'OK':
            distances = []
            for row in matrix['rows']:
                row_distances = []
                for element in row['elements']:
                    if element['status'] == 'OK':
                        # Guardar la distancia en metros
                        row_distances.append(element['distance']['value'])
                    else:
                        row_distances.append(9999999) # Penalización alta si no hay ruta
                distances.append(row_distances)
            return distances
        else:
            print("Error en Google Maps API:", matrix['status'])
            return None
    except Exception as e:
        print("Error obteniendo datos de Google Maps, usando línea recta:", e)
    return None

def create_haversine_distance_matrix(locations):
    """Crea una matriz de distancias usando la fórmula de Haversine (distancia real en metros) como fallback."""
    import math
    
    def haversine_distance(coord1, coord2):
        R = 6371000 # Radio de la Tierra en metros
        lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
        lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return int(R * c)

    matrix = []
    for i in range(len(locations)):
        row = []
        for j in range(len(locations)):
            if i == j:
                row.append(0)
            else:
                coord_i = (locations[i]['lat'], locations[i]['lng'])
                coord_j = (locations[j]['lat'], locations[j]['lng'])
                dist = haversine_distance(coord_i, coord_j)
                row.append(dist)
        matrix.append(row)
    return matrix

def calculate_optimal_route(locations, use_real_maps=True, num_vehicles=1):
    """
    Calcula la ruta óptima usando Google OR-Tools.
    Soporta múltiples vehículos (VRP) o un solo vehículo (TSP).
    """
    if not locations or len(locations) <= 1:
        return [loc['id'] for loc in locations]

    # 1. Obtener la Matriz de Distancias
    distance_matrix = None
    if use_real_maps:
        distance_matrix = get_google_distance_matrix(locations)
        
    if not distance_matrix:
        distance_matrix = create_haversine_distance_matrix(locations)

    # 2. Configurar el modelo de OR-Tools
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), num_vehicles, 0) # 0 es el índice del depósito (origen)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        """Devuelve la distancia entre dos nodos."""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 3. Parámetros de Búsqueda
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.seconds = 5 # Límite de tiempo máximo para buscar la mejor solución

    # 4. Resolver el problema
    solution = routing.SolveWithParameters(search_parameters)

    # 5. Extraer la solución
    if solution:
        optimal_route_ids = []
        # Para esta primera versión compleja, devolvemos la ruta del primer vehículo
        index = routing.Start(0)
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            optimal_route_ids.append(locations[node_index]['id'])
            index = solution.Value(routing.NextVar(index))
        
        # Eliminar el depósito si se vuelve a agregar al final o manejarlo según tu lógica
        # En tu caso, el main.py asume que no vuelve a agregar el final si ya está.
        # Ahora, explícitamente añadimos el retorno al depósito:
        end_node_index = manager.IndexToNode(routing.End(0))
        optimal_route_ids.append(locations[end_node_index]['id'])
        
        return optimal_route_ids
    else:
        print("No se encontró solución con OR-Tools")
        # Fallback a la ruta original
        return [loc['id'] for loc in locations]

def calculate_optimal_routes_vrp(locations, num_vehicles, capacities, use_real_maps=True):
    """
    Calcula las rutas óptimas para múltiples vehículos (VRP) usando Google OR-Tools.
    Soporta CVRP (Capacitated VRP) a través del parámetro capacities.
    """
    if not locations:
        return {}
    if len(locations) <= 1:
        # Solo depósito
        return {i: [locations[0]['id']] for i in range(num_vehicles)}

    # 1. Obtener la Matriz de Distancias
    distance_matrix = None
    if use_real_maps:
        distance_matrix = get_google_distance_matrix(locations)
        
    if not distance_matrix:
        distance_matrix = create_haversine_distance_matrix(locations)

    # 2. Configurar el modelo de OR-Tools
    # 0 es el índice del depósito (origen)
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        """Devuelve la distancia entre dos nodos."""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        3000000,  # maximum distance per vehicle
        True,  # start cumul to zero
        'Distance')
    distance_dimension = routing.GetDimensionOrDie('Distance')
    # Penalizar la diferencia de distancia para equilibrar las rutas entre vehículos
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Añadir dimensión de Capacidad (CVRP)
    demands = [loc.get('weight', 0) for loc in locations]
    
    def demand_callback(from_index):
        """Devuelve la demanda (peso) del nodo."""
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        capacities,  # capacidades de los vehículos
        True,  # start cumul to zero
        'Capacity')

    # Añadir dimensión de Tiempo (Time Windows)
    time_windows = [(loc.get('time_window_start', 0), loc.get('time_window_end', 1440)) for loc in locations]
    
    def time_callback(from_index, to_index):
        """Aproximación de tiempo: 1 metro de distancia = 1 unidad de tiempo, para el CV de ejemplo."""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    time_callback_index = routing.RegisterTransitCallback(time_callback)
    
    routing.AddDimension(
        time_callback_index,
        3000000,  # tiempo de espera permitido
        3000000,  # tiempo máximo por vehículo
        False,  # no forzar inicio en cero absoluto si hay desfases
        'Time'
    )
    time_dimension = routing.GetDimensionOrDie('Time')
    
    # Añadir restricciones de ventana a cada nodo (excepto el depósito que es el 0)
    for i, tw in enumerate(time_windows):
        if i == 0: continue
        index = manager.NodeToIndex(i)
        time_dimension.CumulVar(index).SetRange(tw[0], tw[1])

    # 3. Parámetros de Búsqueda
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.seconds = 5

    # 4. Resolver el problema
    solution = routing.SolveWithParameters(search_parameters)

    # 5. Extraer la solución
    routes = {}
    if solution:
        for vehicle_id in range(num_vehicles):
            index = routing.Start(vehicle_id)
            route = []
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                route.append(locations[node_index]['id'])
                index = solution.Value(routing.NextVar(index))
            
            # Cerrar el ciclo retornando al depósito
            end_node_index = manager.IndexToNode(routing.End(vehicle_id))
            route.append(locations[end_node_index]['id'])
            
            routes[vehicle_id] = route
        return routes
    else:
        print("No se encontró solución con OR-Tools para VRP")
        # En caso de error, asignar todas las entregas al primer vehículo
        routes = {i: [] for i in range(num_vehicles)}
        routes[0] = [loc['id'] for loc in locations]
        return routes
