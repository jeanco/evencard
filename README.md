# EvenCard — Plataforma de Invitaciones Digitales Interactivas

**EvenCard** es una aplicación web moderna y profesional orientada a la creación, personalización y publicación de **tarjetas de invitación digitales**. Permite a los usuarios diseñar invitaciones interactivas para bodas, cumpleaños, quinceañeros, bautizos, aniversarios y eventos empresariales en cuestión de minutos, con mapas interactivos, cuenta regresiva, galerías de fotos y confirmación instantánea por WhatsApp (RSVP).

---

## 🚀 Tecnologías Utilizadas

### Frontend
* **HTML5 semántico** con optimización SEO y Open Graph
* **CSS3 moderno** (Variables personalizadas, Glassmorphism, Micro-animaciones y soporte Mobile-First)
* **Bootstrap 5.3.3** & **Bootstrap Icons 1.11.3**
* **JavaScript Moderno (ES6+)** modular sin dependencias pesadas de framework
* **Leaflet & OpenStreetMap** para selección y renderizado interactivo de ubicaciones sin necesidad de claves de pago
* **Canvas Confetti** para celebraciones al publicar y confirmar asistencia
* **Google Fonts**: *Outfit*, *Plus Jakarta Sans*, *Playfair Display*, *Cinzel* y *Great Vibes*

### Backend & Infraestructura (Supabase)
* **Supabase Authentication**: Registro e inicio de sesión seguro con JWT persistente.
* **Supabase PostgreSQL 17**: 9 tablas relacionales con integridad referencial, índices B-Tree y triggers automáticos.
* **Supabase Storage**: 5 buckets públicos con políticas seguras para portadas, banners, galerías, logos y avatares.
* **Row Level Security (RLS)**: Acceso restringido para edición de propietarios y lectura pública para invitaciones publicadas.
* **Supabase JavaScript Client (@supabase/supabase-js v2)**.

---

## 📁 Estructura del Proyecto

```text
evencard/
│
├── index.html                  # Landing page comercial y showcase interactivo
├── login.html                  # Inicio de sesión con Supabase Auth
├── registro.html               # Registro de nuevos usuarios
├── dashboard.html              # Panel de administración de invitaciones
├── crear-invitacion.html        # Wizard interactivo de creación en 7 pasos
├── editar-invitacion.html       # Editor para actualizar invitaciones existentes
├── vista-invitacion.html       # Vista pública optimizada para móviles y WhatsApp
├── perfil.html                 # Configuración de perfil y avatar del usuario
│
├── css/
│   ├── app.css                 # Variables de diseño, fuentes y componentes globales
│   ├── landing.css             # Estilos específicos de la landing y mockup de teléfono
│   ├── dashboard.css           # Estilos del panel SaaS, wizard, dropzones y métricas
│   └── invitation.css          # Estilos de las 5 plantillas (Elegante, Romántica, etc.)
│
├── js/
│   ├── config.js               # URLs, keys y constantes globales de Supabase
│   ├── supabase.js             # Inicialización del cliente Supabase
│   ├── auth.js                 # Autenticación, guards de rutas y perfiles
│   ├── dashboard.js            # Lógica del panel, cálculo de métricas y filtros
│   ├── invitation.js           # Servicio de datos (CRUD, visitas, RSVPs)
│   ├── storage.js              # Subida y borrado de imágenes en Supabase Storage
│   ├── gallery.js              # Manejador interactivo de galería con reordenamiento
│   └── utils.js                # Toasts, formateo de fechas, slugify, QR y WhatsApp
│
├── supabase/
│   └── schema.sql              # Esquema DDL completo con tablas, RLS, triggers y buckets
│
├── assets/
│   ├── images/                 # Banners y recursos visuales
│   ├── icons/                  # Iconografía
│   └── templates/              # Assets estáticos
│
└── README.md                   # Documentación general del proyecto
```

---

## 🗄️ Esquema de la Base de Datos

El archivo `supabase/schema.sql` contiene la definición completa de las siguientes tablas:

1. **`profiles`**: Perfiles de usuarios creados automáticamente vía trigger desde `auth.users`.
2. **`invitations`**: Registro principal de la invitación (título, tipo, slug único, fechas, portada, plantilla, estado).
3. **`invitation_people`**: Personas clave del evento (novios, agasajados, padres, padrinos).
4. **`invitation_locations`**: Dirección, nombre del local y coordenadas geográficas (latitud/longitud).
5. **`invitation_gallery`**: Fotografías del evento alojadas en Supabase Storage con orden personalizado.
6. **`invitation_schedule`**: Cronograma del evento (ceremonia, recepción, cena, baile).
7. **`invitation_settings`**: Toggles de visibilidad para cada módulo.
8. **`invitation_views`**: Registro de métricas y visitas anónimas por invitación.
9. **`invitation_rsvps`**: Confirmaciones de asistencia de los invitados.

---

## 🎨 Plantillas Disponibles

Las invitaciones se adaptan instantáneamente a 5 temas de diseño:
* **Elegante**: Tipografía serif refinada (*Playfair Display*), fondo marfil suave y acentos dorados clásicos.
* **Romántica**: Tonos rosa rubor y pastel, fuentes caligráficas y diseño emotivo.
* **Moderna**: Fondo oscuro tecnológico, acentos neón índigo/violeta y tarjetas glassmorphism.
* **Floral**: Estilo botánico y orgánico con verde salvia (*Cinzel*) y detalles de naturaleza.
* **Minimalista**: Estilo editorial en blanco y negro, alto contraste y tipografía limpia.

---

## 🛠️ Instalación y Configuración Local

### 1. Servir el proyecto
Si utilizas **Laragon**, el proyecto ya se encuentra en `C:\laragon\www\evencard`. Puedes acceder abriendo tu navegador en:
```text
http://localhost/evencard
```
O directamente con cualquier servidor HTTP local:
```powershell
# Ejemplo con Python
python -m http.server 8000
```

### 2. Configuración de Supabase
El archivo `js/config.js` ya cuenta con la configuración del proyecto:
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://mfsdvlkphptgtssahpbr.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_CwBDx-RKCjqw4QfhqnmIgQ_WQSC472A',
    ...
};
```

---

## 📱 Flujo de Prueba Recomendado

1. Abre `http://localhost/evencard/index.html` para revisar la Landing Page comercial y el mockup 3D interactivo.
2. Haz clic en **"Crear mi invitación"** o dirígete a `registro.html` para registrar un usuario de prueba.
3. Tras registrarte, entrarás automáticamente al `dashboard.html`.
4. Haz clic en **"+ Crear invitación"** para iniciar el wizard en 7 pasos:
   * **Paso 1**: Elige la categoría (ej: Boda o Cumpleaños).
   * **Paso 2**: Escribe el título, fecha, hora y protagonistas.
   * **Paso 3**: Fija la dirección y haz clic en el mapa interactivo para colocar el marcador.
   * **Paso 4**: Arrastra o selecciona la imagen de portada.
   * **Paso 5**: Selecciona múltiples fotos para la galería.
   * **Paso 6**: Elige la plantilla de diseño y los módulos visibles.
   * **Paso 7**: Revisa el slug y presiona **"Publicar Invitación"**.
5. Abre la invitación publicada en `vista-invitacion.html?slug=tu-slug`.
6. Prueba confirmar asistencia desde el formulario RSVP o enviando un mensaje directo a WhatsApp.
7. Vuelve al dashboard para comprobar cómo se incrementan las métricas de visitas y confirmaciones en tiempo real.