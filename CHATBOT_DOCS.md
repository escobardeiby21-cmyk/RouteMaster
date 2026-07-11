# 🤖 Documentación Oficial: Asistente Virtual IA (RouteMaster)

Este documento detalla la arquitectura, características y capacidades del módulo de Asistente Virtual (Chatbot) integrado en el Portal de Clientes de RouteMaster.

## 🌟 Características Actuales (Versión 1.0)

El chatbot actual funciona mediante un **Simulador Inteligente** que no requiere el pago de APIs de terceros (como OpenAI), reduciendo los costos operativos a $0 mientras mantiene una experiencia de usuario premium.

### 1. Rastreo Inteligente de Paquetes
- El bot cuenta con un sistema de **Extracción de Entidades (Regex)**. 
- Es capaz de leer oraciones completas y extraer automáticamente cualquier código que cumpla el formato de guía (ej. `RM-1234`).
- Al detectar la guía, hace una consulta en tiempo real a la base de datos blindada (PostgreSQL) para obtener la verdad absoluta del estado del envío.

### 2. Generación de Reportes Dinámicos
Cuando encuentra un paquete, el bot estructura un "tiquete virtual" que incluye:
- **Estado Actual:** (En almacén, en ruta, o entregado).
- **Fecha Estimada de Entrega (ETA):** Calcula matemáticamente el tiempo de llegada basado en la fecha actual.
- **Identidad del Chofer:** Expone el nombre del empleado asignado por razones de confianza y seguridad.
- **Resumen Financiero:** Muestra el total pagado o a pagar por el cliente.

### 3. Detección de Intenciones (NLP Básico)
El cerebro del bot tiene una capa de reconocimiento de palabras clave (Keywords):
- Detecta saludos ("Hola", "Buenos días").
- Detecta **intención de tiempo** ("cuándo", "llega", "tiempo", "fecha").
- Si el cliente pregunta por fechas sin dar un número de guía, el bot entiende el contexto y le solicita el número de guía amablemente en lugar de emitir un error genérico.

---

## 🏗️ Arquitectura del Sistema

- **Frontend (Interfaz):** Construida en `React` + `TailwindCSS`. Es un Widget flotante con animaciones fluidas (backdrop-blur, shadow-glow) y un estado de "isTyping" (escribiendo...) que simula comportamiento humano.
- **Backend (Cerebro):** Desarrollado en `FastAPI` (Python). El endpoint `/public/chat` procesa las peticiones de forma asíncrona.
- **Avatar:** Generado con IA 3D, representando los valores de la empresa (modernidad, tecnología y amabilidad).

---

## 🚀 Hoja de Ruta a Futuro (Roadmap V2.0)

Las siguientes características han sido propuestas para llevar al asistente al nivel de corporaciones como Amazon:

1. **Encuestas de Satisfacción Post-Chat:**
   - Una vez resuelta la duda del cliente, el bot enviará un mensaje automatizado pidiendo una calificación de 1 a 5 estrellas.
   - Estos datos alimentarán el Dashboard Analítico del Administrador.
   
2. **Auto-Replika (Seguimiento Activo):**
   - Si el cliente deja de escribir por más de 1 minuto, el bot enviará un "ping" conversacional: *"¿Sigues ahí? ¿Puedo ayudarte en algo más?"*.

3. **Integración con LLM Puro (Gemini/ChatGPT):**
   - Conectar la API de Google Gemini para que el bot pueda tener conversaciones abiertas sobre políticas de la empresa, horarios de atención y devoluciones, leyendo un manual en PDF de RouteMaster.
