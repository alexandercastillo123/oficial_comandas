# Documentación: La Ideal Comandas — Despliegue y arquitectura

## 1. Visión general

El sistema funciona ** offline-first ** por sucursal:

- Cada sucursal tiene su **backend local** (Docker) y su **base de datos local** (SQL Server en Docker).
- El **frontend (APK)** se conecta a ese backend local por IP.
- Cuando hay internet, el backend sincroniza con la nube:
  - **Bajada**: catálogos generales (productos, precios, categorías).
  - **Subida**: operativo de la sucursal (comandas, tickets, mesas).
- No se duplican datos entre sucursales porque todo se filtra por `id_tienda`.

---

## 2. Arquitectura

```
┌─────────────┐     HTTP/JSON      ┌──────────────────┐     JDBC/ODBC     ┌──────────────────┐
│   APK       │ ──────────────────> │  Backend Local   │ ────────────────> │ SQL Server Local  │
│  (Celular)  │  192.168.1.X:3000  │   (Node/Express) │   Docker/red      │   (Docker)        │
└─────────────┘                     └──────────────────┘                   └──────────────────┘
                                            │
                                            │ TLS / REST (cuando hay internet)
                                            ▼
                                   ┌──────────────────┐
                                   │   Backend Nube   │   (futuro)
                                   │   (misma lógica) │
                                   └──────────────────┘
```

### Componentes

| Componente | Tecnología | Rol |
|---|---|---|
| **Frontend** | React Native (APK) | Interfaz mozo/chef/admin. Captura pedidos, mesas, tickets. |
| **Backend** | Node + Express + `mssql` | API REST, auth JWT, lógica de comandas, sincronización. |
| **SQL Server** | Docker (`mcr.microsoft.com/mssql/server:2022-latest`) | BD local por sucursal. |
| **Docker Compose** | Orquesta backend + BD. | Un solo `docker compose up -d` levanta todo. |
| **Sync** | Servicios Node + tabla `sync_control` | Decide qué bajar/subir según timestamps. |

---

## 3. Flujo offline-first

1. **Sin internet**: el APK habla con el backend local, el backend lee/escribe en SQL Server local. Todo funciona.
2. **Con internet**: el backend detecta conectividad con la nube y ejecuta la sincronización:
   - **Bajada**: trae productos/categorías nuevos o modificados (`fecha_modificacion > ultima_descarga`).
   - **Subida**: envía comandas/tickets/mesas modificados localmente que aún no están en la nube.
3. **Deduplicación**: se usa `id_tienda` como “namespace” y timestamps en `sync_control` para no reprocesar lo mismo.

---

## 4. Sincronización bidireccional (diseño)

### 4.1 Bajada (nube → local) — solo catálogos
- **Tablas afectadas**: `producto`, `categoria`, `grupo`, `moneda`, `unidad_medida`, `tienda`, `cargo`, `usuario`, `usuario_tienda`.
- **Cuándo**: cada X minutos o al detectar internet.
- **Cómo**: 
  1. Leer `sync_control.ultima_descarga` por tabla.
  2. Consultar nube: `SELECT * FROM tabla WHERE fecha_modificacion > @fecha`.
  3. Hacer `MERGE` en local para insertar/actualizar sin duplicados.
  4. Actualizar `sync_control`.

### 4.2 Subida (local → nube) — solo operativo de la sucursal
- **Tablas afectadas**: `comanda_cab`, `comanda_det`, `mesa` (cambios de estado).
- **Cuándo**: cada X minutos o cuando se cierra/entrega un ticket.
- **Cómo**:
  1. Leer `sync_control.ultima_subida` por tabla.
  2. Consultar local: `SELECT * FROM tabla WHERE sync_estado = 0 AND id_tienda = ? AND fecha_creacion > @fecha`.
  3. Enviar a la nube (insert/update).
  4. Marcar `sync_estado = 1`, `sync_fecha = now()`.
  5. Actualizar `sync_control.ultima_subida`.

### 4.3 Reglas anti-duplicados
- **Identidad**: en local se acepta el `id` generado localmente; la nube no debe regenerar PK.
- **Filtro por sucursal**: toda subida/bajada incluye `WHERE id_tienda = X` (o su equivalente).
- **Control de concurrencia**: `sync_intentos` y `sync_estado` en `comanda_cab`/`comanda_det` para reintentos.

---

## 5. Estructura del proyecto

```
oficial/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Pool local (tolerante, sin nube obligatoria)
│   │   ├── server.js             # Arranque: solo local, sync tolerante
│   │   ├── app.js                # Rutas Express
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/         # Solo usan getLocalPool
│   │   ├── routes/
│   │   └── services/             # downSync / upSync (futuro) / tolerantes
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── android/                  # Manifest + local.properties
│   └── src/
│       ├── constants/config.js   # IP sucursal, AsyncStorage
│       ├── services/api.js       # Axios dinámico por IP
│       └── screens/
└── base_de_datos/
    └── app_la_ideal_comanda.sql  # Esquema + seed

docker-compose.yml               # Levanta SQL Server + Backend
```

---

## 6. Requisitos para levantar en otra máquina

- **Docker Desktop** instalado y corriendo.
- **Puertos disponibles**:
  - `1433` (SQL Server)
  - `3000` (Backend API)
- Acceso a la LAN para que el celular llegue a la IP del servidor.

---

## 7. Pasos de instalación (para el jefe / nuevo equipo)

### 7.1 Clonar el proyecto

```powershell
git clone <URL_DEL_REPO>
cd oficial
```

### 7.2 Configurar variables de entorno

