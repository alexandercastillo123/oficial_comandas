# Manual de Instalación — La Ideal Comandas (Producción)

---

## 1. Requisitos previos

- **Docker Desktop** instalado y con WSL 2 habilitado.
- **PowerShell** (ya viene en Windows).
- Un **celular Android** en la misma red Wi-Fi.
- El **APK** del sistema (se entrega aparte, no requiere instalación adicional).

---

## 2. Estructura del proyecto (lo que sí sirve)

```
oficial/
├── docker-compose.yml
├── .env
├── backend/
│   ├── .env
│   ├── src/
│   └── Dockerfile
├── base_de_datos/
│   └── app_la_ideal_comanda.sql
└── README.md
```

> Todo lo demás está en `no_necesaria_para_sistema_local/` y no se necesita para instalar en la sucursal.

---

## 3. Configuración inicial

### Paso 1 — Editar el `.env`

Abrir `D:\Proyectos Trabajos\oficial\.env` y verificar que tenga:

```env
DB_LOCAL_HOST=la_ideal_sql_local
DB_LOCAL_USER=sa
DB_LOCAL_PASS=SuperSecret123!
DB_LOCAL_NAME=la_ideal_cafeteria
ID_TIENDA=2
```

- `ID_TIENDA=2` corresponde a **TIENDA 1** (ver tabla `tienda` en el script SQL).
- Si en el futuro necesitan otra sucursal, cambiar ese número por el `id_tienda` que corresponda.

Abrir también `D:\Proyectos Trabajos\oficial\backend\.env` y confirmar que tenga los **mismos valores**.

---

## 4. Levantar el sistema

Abrir **PowerShell** en `D:\Proyectos Trabajos\oficial` y ejecutar **en este orden**:

### 4.1. Limpiar todo (solo la primera vez o si quieren resetear)
```powershell
docker compose down -v
```

### 4.2. Levantar SQL Server
```powershell
docker compose up -d la_ideal_sql_local
```

### 4.3. Esperar 20 segundos
```powershell
Start-Sleep -Seconds 20
```

### 4.4. Ejecutar el script para crear la base de datos con datos iniciales
```powershell
docker run --rm --network=oficial_default -v "D:\Proyectos Trabajos\oficial\base_de_datos\app_la_ideal_comanda.sql:/tmp/script.sql" mcr.microsoft.com/mssql-tools /opt/mssql-tools/bin/sqlcmd -S la_ideal_sql_local -U sa -P "SuperSecret123!" -d master -i /tmp/script.sql
```

Esto crea la base `la_ideal_cafeteria`, todas las tablas, catálogos, usuarios de prueba y registros de sincronización.

### 4.5. Levantar el backend
```powershell
docker compose up -d la_ideal_api_local
```

### 4.6. Verificar que todo está corriendo

```powershell
docker compose ps
```

Deben ver `la_ideal_sql_local` y `la_ideal_api_local` con estado `Up`.

Para ver los logs del backend:
```powershell
docker compose logs -f la_ideal_api_local
```

Deben ver al final:
```
🚀 Servidor ejecutándose en el puerto 3000 (sucursal 2)
ℹ️ downSync omitido: cloud no está configurado.
ℹ️ userSync omitido: cloud no está configurado.
ℍ️ upSync omitido: nube no disponible.
```

Eso significa que el sistema está funcionando en modo local correctamente.

---

## 5. Configurar el celular

1. Instalar el APK en el celular.
2. Abrir la app.
3. Presionar el ícono de engranaje (⚙️) en el login.
4. Ingresar la IP de la computadora (ejemplo: `192.168.1.7`).
   - Para averiguar la IP en Windows: `ipconfig` y buscar la IP del adaptador Wi-Fi/Ethernet.
5. Presionar **"Comprobar conexión"** → debe ponerse verde.
6. Presionar **"Guardar en Celular"**.
7. Hacer login:
   - Usuario: `FRANKLYN.AQUINO`
   - Contraseña: `Ideal2026`

---

## 6. Comandos útiles

| Acción | Comando |
|:---|:---|
| Ver logs del backend | `docker compose logs -f la_ideal_api_local` |
| Ver logs de SQL Server | `docker compose logs -f la_ideal_sql_local` |
| **Parar solo el backend** | `docker compose stop la_ideal_api_local` |
| **Iniciar solo el backend** | `docker compose start la_ideal_api_local` |
| Reiniciar el backend | `docker compose restart la_ideal_api_local` |
| Ver estado de los servicios | `docker compose ps` |
| Apagar TODO el sistema | `docker compose down` |
| **Resetear TODO (borrar datos)** | `docker compose down -v` (luego repetir pasos 4.2 a 4.5) |

---

## 7. Cambiar a modo nube (cuando esté disponible)

Si tienen una base de datos en la nube, editar `.env` y `backend/.env` con las credenciales cloud:

```env
DB_CLOUD_HOST=...
DB_CLOUD_USER=...
DB_CLOUD_PASSWORD=...
DB_CLOUD_NAME=...
```

Luego reiniciar el backend:
```powershell
docker compose restart la_ideal_api_local
```

El sistema automáticamente empezará a sincronizar con la nube (bajada de catálogos y subida de datos locales).

---

## 8. Solución de problemas

### No puedo conectarme desde el APK
- Verificar que celular y PC estén en la misma red Wi-Fi.
- Verificar la IP: `ipconfig` en Windows.
- Verificar que el backend esté corriendo: `docker compose ps`.
- Revisar firewall de Windows (permitir puerto 3000).

### El backend no arranca
- Revisar logs: `docker compose logs -f la_ideal_api_local`.
- Verificar que SQL Server esté corriendo: `docker compose ps`.
- Confirmar que el `.env` tenga la contraseña correcta.
- Si modificaron la BD y quieren resetear: `docker compose down -v` y repetir los pasos 4.2 a 4.5.

### No se guarda la dirección en el perfil
- Esto ya está corregido en la versión actual del APK.
- Si usan una versión anterior, solo pueden editar nombre y teléfono desde el perfil.

