/*
================================================================================
  BASE DE DATOS: la_ideal_cafeteria
  PROYECTO    : M�dulo de Comandas - App M�vil (Panader�a y Pasteler�a La Ideal S.A.C.)
  RUC         : 20609341867
  MOTOR       : SQL Server 2019+
  ORIGEN      : Adaptaci�n de app_pan_rico (MySQL) al m�dulo de comandas

  CONVENCIONES:
  [? NUEVO]         = Tabla/columna NUEVA, no exist�a en la BD original MySQL
  [? MODIFICADO]   = Columna o tabla que exist�a pero se ajust� para comandas
  [? ORIGINAL]     = Sin cambios respecto a la BD original
  [? MYSQL?SQLSVR] = Conversi�n de sintaxis MySQL ? SQL Server (no cambio de l�gica)

  FLUJO DE ROLES:
  ADMINISTRADOR ? Dashboard + Gesti�n de trabajadores + Gesti�n de mesas + Perfil
  MOZO          ? Vista mesas + Toma de pedidos + Gesti�n de tickets + Perfil
  CHEF          ? Pantalla de visualizaci�n de comandas pendientes (solo lectura)
================================================================================
*/

USE master;
GO
IF DB_ID('la_ideal_cafeteria') IS NOT NULL
    DROP DATABASE la_ideal_cafeteria;
GO
CREATE DATABASE la_ideal_cafeteria COLLATE Modern_Spanish_CI_AI;
GO
USE la_ideal_cafeteria;
GO

SET NOCOUNT ON;
GO

/* ============================================================
   1. TIENDA  [? ORIGINAL]
   Representa cada sucursal/almac�n de la empresa.
   Relaciones:
     1 tienda  ? N usuarios       (via usuario_tienda)
     1 tienda  ? N mesas          (via mesa)
     1 tienda  ? N comandas_cab   (via comanda_cab)
   ============================================================ */
CREATE TABLE tienda (
    id_tienda    INT          IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR] AUTO_INCREMENT ? IDENTITY
    descripcion  VARCHAR(100) NULL,                        -- [? ORIGINAL] Nombre de la sucursal ej: 'TIENDA 1'
    ubicacion    VARCHAR(200) NULL,                        -- [? ORIGINAL] Direcci�n f�sica
    estado       BIT          NOT NULL DEFAULT 1,          -- [? MYSQL?SQLSVR] TINYINT(1) ? BIT  (1=activo, 0=inactivo)
    tipo_tienda  VARCHAR(10)  NOT NULL DEFAULT 'TIENDA'    -- [? MYSQL?SQLSVR] ENUM ? VARCHAR con CHECK
        CHECK (tipo_tienda IN ('TIENDA','ALMACEN'))
);
GO

/* ============================================================
   2. CARGO  [? MODIFICADO]
   Cat�logo de puestos de trabajo. En el m�dulo de comandas
   los cargos relevantes son: Administrador (id=1), Mozo (id=14,
   NUEVO), Chef (id=7).
   La columna 'rol_app' es nueva: mapea el cargo al rol de la app.
   Relaciones:
     1 cargo ? N usuarios  (via usuario.id_cargo)
   ============================================================ */
CREATE TABLE cargo (
    id_cargo    INT          IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR]
    descripcion VARCHAR(80)  NULL,                        -- [? ORIGINAL]
    estado      BIT          NOT NULL DEFAULT 1,          -- [? MYSQL?SQLSVR] TINYINT(1) ? BIT
    rol_app     VARCHAR(20)  NULL                         -- [? NUEVO] Rol funcional en la app: 'ADMIN'|'MOZO'|'CHEF'|NULL
        CHECK (rol_app IN ('ADMIN','MOZO','CHEF') OR rol_app IS NULL)
);
GO

/* ============================================================
   3. USUARIO  [? MODIFICADO]
   Usuarios del sistema. El login de la app usa 'usuario' (username)
   y 'clave' (bcrypt hash).
   Columnas nuevas:
     - avatar_url : foto de perfil del usuario en la app
     - token_fcm  : token push para notificaciones (futuro)
   Relaciones:
     N usuarios ? N tiendas  (via usuario_tienda)
     1 cargo    ? N usuarios
   ============================================================ */
CREATE TABLE usuario (
    id_usuario           INT           IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR]
    nombre               VARCHAR(100)  NULL,                         -- [? ORIGINAL] Nombre completo
    direccion            VARCHAR(40)   NULL,                         -- [? ORIGINAL]
    telefono             VARCHAR(20)   NULL,                         -- [? ORIGINAL]
    documento_identidad  VARCHAR(15)   NULL,                         -- [? ORIGINAL]
    usuario              VARCHAR(100)  NOT NULL UNIQUE,              -- [? ORIGINAL] Username para login
    clave                VARCHAR(255)  NULL,                         -- [? ORIGINAL] Hash bcrypt
    id_cargo             INT           NULL                          -- [? ORIGINAL]
        REFERENCES cargo(id_cargo),
    estado               BIT           NOT NULL DEFAULT 1,           -- [? MYSQL?SQLSVR]
    avatar_url           VARCHAR(500)  NULL,                         -- [? NUEVO] Foto de perfil para la app m�vil
    token_fcm            VARCHAR(255)  NULL,                         -- [? NUEVO] Token Firebase Cloud Messaging (notificaciones push futuras)
    fecha_creacion       DATETIME2     NULL DEFAULT GETDATE(),       -- [? MYSQL?SQLSVR] DATETIME ? DATETIME2
    fecha_actualizacion  DATETIME2     NULL,                         -- [? MYSQL?SQLSVR]
    usuario_creacion     INT           NULL,                         -- [? ORIGINAL]
    usuario_actualizacion INT          NULL,                         -- [? ORIGINAL]
    sync_estado          TINYINT       NOT NULL DEFAULT 0,           -- [? SYNC] 0=pending,1=sincronizado,2=error
    sync_fecha           DATETIME2     NULL,                         -- [? SYNC] �ltima sincronizaci�n con la nube
    sync_intentos         INT           NOT NULL DEFAULT 0           -- [? SYNC] Reintentos autom�ticos
);
GO

/* ============================================================
   4. USUARIO_TIENDA  [? ORIGINAL]
   Relaci�n N:N entre usuarios y tiendas.
   Un usuario puede pertenecer a varias sucursales.
   'es_principal' indica la sucursal home del usuario.
   Uso en la app: al loguearse, si el usuario tiene varias tiendas
   se le muestra selector; si tiene una sola, entra directo.
   Relaciones:
     N usuario ? N tienda
   ============================================================ */
