from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="driver") # 'admin' o 'driver'
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    pin = Column(String, nullable=True, default="1234")
    avatar_url = Column(String, nullable=True)
    total_deliveries = Column(Integer, default=0)
    phone = Column(String, nullable=True)
    vehicle_plate = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    routes = relationship("Route", back_populates="driver")

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    status = Column(String, default="pending") # pending, in_progress, completed
    total_distance = Column(Float, nullable=True) # Para métricas
    driver = relationship("Driver", back_populates="routes")
    stops = relationship("DeliveryStop", back_populates="route")

class DeliveryStop(Base):
    __tablename__ = "delivery_stops"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    location_name = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    weight = Column(Integer, default=0)
    time_window_start = Column(Integer, default=0) # Minutos desde el inicio (e.g. 9:00 AM = 540)
    time_window_end = Column(Integer, default=1440) # 24h = 1440
    phone = Column(String, default="")
    details = Column(String, default="")
    
    # Modelo Courier
    pickup_type = Column(String, default="almacen") # 'almacen' o 'domicilio'
    origin_address = Column(String, nullable=True)
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    package_type = Column(String, default="pequeño")
    preferred_schedule = Column(String, default="asap")
    
    # Nuevos campos empresariales
    tracking_number = Column(String, unique=True, index=True, nullable=True)
    price = Column(Float, default=0.0)
    payment_method = Column(String, default="card") # 'card' or 'cash'
    signature_data = Column(String, nullable=True) # Base64 Image
    photo_data = Column(String, nullable=True) # Base64 Image
    
    stop_order = Column(Integer)
    is_delivered = Column(Boolean, default=False)
    route = relationship("Route", back_populates="stops")
