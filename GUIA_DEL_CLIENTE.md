# 📦 Guía Práctica: Portal de Clientes RouteMaster

Bienvenido al manual de usuario del **Portal Público de RouteMaster**. Este documento te enseñará cómo solicitar recolecciones de paquetes y cómo rastrearlos en tiempo real hasta su entrega.

---

## 1. Acceder al Portal Público
Para entrar al sistema, simplemente abre tu navegador web y dirígete a la dirección proporcionada por la empresa de logística (por ejemplo: `http://localhost:5173`). 

En la pantalla principal, selecciona el botón azul que dice **"Soy Cliente"**.

---

## 2. Solicitar una Recolección de Paquete
En el menú superior, asegúrate de estar en la pestaña **"📦 Enviar Paquete"**. Sigue estos pasos:

1. **Tu Nombre / Empresa:** Escribe quién envía el paquete (Ej. *Juan Pérez* o *Empresa ABC*).
2. **Dirección de Recogida:** Ingresa la dirección exacta donde el camión debe buscar el paquete. El sistema cuenta con geolocalización por satélite, por lo que buscará las coordenadas exactas de tu calle. (Ej. *Avenida de la Paz 10, Madrid*).
3. **Teléfono de Contacto:** Un número válido para que el chofer pueda llamarte si no encuentra el edificio.
4. **Peso (kg):** Indica el peso aproximado de la caja. Esto ayuda a la Inteligencia Artificial a decidir qué camión tiene espacio suficiente para tu paquete.
5. **Piso o Detalles (Opcional):** Si vives en un apartamento o hay instrucciones especiales para el portero, escríbelas aquí.
6. Presiona **"Solicitar Recolección Inmediata"**.

### ¡Importante! Guarda tu Número de Guía
Si tu dirección es válida, verás una pantalla de éxito verde. Allí aparecerá un código en formato `RM-XXXXXX` y el costo estimado de tu servicio. **Copia o guarda este número de guía, ya que será tu única forma de rastrear el paquete.**

---

## 3. Rastrear un Paquete en Vivo
Si ya tienes un Número de Guía y quieres saber por dónde va tu paquete:

1. Ve a la pestaña **"📍 Rastrear Paquete"** en la parte superior del Portal.
2. Ingresa tu número de guía exactamente como te lo dio el sistema (Ej. `RM-A8F9B2`).
3. Presiona **"Buscar"**.

### Entendiendo el Estado de tu Envío
En la pantalla de detalles verás un resumen financiero y operativo de tu entrega. Presta especial atención al **Estado**:

- 🟡 **Pendiente de Asignación:** Tu paquete está en nuestra base de datos, pero la Inteligencia Artificial aún no le ha asignado un camión de recolección.
- 🔵 **En Ruta:** ¡Buenas noticias! Ya se le asignó un camión a tu paquete. En esta misma pantalla podrás ver el nombre del "Chofer Asignado" que pasará por ti.
- 🟢 **Entregado:** El paquete ha llegado exitosamente a su destino y se ha recolectado una firma digital como comprobante de recepción.

---
*Gracias por utilizar la tecnología inteligente de RouteMaster.*