CREATE TABLE usuario_tienda (
    id_usuario_tienda  INT      IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR]
    id_usuario         INT      NOT NULL REFERENCES usuario(id_usuario),  -- [? ORIGINAL]
    id_tienda          INT      NOT NULL REFERENCES tienda(id_tienda),    -- [? ORIGINAL]
    es_principal       BIT      NOT NULL DEFAULT 0,          -- [? MYSQL?SQLSVR] TINYINT ? BIT
    estado             BIT      NOT NULL DEFAULT 1,          -- [? MYSQL?SQLSVR]
    fecha_creacion     DATETIME2 NOT NULL DEFAULT GETDATE(), -- [? MYSQL?SQLSVR]
    usuario_creacion   INT      NULL,                        -- [? ORIGINAL]
    sync_estado        TINYINT  NOT NULL DEFAULT 0,          -- [? SYNC] 0=pending,1=sincronizado,2=error
    sync_fecha         DATETIME2 NULL,                       -- [? SYNC] �ltima sincronizaci�n con la nube
    sync_intentos      INT      NOT NULL DEFAULT 0,          -- [? SYNC] Reintentos autom�ticos
    CONSTRAINT uq_usuario_tienda UNIQUE (id_usuario, id_tienda)  -- [? ORIGINAL]
);
GO

/* ============================================================
   5. GRUPO  [? ORIGINAL]
   Agrupa categor�as de productos. Para comandas solo interesan
   los grupos de productos terminados/ventas (grupo 8 y 9).
   Relaciones:
     1 grupo ? N categor�as
   ============================================================ */
CREATE TABLE grupo (
    id_grupo  INT          IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR]
    detalle   VARCHAR(255) NOT NULL,                    -- [? ORIGINAL] Nombre del grupo ej: 'PRODUCTOS TERMINADOS'
    glosa     VARCHAR(100) NULL,                        -- [? ORIGINAL] Abreviatura
    estado    BIT          NOT NULL DEFAULT 1           -- [? MYSQL?SQLSVR]
);
GO

/* ============================================================
   6. CATEGORIA  [? MODIFICADO]
   Categor�as del men� que ve el mozo en la app.
   La columna 'imagen_url' es nueva: permite mostrar �cono/imagen
   de la categor�a en la pantalla de men� del mozo.
   Relaciones:
     1 grupo    ? N categor�as
     1 categor�a ? N productos
   ============================================================ */
CREATE TABLE categoria (
    id_categoria  INT          IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR]
    nombre        VARCHAR(60)  NOT NULL,                    -- [? ORIGINAL]
    id_grupo      INT          NOT NULL REFERENCES grupo(id_grupo),  -- [? ORIGINAL]
    estado        BIT          NOT NULL DEFAULT 1,          -- [? MYSQL?SQLSVR]
    imagen_url    VARCHAR(500) NULL                         -- [? NUEVO] Imagen/�cono de categor�a para la UI del men�
);
GO

/* ============================================================
   7. PRODUCTO  [? MODIFICADO]
   Cat�logo de productos del men�. El mozo lo consulta para armar
   pedidos. Se usa 'precio_mesa' como precio por defecto de comandas.
   Columnas nuevas:
     - descripcion  : texto descriptivo visible al mozo al hacer tap en producto
     - imagen_url   : foto del producto en la carta digital
   Relaciones:
     1 categor�a  ? N productos
     1 producto   ? N comanda_det
   ============================================================ */
CREATE TABLE producto (
    id_producto          INT           IDENTITY(1,1) PRIMARY KEY,  -- [? MYSQL?SQLSVR]
    nombre               VARCHAR(80)   NOT NULL,                    -- [? ORIGINAL]
    barra                VARCHAR(50)   NULL UNIQUE,                 -- [? ORIGINAL] C�digo de barras
    costo_actual         DECIMAL(10,2) NOT NULL DEFAULT 0.00,       -- [? ORIGINAL]
    id_moneda            INT           NOT NULL DEFAULT 1,          -- [? ORIGINAL] FK ? moneda (PEN por defecto)
    precio_mesa          DECIMAL(10,2) NOT NULL DEFAULT 0.00,       -- [? ORIGINAL] Precio que se usa en comandas
    precio_llevar        DECIMAL(10,2) NOT NULL DEFAULT 0.00,       -- [? ORIGINAL]
    precio_delivery      DECIMAL(10,2) NOT NULL DEFAULT 0.00,       -- [? ORIGINAL]
    medida               DECIMAL(10,2) NOT NULL DEFAULT 0.00,       -- [? ORIGINAL]
    estado               BIT           NOT NULL DEFAULT 1,          -- [? MYSQL?SQLSVR]
    id_categoria         INT           NOT NULL REFERENCES categoria(id_categoria),  -- [? ORIGINAL]
    id_unidad_medida     INT           NOT NULL DEFAULT 1,          -- [? ORIGINAL]
    id_unidad_medida_venta INT         NULL,                        -- [? ORIGINAL]
    descripcion          VARCHAR(500)  NULL,                        -- [? NUEVO] Descripci�n visible en detalle del producto (mozo tap)
    imagen_url           VARCHAR(500)  NULL                         -- [? NUEVO] Foto del producto para la carta digital en la app
);
GO

/* ============================================================
   8. MESA  [? NUEVA - no exist�a en la BD original]
   Mesas f�sicas de cada sucursal. El Administrador las gestiona
   (crear/editar/eliminar). El Mozo las ve en la pantalla principal.
   Estados de mesa:
     LIBRE       ? verde   (sin comanda activa)
     OCUPADA     ? amarillo (tiene al menos una comanda EN_COCINA o pendiente)
     PRE_CUENTA  ? celeste (cliente pidi� la cuenta)
   Nota: el paso a LIBRE ocurre cuando el cajero cierra el pago,
   pero desde comandas el mozo puede marcar PRE_CUENTA.
   Relaciones:
     1 tienda ? N mesas
     1 mesa   ? N comanda_cab
   ============================================================ */
CREATE TABLE mesa (
    id_mesa       INT           IDENTITY(1,1) PRIMARY KEY,   -- [? NUEVO]
    id_tienda     INT           NOT NULL REFERENCES tienda(id_tienda),  -- [? NUEVO] Sucursal a la que pertenece
    numero        VARCHAR(20)   NOT NULL,                     -- [? NUEVO] Nombre/n�mero ej: 'Mesa 1', 'Barra A'
    capacidad     INT           NULL,                         -- [? NUEVO] Nro m�ximo de personas (informativo)
    estado_mesa   VARCHAR(15)   NOT NULL DEFAULT 'LIBRE'      -- [? NUEVO] Estado visual: 'LIBRE'|'OCUPADA'|'PRE_CUENTA'
        CHECK (estado_mesa IN ('LIBRE','OCUPADA','PRE_CUENTA')),
    estado        BIT           NOT NULL DEFAULT 1,           -- [? NUEVO] 1=activo, 0=eliminada l�gicamente
    sync_estado   TINYINT       NOT NULL DEFAULT 0,           -- [? SYNC] 0=pending,1=sincronizado,2=error
    sync_fecha    DATETIME2     NULL,                         -- [? SYNC] �ltima vez que se sincroniz� con la nube
    sync_intentos INT           NOT NULL DEFAULT 0,           -- [? SYNC] Contador de reintentos de sync
    fecha_creacion DATETIME2    NOT NULL DEFAULT GETDATE(),   -- [? NUEVO]
    usuario_creacion INT        NULL,                         -- [? NUEVO] Qui�n cre� la mesa (admin)
    CONSTRAINT uq_mesa_tienda_numero UNIQUE (id_tienda, numero)  -- [? NUEVO] No puede haber 2 mesas con mismo n�mero en misma tienda
);
GO