Editar el archivo `.env` en la raíz (crearlo si no existe):

```env
DB_LOCAL_USER=sa
DB_LOCAL_PASS=TuPassword123!
DB_LOCAL_NAME=la_ideal_cafeteria
DB_LOCAL_PORT=1433
API_PORT=3000
JWT_SECRET=super_secret_jwt_key_la_ideal_2026

# (Opcionales, solo si hay nube)
# DB_CLOUD_HOST=cloud_sql_server_host
# DB_CLOUD_PORT=1433
# DB_CLOUD_USER=...
# DB_CLOUD_PASSWORD=...
# DB_CLOUD_NAME=...
```

> **Importante**: `DB_LOCAL_PASS` debe cumplir con la política de SQL Server (al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos).

### 7.3 Levantar servicios en Docker

```powershell
docker compose up -d --build
```

- `--build` recompila la imagen del backend.
- `-d` lo deja corriendo en segundo plano.

Ver logs:

```powershell
docker compose logs -f la_ideal_api_local
```

Esperar ver:

```
🚀 Servidor ejecutándose en el puerto 3000
ℹ️ downSync omitido: cloud no está configurado.
ℹ️ userSync omitido: cloud no está configurado.
ℹ️ pedidoSync omitido: cloud no está configurado.
```

### 7.4 Crear la base de datos y cargar datos

El SQL Server tarda unos segundos en estar listo. Verificar que el contenedor esté “healthy”:

```powershell
docker compose ps
```

Cuando `la_ideal_sql_local` aparezca como `healthy` o `running`, ejecutar el script:

Opción A — desde PowerShell (Windows):

```powershell
Get-Content base_de_datos\app_la_ideal_comanda.sql -Raw | docker exec -i la_ideal_sql_local /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "TuPassword123!" -d la_ideal_cafeteria
```

Opción B — copiar el archivo dentro del contenedor y ejecutarlo:

```powershell
docker cp base_de_datos\app_la_ideal_comanda.sql la_ideal_sql_local:/tmp/script.sql
docker exec la_ideal_sql_local /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "TuPassword123!" -d la_ideal_cafeteria -i /tmp/script.sql
```

> **Nota**: la primera vez el script incluye `DROP DATABASE` y `CREATE DATABASE`, así que puedes ejecutarlo incluso si ya existía.

### 7.5 Verificar que el backend conecta

```powershell
curl http://localhost:3000/health
```

Debe responder:

```json
{"status":"ok","timestamp":"2026-06-10T..."}
```

### 7.6 Obtener la IP local (para el APK)

En Windows:

```powershell
ipconfig
```

Buscar “Adaptador de Ethernet” o “Wi-Fi” y copiar la **Dirección IPv4** (ej: `192.168.1.7`).

### 7.7 Configurar el APK

1. Abrir la app en el celular.
2. En la pantalla de login, presionar el ícono de engranaje (⚙️).
3. Ingresar la IP del servidor (ej: `192.168.1.7`).
4. Presionar **“Comprobar conexión”** → debe ponerse verde.
5. Presionar **“Guardar en Celular”**.
6. Ingresar usuario y clave. Usuarios de prueba:
   - `FRANKLYN.AQUINO` / `Ideal2026` (Administrador)
   - Cualquier mozo (ej: `MOZO.T1`) / `Ideal2026`

---

## 8. Comandos útiles (resumen)

| Acción | Comando |
|---|---|
| Levantar todo | `docker compose up -d --build` |
| Ver logs backend | `docker compose logs -f la_ideal_api_local` |
| Ver logs BD | `docker compose logs -f la_ideal_sql_local` |
| Ejecutar SQL inicial | (ver 7.4) |
| Probar health | `curl http://localhost:3000/health` |
| Apagar | `docker compose down` |
| Apagar y borrar volúmenes | `docker compose down -v` |

---

## 9. Buenas prácticas de la arquitectura

- **Offline-first**: la sucursal no depende de internet para operar.
- **Dockerización total**: no hay dependencias externas; solo Docker Desktop.
- **Tolerancia a fallos**: si la nube no está configurada, el backend arranca igual y los sync se omiten sin crash.
- **IP configurable**: no hay IP hardcodeada; se guarda en el celular.
- **Token JWT**: stateless, sin sesiones en servidor.
- **Clear-text HTTP permitido** solo en red local (LAN); para producción se debe habilitar HTTPS.

---

## 10. ¿Qué falta para producción?

1. **Implementar el `upSync`** (subida local → nube) con manejo de errores y reintentos.
2. **BD en la nube**: esquema idéntico al local, con `id_tienda` filtrando los datos por sucursal.
3. **HTTPS**: levantar un reverse proxy (Nginx/Traefik) con cert `Let’s Encrypt` delante del backend.
4. **Backup automatizado** del SQL Server local y respaldos en nube.
5. **Cola de sincronización** (tabla `sync_queue`) para garantizar que no se pierden subidas aunque se corte el internet a mitad de envío.

---

## 11. Explicación corta para el jefe

> Tenemos una app móvil para mozos y chefs. Cada sucursal tiene su servidor y base de datos locales (Docker). Con o sin internet, la sucursal trabaja normal: toma pedidos, imprime tickets, maneja mesas. Cuando hay internet, el sistema sube solo lo nuevo de esa sucursal a la nube, y baja cambios de catálogo (nuevos productos, precios). No se mezclan datos entre sucursales porque cada registro está marcado con su sucursal. El deploy es: clonar el repo, `docker compose up`, cargar el script SQL una sola vez, y darle al celular la IP del servidor.

---