/* ============================================================
   9. COMANDA_CAB  [? NUEVA - equivale a un 'ticket' de pedido]
   Cabecera de cada comanda/ticket. Una mesa puede tener M�LTIPLES
   comandas activas (el cliente puede pedir m�s cosas despu�s).
   Flujo de estados:
     EN_COCINA   ? Mozo mand� a cocina. Chef la ve en pantalla.
     ENTREGADO   ? Mozo marc� el pedido como entregado.
     PRE_CUENTA  ? Cliente pidi� la cuenta. Mesa pasa a PRE_CUENTA.
     CERRADO     ? Pago confirmado por caja. Mesa vuelve a LIBRE.
   El campo nro_ticket se autogenera con formato: TKT-{YYYYMMDD}-{seq}
   Relaciones:
     1 mesa          ? N comanda_cab
     1 tienda        ? N comanda_cab
     1 usuario(mozo) ? N comanda_cab
     1 comanda_cab   ? N comanda_det
   ============================================================ */
CREATE TABLE comanda_cab (
    id_comanda_cab      INT           IDENTITY(1,1) PRIMARY KEY,   -- [? NUEVO]
    nro_ticket          VARCHAR(30)   NOT NULL UNIQUE,              -- [? NUEVO] N�mero legible del ticket ej: TKT-20260601-001
    id_mesa             INT           NOT NULL REFERENCES mesa(id_mesa),          -- [? NUEVO]
    id_tienda           INT           NOT NULL REFERENCES tienda(id_tienda),      -- [? NUEVO] Desnormalizado para consultas r�pidas del chef/dashboard
    id_usuario_mozo     INT           NOT NULL REFERENCES usuario(id_usuario),    -- [? NUEVO] Mozo que tom� el pedido
    nombre_cliente      VARCHAR(100)  NULL,                         -- [? NUEVO] Solo nombre de pila para llamarlo cuando est� listo
    estado_comanda      VARCHAR(15)   NOT NULL DEFAULT 'EN_COCINA'  -- [? NUEVO] Estado del ticket
        CHECK (estado_comanda IN ('EN_COCINA','ENTREGADO','PRE_CUENTA','CERRADO')),
    subtotal            DECIMAL(10,2) NOT NULL DEFAULT 0.00,        -- [? NUEVO] Suma de subtotales de items
    igv                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,        -- [? NUEVO] IGV calculado si aplica
    total               DECIMAL(10,2) NOT NULL DEFAULT 0.00,        -- [? NUEVO] Total de la comanda
    reimpresiones       INT           NOT NULL DEFAULT 0,           -- [? NUEVO] Contador de veces que se reimprimi� en cocina
    observacion         VARCHAR(255)  NULL,                         -- [? NUEVO] Nota general del pedido al chef
    sync_estado         TINYINT       NOT NULL DEFAULT 0,           -- [? SYNC] 0=pending,1=sincronizado,2=error
    sync_fecha          DATETIME2     NULL,                         -- [? SYNC] �ltima sincronizaci�n con la nube
    sync_intentos       INT           NOT NULL DEFAULT 0,           -- [? SYNC] Reintentos autom�ticos
    fecha_creacion      DATETIME2     NOT NULL DEFAULT GETDATE(),   -- [? NUEVO] Momento en que se mand� a cocina
    fecha_actualizacion DATETIME2     NULL,                         -- [? NUEVO] �ltimo cambio de estado
    usuario_creacion    INT           NULL                          -- [? NUEVO] FK impl�cita ? id_usuario_mozo
);
GO

-- �ndices para b�squedas frecuentes en la vista del chef y del mozo
CREATE INDEX IX_comanda_cab_tienda_estado
    ON comanda_cab (id_tienda, estado_comanda, fecha_creacion);  -- [? NUEVO] Listado chef: WHERE id_tienda=? AND estado='EN_COCINA' ORDER BY fecha_creacion ASC
CREATE INDEX IX_comanda_cab_mesa
    ON comanda_cab (id_mesa, estado_comanda);                    -- [? NUEVO] Tickets activos de una mesa
GO

/* ============================================================
  10. COMANDA_DET  [? NUEVA - detalle de productos de cada comanda]
   Cada fila es un producto pedido dentro de un ticket.
   Estado por �tem permite que el chef sepa qu� ya est� listo.
   Nota: el chef VE los items; el mozo los marca como ENTREGADO
   cuando lleva el plato a la mesa.
   Relaciones:
     1 comanda_cab ? N comanda_det
     1 producto    ? N comanda_det
   ============================================================ */
CREATE TABLE comanda_det (
    id_comanda_det    INT           IDENTITY(1,1) PRIMARY KEY,  -- [? NUEVO]
    id_comanda_cab    INT           NOT NULL REFERENCES comanda_cab(id_comanda_cab) ON DELETE CASCADE,  -- [? NUEVO]
    id_producto       INT           NOT NULL REFERENCES producto(id_producto),                         -- [? NUEVO]
    cantidad          DECIMAL(10,2) NOT NULL DEFAULT 1.00,      -- [? NUEVO]
    precio_unitario   DECIMAL(10,2) NOT NULL,                   -- [? NUEVO] precio_mesa del producto en el momento del pedido (snapshot)
    descuento         DECIMAL(10,2) NOT NULL DEFAULT 0.00,      -- [? NUEVO]
    subtotal          DECIMAL(10,2) NOT NULL,                   -- [? NUEVO] (cantidad * precio_unitario) - descuento
    observacion_item  VARCHAR(255)  NULL,                       -- [? NUEVO] Nota del mozo por �tem ej: 'sin cebolla', 't�rmino 3/4'
    estado_item       VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE'-- [? NUEVO] Estado por producto
        CHECK (estado_item IN ('PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO')),
    sync_estado       TINYINT       NOT NULL DEFAULT 0,         -- [? SYNC] 0=pending,1=sincronizado,2=error
    sync_fecha        DATETIME2     NULL,                       -- [? SYNC] �ltima sincronizaci�n con la nube
    sync_intentos     INT           NOT NULL DEFAULT 0,         -- [? SYNC] Reintentos autom�ticos
    fecha_creacion    DATETIME2     NOT NULL DEFAULT GETDATE()   -- [? NUEVO]
);
GO

/* ============================================================
   13. SYNC_CONTROL � Tabla de control de sincronizaci�n
   Registra la �ltima fecha de descarga y subida por tabla
   para sincronizaci�n bidireccional local <-> nube.
   Cada sucursal tiene su propio registro.
   ============================================================ */
CREATE TABLE sync_control (
    id_sync_control INT IDENTITY(1,1) PRIMARY KEY,
    id_tienda       INT NOT NULL REFERENCES tienda(id_tienda),
    tabla           VARCHAR(50) NOT NULL,
    ultima_descarga DATETIME2 NULL,
    ultima_subida   DATETIME2 NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'OK',
    mensaje_error   VARCHAR(255) NULL,
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uq_sync_control_tienda_tabla UNIQUE (id_tienda, tabla)
);
GO
CREATE INDEX IX_sync_control_tienda ON sync_control(id_tienda);
GO

/* Datos iniciales de sincronizaci�n para TIENDA 1 (busca id_tienda por descripcion para no depender de numeros fijos) */
INSERT INTO sync_control (id_tienda, tabla, estado)
SELECT t.id_tienda, v.tabla, v.estado
FROM tienda t
CROSS JOIN (VALUES
    ('tienda'), ('cargo'), ('usuario'), ('usuario_tienda'),
    ('grupo'), ('categoria'), ('producto'), ('moneda'),
    ('unidad_medida'), ('mesa'), ('comanda_cab'), ('comanda_det')
) v(tabla, estado)
WHERE t.descripcion = 'TIENDA 1';
GO

CREATE INDEX IX_comanda_det_cab ON comanda_det(id_comanda_cab);  -- [? NUEVO]
GO

/* ============================================================
  11. MONEDA  [? ORIGINAL - se mantiene para FK en producto]
   Solo se referencia desde producto.id_moneda.
   ============================================================ */
CREATE TABLE moneda (
    id_moneda    INT           IDENTITY(1,1) PRIMARY KEY,
    codigo       CHAR(3)       NOT NULL UNIQUE,
    simbolo      VARCHAR(5)    NOT NULL,
    nombre       VARCHAR(50)   NOT NULL,
    tipo_cambio  DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    orden        INT           NOT NULL DEFAULT 1,
    estado       BIT           NOT NULL DEFAULT 1
);
GO

/* ============================================================
  12. UNIDAD_MEDIDA  [? ORIGINAL - se mantiene para FK en producto]
   ============================================================ */
CREATE TABLE unidad_medida (
    id_unidad_medida  INT         IDENTITY(1,1) PRIMARY KEY,
    descripcion       VARCHAR(50) NOT NULL,
    glosa             VARCHAR(10) NOT NULL UNIQUE,
    estado            BIT         NOT NULL DEFAULT 1
);
GO

/* Agregar FKs a producto ahora que las tablas de soporte existen */
ALTER TABLE producto ADD CONSTRAINT FK_producto_moneda
    FOREIGN KEY (id_moneda) REFERENCES moneda(id_moneda);
ALTER TABLE producto ADD CONSTRAINT FK_producto_unidad
    FOREIGN KEY (id_unidad_medida) REFERENCES unidad_medida(id_unidad_medida);
GO

/* ============================================================
   DATOS MAESTROS - TIENDAS
   Fuente: SQL original + Excel MAESTROS.xlsx (hoja PERSONAL ? columna Locales)
   Se identificaron: PLANTA, TIENDA 1..10 (sin TIENDA 8 en el Excel)
   ============================================================ */
SET IDENTITY_INSERT tienda ON;
INSERT INTO tienda (id_tienda, descripcion, ubicacion, estado, tipo_tienda) VALUES
    (1,  'PLANTA DE PRODUCCION', 'Cajamarca', 1, 'ALMACEN'),
    (2,  'TIENDA 1',  '', 1, 'TIENDA'),
    (3,  'TIENDA 2',  '', 1, 'TIENDA'),
    (4,  'TIENDA 3',  '', 1, 'TIENDA'),
    (5,  'TIENDA 4',  '', 1, 'TIENDA'),
    (6,  'TIENDA 5',  '', 1, 'TIENDA'),
    (7,  'TIENDA 6',  '', 1, 'TIENDA'),
    (8,  'TIENDA 7',  '', 1, 'TIENDA'),
    (9,  'TIENDA 8',  '', 1, 'TIENDA'),
    (10, 'TIENDA 9',  '', 1, 'TIENDA'),
    (11, 'TIENDA 10', '', 1, 'TIENDA');
SET IDENTITY_INSERT tienda OFF;
GO

/* ============================================================
   DATOS MAESTROS - CARGOS
   Fuente: hoja CARGOS del Excel + cargos existentes en el SQL original.
   El campo 'rol_app' [? NUEVO] mapea solo 3 cargos al m�dulo comandas:
     Administrador ? 'ADMIN'  (dashboard + trabajadores + mesas + perfil)
     Chef          ? 'CHEF'   (pantalla solo lectura de pedidos pendientes)
     Mozo          ? 'MOZO'   (mesas + toma de pedidos + tickets + perfil)
   Resto de cargos tienen rol_app = NULL (no usan esta app)
   ============================================================ */
SET IDENTITY_INSERT cargo ON;
INSERT INTO cargo (id_cargo, descripcion, estado, rol_app) VALUES
    (1,  'Administrador',         1, 'ADMIN'),
    (2,  'Almacenero',            1,  NULL),
    (3,  'Cajero',                1,  NULL),
    (4,  'Chef',                  1, 'CHEF'),
    (5,  'Contador',              1,  NULL),
    (6,  'Gerente',               1,  NULL),
    (7,  'Guias y distribucion',  1,  NULL),
    (8,  'Jefa de tienda',        1,  NULL),
    (9,  'Jefe de embutidos',     1,  NULL),
    (10, 'Jefe de logistica',     1,  NULL),
    (11, 'Jefe de Planta',        1,  NULL),
    (12, 'Supervisor de Camaras', 1,  NULL),
    (13, 'Supervisora de Tiendas',1,  NULL),
    (14, 'Mozo',                  1, 'MOZO');  -- [? NUEVO] Cargo creado para el m�dulo de comandas
SET IDENTITY_INSERT cargo OFF;
GO

SET IDENTITY_INSERT moneda ON;
INSERT INTO moneda (id_moneda,codigo,simbolo,nombre,tipo_cambio,orden,estado) VALUES
    (1,'PEN','S/','Sol Peruano',1.0000,1,1),
    (2,'USD','$','D�lar Americano',3.8000,2,1),
    (3,'CNY','�','Yuan Chino',0.5200,3,1);
SET IDENTITY_INSERT moneda OFF;
GO

SET IDENTITY_INSERT unidad_medida ON;
INSERT INTO unidad_medida (id_unidad_medida,descripcion,glosa,estado) VALUES
    (1,'Unidad','UND',1),(2,'Kilogramo','KG',1),(3,'Litro','LT',1),
    (4,'Gramo','GR',1),(5,'Mililitro','ML',1),(6,'Caja','CJA',1),
    (7,'Paquete','PQT',1),(8,'Bolsa','BOL',1),(9,'Porci�n','POR',1),
    (11,'Lata','LATA',1),(12,'Barra','BARRA',1),(13,'SACO','SCO',1);
SET IDENTITY_INSERT unidad_medida OFF;
GO

SET IDENTITY_INSERT grupo ON;
INSERT INTO grupo (id_grupo,detalle,glosa,estado) VALUES
    (7,'INSUMOS','INS',1),
    (8,'PRODUCTOS TERMINADOS','PROD',1),
    (9,'PRODUCTOS VENTAS','PRODV',1),
    (10,'PRE-INSUMOS','PREINS',1);
SET IDENTITY_INSERT grupo OFF;
GO

SET IDENTITY_INSERT categoria ON;
INSERT INTO categoria (id_categoria,nombre,id_grupo,estado,imagen_url) VALUES
    (23,'CAFETERIA',8,1,NULL),
    (24,'EMBOLSADO PANADERIA',8,1,NULL),
    (25,'EMBOLSADO PASTELERIA',8,1,NULL),
    (26,'EMBUTIDOS',8,1,NULL),
    (27,'PANES',8,1,NULL),
    (28,'PASTELES',8,1,NULL),
    (29,'POSTRES',8,1,NULL),
    (30,'TORTAS',8,1,NULL),
    (32,'BOCADITOS',8,1,NULL),
    (33,'BODEGA',8,1,NULL),
    (34,'BODEGA',9,1,NULL),
    (35,'PANES ESPECIALES',8,1,NULL);
SET IDENTITY_INSERT categoria OFF;
GO

/* ============================================================
   PRODUCTOS - Fuente: hoja 'PROD TERMINADO' del Excel MAESTROS.xlsx
   Solo se insertan productos de categor�as de venta (grupo 8 y 9).
   precio_mesa = Precio Venta del Excel.
   descripcion e imagen_url se dejan NULL (se completan desde el admin web).
   ============================================================ */
SET IDENTITY_INSERT producto ON;
INSERT INTO producto (id_producto, nombre, costo_actual, id_moneda, precio_mesa, precio_llevar, precio_delivery, medida, estado, id_categoria, id_unidad_medida, id_unidad_medida_venta, descripcion, imagen_url, barra) VALUES
    (1, 'Mini Empanaditas De Carne - UND', 0.00, 1, 1.10, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B001'),
    (2, 'Mini Alfajorcitos De Maicena - UND', 0.00, 1, 0.80, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B002'),
    (3, 'Mini Cachitos - UND', 0.00, 1, 0.80, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B003'),
    (4, 'Mini Piononos Con Manjar - UND', 0.00, 1, 0.80, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B004'),
    (5, 'Mini Empanadas De Jamon Y Queso - UND', 0.00, 1, 0.80, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B005'),
    (6, 'Mini Pye De Limon - UND', 0.00, 1, 1.00, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B006'),
    (7, 'Mini Hojarascas Vacias - UND', 0.00, 1, 0.30, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B007'),
    (8, 'Mini Muss Vasito Fresa - UND', 0.00, 1, 0.90, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B008'),
    (9, 'Mini Trufas - UND', 0.00, 1, 0.90, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B009'),
    (10, 'Mini Brownis - UND', 0.00, 1, 1.10, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B010'),
    (11, 'Mini Empanadad De Pollo - UND', 0.00, 1, 1.10, 0.00, 0.00, 0.00, 1.00, 32, 1, 1, '1', NULL, 'B011'),
    (12, 'Agua San Luis Sin Gas X 750 Ml - UND', 0.00, 1, 2.00, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B012'),
    (13, 'Coca Cola X 500 Ml - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B013'),
    (14, 'Inca Kola X 500 Ml - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B014'),
    (15, 'Chicolac Gloria X 180Ml Cajita - UND', 0.00, 1, 2.00, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B015'),
    (16, 'Yogurt Yofresh Fresa 180Ml Cajita - UND', 0.00, 1, 2.50, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B016'),
    (17, 'Coca Cola X300Ml - UND', 0.00, 1, 2.00, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B017'),
    (18, 'Fanta Naranja X 500 Ml - UND', 0.00, 1, 2.50, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B018'),
    (19, 'Leche Uht Entera 1L Gloria Caja - UND', 0.00, 1, 7.00, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B019'),
    (20, 'Cerveza Artesanal Usurpadora X 300 Ml - UND', 0.00, 1, 12.00, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B020'),
    (21, 'Coca Cola 3 Lt. - UND', 0.00, 1, 13.00, 0.00, 0.00, 0.00, 1.00, 33, 1, 1, '1', NULL, 'B021'),
    (22, 'Cafe Pasado - UND', 0.00, 1, 4.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B022'),
    (23, 'Sandwich De Pollo - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B023'),
    (24, 'Hamburguesa Clasica - UND', 0.00, 1, 10.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B024'),
    (25, 'Jugo Surtido - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B025'),
    (26, 'Cafe Capuchino - UND', 0.00, 1, 8.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B026'),
    (27, 'Triple De Jamon Y Queso - UND', 0.00, 1, 8.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B027'),
    (28, 'Desayuno Americano - UND', 0.00, 1, 15.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B028'),
    (29, 'Chocolate Con Leche - UND', 0.00, 1, 8.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B029'),
    (30, 'Batido De Fresa - UND', 0.00, 1, 12.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B030'),
    (31, 'Cafe Americano - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B031'),
    (32, 'Jugo De Fresa - UND', 0.00, 1, 8.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B032'),
    (33, 'Salchipapa Clasica - UND', 0.00, 1, 8.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B033'),
    (34, 'Batido De Lucuma - UND', 0.00, 1, 12.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B034'),
    (35, 'Limonada - UND', 0.00, 1, 4.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B035'),
    (36, 'Cafe Expreso - UND', 0.00, 1, 5.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B036'),
    (37, 'Infusion - UND', 0.00, 1, 3.00, 0.00, 0.00, 0.00, 1.00, 23, 1, 1, '1', NULL, 'B037'),
    (38, 'Pan Hamburguesa Embolsado X 480 Gr - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 24, 1, 1, '1', NULL, 'B038'),
    (39, 'Pan Molde Blanco Mediano X800Gr - UND', 0.00, 1, 9.00, 0.00, 0.00, 0.00, 1.00, 24, 1, 1, '1', NULL, 'B039'),
    (40, 'Pan Molde Integral Mediano X800Gr - UND', 0.00, 1, 10.00, 0.00, 0.00, 0.00, 1.00, 24, 1, 1, '1', NULL, 'B040'),
    (41, 'Pan Aleman Embolsado X 300Gr - UND', 0.00, 1, 5.00, 0.00, 0.00, 0.00, 1.00, 24, 1, 1, '1', NULL, 'B041'),
    (42, 'Alfajor De Maicena En Taper - UND', 0.00, 1, 9.00, 0.00, 0.00, 0.00, 1.00, 25, 1, 1, '1', NULL, 'B042'),
    (43, 'Muffins X120 Gr - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 25, 1, 1, '1', NULL, 'B043'),
    (44, 'Trufas Taper X 16 Und - UND', 0.00, 1, 12.00, 0.00, 0.00, 0.00, 1.00, 25, 1, 1, '1', NULL, 'B044'),
    (45, 'Chifon X 570 Gr - UND', 0.00, 1, 12.00, 0.00, 0.00, 0.00, 1.00, 25, 1, 1, '1', NULL, 'B045'),
    (46, 'Hamburguesa De Carne Artesano X 100 Gr - UND', 0.00, 1, 4.00, 0.00, 0.00, 0.00, 1.00, 26, 1, 1, '1', NULL, 'B046'),
    (47, 'Jamonada Especial Artesano - KG', 0.00, 1, 23.00, 0.00, 0.00, 0.00, 1.00, 26, 2, 1, '1', NULL, 'B047'),
    (48, 'Tamal La Ideal - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 26, 1, 1, '1', NULL, 'B048'),
    (49, 'Chorizo Argentino Artesano - KG', 0.00, 1, 28.00, 0.00, 0.00, 0.00, 1.00, 26, 2, 1, '1', NULL, 'B049'),
    (50, 'Hot Dog Artesano - KG', 0.00, 1, 25.00, 0.00, 0.00, 0.00, 1.00, 26, 2, 1, '1', NULL, 'B050'),
    (51, 'Pan Normal Semi Dulce - KG', 0.00, 1, 7.90, 0.00, 0.00, 0.00, 1.00, 27, 2, 1, '1', NULL, 'B051'),
    (52, 'Pan Normal Salado - KG', 0.00, 1, 7.90, 0.00, 0.00, 0.00, 1.00, 27, 2, 1, '1', NULL, 'B052'),
    (53, 'Croissant Clasico X 90Gr - UND', 0.00, 1, 1.50, 0.00, 0.00, 0.00, 1.00, 27, 1, 1, '1', NULL, 'B053'),
    (54, 'Croissant Con Chocolate X 120Gr - UND', 0.00, 1, 3.00, 0.00, 0.00, 0.00, 1.00, 27, 1, 1, '1', NULL, 'B054'),
    (55, 'Croissant Con Manjar X 120Gr - UND', 0.00, 1, 2.50, 0.00, 0.00, 0.00, 1.00, 27, 1, 1, '1', NULL, 'B055'),
    (56, 'Pan Baguet (200G) - UND', 0.00, 1, 2.00, 0.00, 0.00, 0.00, 1.00, 27, 1, 1, '1', NULL, 'B056'),
    (57, 'Pan Ofrenda Ovalado (500G) - UND', 0.00, 1, 10.50, 0.00, 0.00, 0.00, 1.00, 27, 1, 1, '1', NULL, 'B057'),
    (58, 'Pan Mini Croissant - KG', 0.00, 1, 16.20, 0.00, 0.00, 0.00, 1.00, 27, 2, 1, '1', NULL, 'B058'),
    (59, 'Empanada De Pollo - UND', 0.00, 1, 4.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B059'),
    (60, 'Empanada De Carne - UND', 0.00, 1, 4.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B060'),
    (61, 'Alfajor De Maicena - UND', 0.00, 1, 2.00, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B061'),
    (62, 'Empanada De Jamon Y Queso - UND', 0.00, 1, 4.00, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B062'),
    (63, 'Bombon De Manzana - UND', 0.00, 1, 2.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B063'),
    (64, 'Dona De Vainilla - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B064'),
    (65, 'Dona De Chocolate - UND', 0.00, 1, 4.00, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B065'),
    (66, 'Brownie Pastel - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B066'),
    (67, 'Pionono Simple - UND', 0.00, 1, 3.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B067'),
    (68, 'Cacke Pops - UND', 0.00, 1, 5.50, 0.00, 0.00, 0.00, 1.00, 28, 1, 1, '1', NULL, 'B068'),
    (69, 'Porcion Torta Comercial - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B069'),
    (70, 'Postre Porcion Tres Leches Vainilla - UND', 0.00, 1, 7.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B070'),
    (71, 'Postre Porcion Torta Helada - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B071'),
    (72, 'Postre Muss En Copa - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B072'),
    (73, 'Gelatina De Fresa En Vaso - UND', 0.00, 1, 4.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B073'),
    (74, 'Cheesecake Personal - UND', 0.00, 1, 7.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B074'),
    (75, 'Postre Tiramisu En Copa - UND', 0.00, 1, 6.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B075'),
    (76, 'Cupcacke Und - UND', 0.00, 1, 5.00, 0.00, 0.00, 0.00, 1.00, 29, 1, 1, '1', NULL, 'B076'),
    (77, 'Torta Comercial De Coco Mediana - UND', 0.00, 1, 70.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B077'),
    (78, 'Torta Repostera Tres Leches Clasica De Vainilla - UND', 0.00, 1, 80.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B078'),
    (79, 'Torta Comercial De Coco Chica - UND', 0.00, 1, 45.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B079'),
    (80, 'Torta Repostera Selva Negra - UND', 0.00, 1, 80.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B080'),
    (81, 'Torta Helada Mediana - UND', 0.00, 1, 49.50, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B081'),
    (82, 'Torta Helada Chica - UND', 0.00, 1, 38.50, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B082'),
    (83, 'Mini Torta Festiva - UND', 0.00, 1, 25.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B083'),
    (84, 'Tortita Personal - UND', 0.00, 1, 15.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B084'),
    (85, 'Torta Pedido Especial - UND', 0.00, 1, 120.00, 0.00, 0.00, 0.00, 1.00, 30, 1, 1, '1', NULL, 'B085');
SET IDENTITY_INSERT producto OFF;
GO

/* ============================================================
   USUARIOS - Fuente: hoja 'PERSONAL' del Excel MAESTROS.xlsx
   Se insertan todos los usuarios con cargos relevantes para comandas:
   Administrador, Chef, Mozo (id_cargo=14).
   Los Jefes de tienda se incluyen como ADMIN en la app.
   CLAVE POR DEFECTO: 'Ideal2026' (hash bcrypt de ejemplo)
   IMPORTANTE: En producci�n cambiar claves individualmente.
   ============================================================ */
SET IDENTITY_INSERT usuario ON;
INSERT INTO usuario (id_usuario, nombre, direccion, telefono, documento_identidad, usuario, clave, id_cargo, estado, avatar_url, token_fcm, fecha_creacion, fecha_actualizacion, usuario_creacion, usuario_actualizacion) VALUES
    (1, 'FRANKLYN EDUARDO AQUINO QUISPE', NULL, NULL, NULL, 'FRANKLYN.AQUINO', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 1, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (2, 'SONIA LEON TAFUR', NULL, NULL, NULL, 'SONIA.LEON', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (3, 'MAGALY AYAY HUACCHA', NULL, NULL, NULL, 'MAGALY.AYAY', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (4, 'LUZ VARGAS CHAVEZ', NULL, NULL, NULL, 'LUZ.VARGAS', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (5, 'CARMEN ROSA VARGAS SANGAY', NULL, NULL, NULL, 'CARMEN.VARGAS', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (6, 'MAGALY PERALTA ACU�A', NULL, NULL, NULL, 'MAGALY.PERALTA', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (7, 'JUANA PAICO MALIMBA', NULL, NULL, NULL, 'JUANA.PAICO', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (8, 'MARIA YANETH MONSEFU ROMERO', NULL, NULL, NULL, 'YANETH.MONSEFU', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (9, 'MARDELY LISETH RIOS ROJAS', NULL, NULL, NULL, 'LISETH.RIOS', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (10, 'LISBET PEREZ CIEZA', NULL, NULL, NULL, 'LISBET.PEREZ', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 8, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (11, 'NATALIA VARGAS CHAVEZ', NULL, NULL, NULL, 'NATALIA.VARGAS', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (12, 'ALVARO FRANK VALERA CUEVA', NULL, NULL, NULL, 'ALVARO.VALERA', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (13, 'CRISTINA GUZMAN RIVERO', NULL, NULL, NULL, 'CRISTINA.GUZMAN', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (14, 'JHOANA BARBOZA GIL', NULL, NULL, NULL, 'JHOANA.BARBOZA', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (15, 'WILLIAM WALTER TASILLA LLANOS', NULL, NULL, NULL, 'WILLIAM.TASILLA', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (16, 'ELIZ BELTRANA RIVERO RODRIGUEZ', NULL, NULL, NULL, 'ELIS.RIVERO', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (17, 'LILIANA LOPEZ POMPA', NULL, NULL, NULL, 'LILIANA.LOPEZ', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (18, 'JHEILLER CHAVEZ CACHAY', NULL, NULL, NULL, 'JHEILLER.CHAVEZ', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (19, 'MARIA ISABEL HILASACA VILCA', NULL, NULL, NULL, 'ISABEL.HILASACA', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (20, 'JOSUE PERALTA ACU�A', NULL, NULL, NULL, 'JOSUE.PERALTA', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (21, 'LIZ JHANET BARBOZA GIL', NULL, NULL, NULL, 'LIZ.JHANET', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 4, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (30, 'MOZO TIENDA 1', NULL, NULL, NULL, 'MOZO.T1', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (31, 'MOZO TIENDA 2', NULL, NULL, NULL, 'MOZO.T2', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (32, 'MOZO TIENDA 3', NULL, NULL, NULL, 'MOZO.T3', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (33, 'MOZO TIENDA 4', NULL, NULL, NULL, 'MOZO.T4', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (34, 'MOZO TIENDA 5', NULL, NULL, NULL, 'MOZO.T5', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (35, 'MOZO TIENDA 6', NULL, NULL, NULL, 'MOZO.T6', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (36, 'MOZO TIENDA 7', NULL, NULL, NULL, 'MOZO.T7', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (37, 'MOZO TIENDA 9', NULL, NULL, NULL, 'MOZO.T9', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL),
    (38, 'MOZO TIENDA 10', NULL, NULL, NULL, 'MOZO.T10', '$2y$10$TuClaveHashBcryptAqui.IdealDefaultPwd2026xxxxx', 14, 1, NULL, NULL, GETDATE(), NULL, NULL, NULL);
SET IDENTITY_INSERT usuario OFF;
GO

/* ============================================================
   USUARIO_TIENDA - Asignaciones de usuarios a tiendas
   Admins / Jefas de tienda ? su tienda principal
   Chefs ? tienda donde trabajan seg�n Excel
   Mozos ? tienda correspondiente
   ============================================================ */
-- tienda_id map: TIENDA 1=2, TIENDA 2=3, T3=4, T4=5, T5=6, T6=7, T7=8, T9=10, T10=11
INSERT INTO usuario_tienda (id_usuario, id_tienda, es_principal, estado) VALUES
-- Administrador general ? todas las tiendas
    (1,2,1,1),(1,3,0,1),(1,4,0,1),(1,5,0,1),(1,6,0,1),(1,7,0,1),(1,8,0,1),(1,10,0,1),(1,11,0,1),
-- Jefas de tienda ? su local
    (2,11,1,1),  -- SONIA LEON ? TIENDA 10
    (3,2,1,1),   -- MAGALY AYAY ? TIENDA 1
    (4,4,1,1),   -- LUZ VARGAS ? TIENDA 3
    (5,5,1,1),   -- CARMEN VARGAS ? TIENDA 4
    (6,8,1,1),   -- MAGALY PERALTA ? TIENDA 7
    (7,10,1,1),  -- JUANA PAICO ? TIENDA 9
    (8,7,1,1),   -- YANETH MONSEFU ? TIENDA 6
    (9,3,1,1),   -- LISETH RIOS ? TIENDA 2
    (10,6,1,1),  -- LISBET PEREZ ? TIENDA 5
-- Chefs
    (11,10,1,1), -- NATALIA ? TIENDA 9
    (12,2,1,1),  -- ALVARO ? TIENDA 1
    (13,10,1,1), -- CRISTINA ? TIENDA 9
    (14,7,1,1),  -- JHOANA ? TIENDA 6
    (15,11,1,1), -- WILLIAM ? TIENDA 10
    (16,7,1,1),  -- ELIS ? TIENDA 6
    (17,4,1,1),  -- LILIANA ? TIENDA 3
    (18,4,1,1),  -- JHEILLER ? TIENDA 3
    (19,11,1,1), -- ISABEL ? TIENDA 10
    (20,2,1,1),  -- JOSUE ? TIENDA 1
    (21,2,1,1),  -- LIZ JHANET ? TIENDA 1
-- Mozos por tienda
    (30,2,1,1),(31,3,1,1),(32,4,1,1),(33,5,1,1),(34,6,1,1),
    (35,7,1,1),(36,8,1,1),(37,10,1,1),(38,11,1,1);
GO

/* ============================================================
   MESAS - Datos de ejemplo (el Admin puede agregar/editar desde la app)
   Se insertan 5 mesas por tienda como punto de partida.
   ============================================================ */
INSERT INTO mesa (id_tienda, numero, capacidad, estado_mesa, estado, usuario_creacion) VALUES
    (2, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (2, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (2, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (2, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (2, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (3, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (3, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (3, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (3, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (3, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (4, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (4, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (4, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (4, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (4, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (5, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (5, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (5, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (5, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (5, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (6, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (6, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (6, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (6, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (6, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (7, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (7, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (7, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (7, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (7, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (8, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (8, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (8, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (8, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (8, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (10, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (10, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (10, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (10, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (10, 'Mesa 5', 4, 'LIBRE', 1, 1),
    (11, 'Mesa 1', 4, 'LIBRE', 1, 1),
    (11, 'Mesa 2', 4, 'LIBRE', 1, 1),
    (11, 'Mesa 3', 4, 'LIBRE', 1, 1),
    (11, 'Mesa 4', 4, 'LIBRE', 1, 1),
    (11, 'Mesa 5', 4, 'LIBRE', 1, 1);
GO

/* ============================================================
   MAPA COMPLETO DE ENDPOINTS - API REST
   Base URL: /api/v1
   Auth: JWT Bearer Token en header Authorization
   Roles: ADMIN | MOZO | CHEF

   -- AUTH ---------------------------------------------
   POST   /auth/login
          Body: { usuario, clave }
          Resp: { token, usuario:{id,nombre,rol_app,tiendas:[]} }
          Uso : Login para los 3 roles. El backend lee cargo.rol_app.
          BD  : SELECT u.*, c.rol_app FROM usuario u JOIN cargo c ON u.id_cargo=c.id_cargo

   POST   /auth/logout
          Invalida el JWT (blacklist en Redis/memoria)

   GET    /auth/me
          Resp: datos del usuario logueado + tiendas asignadas
          BD  : usuario + usuario_tienda + tienda

   -- USUARIOS (solo ADMIN) -----------------------------
   GET    /usuarios?id_tienda={id}&rol={MOZO|CHEF|ADMIN}
          Lista trabajadores de la sucursal con rol opcional
          BD  : SELECT * FROM usuario u
                JOIN usuario_tienda ut ON u.id_usuario=ut.id_usuario
                JOIN cargo c ON u.id_cargo=c.id_cargo
                WHERE ut.id_tienda=? AND c.rol_app=?

   GET    /usuarios/{id}
          Detalle de un trabajador

   POST   /usuarios
          Crear nuevo trabajador (Admin asigna cargo y tienda)
          Body: { nombre, usuario, clave, id_cargo, id_tienda }
          BD  : INSERT usuario + INSERT usuario_tienda

   PUT    /usuarios/{id}
          Editar datos del trabajador
          BD  : UPDATE usuario SET ... WHERE id_usuario=?

   PATCH  /usuarios/{id}/estado
          Activar/desactivar trabajador (soft delete)
          BD  : UPDATE usuario SET estado=? WHERE id_usuario=?

   PUT    /usuarios/{id}/perfil
          El usuario edita su propio perfil (nombre, telefono, avatar, clave)
          BD  : UPDATE usuario SET ... WHERE id_usuario=? (solo sus propios datos)

   -- MESAS (ADMIN: CRUD | MOZO: solo lectura + cambio estado) --
   GET    /mesas?id_tienda={id}
          Lista TODAS las mesas de la sucursal con su estado actual
          Uso : Vista principal del Mozo (cards verde/amarillo/celeste)
          BD  : SELECT m.*, COUNT(cc.id_comanda_cab) as comandas_activas
                FROM mesa m LEFT JOIN comanda_cab cc
                ON cc.id_mesa=m.id_mesa AND cc.estado_comanda NOT IN ('CERRADO')
                WHERE m.id_tienda=? AND m.estado=1 GROUP BY m.*

   GET    /mesas/{id}
          Detalle de una mesa con comandas activas

   POST   /mesas          [ADMIN]
          Crear mesa
          Body: { id_tienda, numero, capacidad }
          BD  : INSERT mesa

   PUT    /mesas/{id}     [ADMIN]
          Editar mesa (numero, capacidad)
          BD  : UPDATE mesa SET ... WHERE id_mesa=?

   DELETE /mesas/{id}     [ADMIN]
          Eliminar l�gicamente (estado=0), solo si mesa est� LIBRE
          BD  : UPDATE mesa SET estado=0 WHERE id_mesa=? AND estado_mesa='LIBRE'

   PATCH  /mesas/{id}/estado    [MOZO]
          Cambiar estado: 'LIBRE'|'OCUPADA'|'PRE_CUENTA'
          BD  : UPDATE mesa SET estado_mesa=? WHERE id_mesa=?

   -- MEN� / PRODUCTOS (MOZO: solo lectura) ------------
   GET    /productos?id_tienda={id}&categoria={id}&buscar={texto}&page={n}
          Cat�logo con paginaci�n, filtro por categor�a y b�squeda
          Uso : Pantalla de men� del mozo al armar un pedido
          BD  : SELECT * FROM producto WHERE estado=1 AND nombre LIKE '%?%'
                AND id_categoria IN (SELECT id_categoria FROM categoria WHERE id_grupo IN (8,9))

   GET    /productos/{id}
          Detalle del producto: nombre, descripcion, precio_mesa, imagen_url
          Uso : El mozo hace tap en un producto para ver m�s info

   GET    /categorias?id_grupo={8}
          Lista de categor�as del men� para los filtros
          BD  : SELECT * FROM categoria WHERE id_grupo IN (8,9) AND estado=1

   -- COMANDAS (core del m�dulo) ------------------------
   GET    /comandas?id_mesa={id}&estado={EN_COCINA|ENTREGADO|PRE_CUENTA}
          Tickets de una mesa (para la pesta�a 'Tickets' dentro de la mesa)
          BD  : SELECT * FROM comanda_cab WHERE id_mesa=? ORDER BY fecha_creacion DESC

   GET    /comandas/cocina?id_tienda={id}
          VISTA CHEF: Comandas EN_COCINA ordenadas ASC (m�s antiguo = prioritario)
          Polling cada 5s o SSE. Sin paginaci�n (se ven todas las pendientes).
          BD  : SELECT cc.*, STRING_AGG(p.nombre+' x'+CAST(cd.cantidad AS VARCHAR),', ')
                FROM comanda_cab cc JOIN comanda_det cd ON cc.id_comanda_cab=cd.id_comanda_cab
                JOIN producto p ON cd.id_producto=p.id_producto
                WHERE cc.id_tienda=? AND cc.estado_comanda='EN_COCINA'
                GROUP BY cc.id_comanda_cab ORDER BY cc.fecha_creacion ASC

   POST   /comandas
          CREAR comanda (Mozo manda a cocina)
          Body: { id_mesa, id_tienda, nombre_cliente, observacion,
                  items:[{id_producto, cantidad, observacion_item}] }
          L�gica: 1) INSERT comanda_cab (estado='EN_COCINA')
                  2) INSERT comanda_det por cada item
                  3) UPDATE mesa SET estado_mesa='OCUPADA'
                  4) Trigger/se�al al endpoint SSE del chef
          BD  : comanda_cab + comanda_det + mesa

   GET    /comandas/{id}
          Detalle completo del ticket: cabecera + items + productos
          Uso : Mozo entra al ticket para ver descripci�n y bot�n entregar
          BD  : comanda_cab JOIN comanda_det JOIN producto

   PATCH  /comandas/{id}/entregar    [MOZO]
          Mozo marca el pedido como ENTREGADO
          Efecto: estado_comanda='ENTREGADO'
                  ? El ticket desaparece de la pantalla del chef autom�ticamente
          BD  : UPDATE comanda_cab SET estado_comanda='ENTREGADO', fecha_actualizacion=GETDATE()

   PATCH  /comandas/{id}/pre-cuenta  [MOZO]
          Mozo genera pre-cuenta (cliente quiere pagar)
          Efecto: estado_comanda='PRE_CUENTA'
                  UPDATE mesa SET estado_mesa='PRE_CUENTA'
          BD  : UPDATE comanda_cab + UPDATE mesa

   PATCH  /comandas/{id}/cerrar      [SISTEMA/CAJA]
          Cierra el ticket cuando caja confirma el pago
          Efecto: estado_comanda='CERRADO'
                  Si no quedan m�s tickets activos en la mesa ? UPDATE mesa estado='LIBRE'
          BD  : UPDATE comanda_cab + l�gica de revisi�n de mesa

   POST   /comandas/{id}/reimprimir  [MOZO]
          Reimprime el ticket en la impresora de cocina
          Efecto: UPDATE comanda_cab SET reimpresiones=reimpresiones+1
          Devuelve el payload JSON con los datos del ticket para imprimir

   -- DASHBOARD (solo ADMIN) ----------------------------
   GET    /dashboard?id_tienda={id}&fecha={YYYY-MM-DD}
          Resumen del d�a:
          - total_ventas: SUM(total) FROM comanda_cab WHERE id_tienda=? AND CAST(fecha_creacion AS DATE)=?
          - total_tickets: COUNT(*)
          - producto_mas_vendido: TOP 1 producto por SUM(cantidad) en comanda_det del d�a
          - mesas_ocupadas: COUNT(*) FROM mesa WHERE estado_mesa != 'LIBRE'
          - comandas_en_cocina: COUNT(*) FROM comanda_cab WHERE estado='EN_COCINA'
          BD  : consultas sobre comanda_cab + comanda_det + mesa + producto

   -- TIEMPO REAL (CHEF) -------------------------------
   GET    /comandas/cocina/stream?id_tienda={id}
          Server-Sent Events (SSE) o polling cada 5 segundos
          La pantalla del chef se actualiza autom�ticamente
          sin que el chef toque nada.
          Alternativa simple: el cliente hace GET /comandas/cocina?id_tienda=
          cada 5s y re-renderiza la lista.
   ============================================================ */

PRINT 'Base de datos la_ideal_cafeteria creada correctamente.';
GO
