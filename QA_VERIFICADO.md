# QA verificado — Cartas que Cobran 1.0

**Fecha:** 21/07/2026
**Entorno probado:** Windows + Node.js (v24).
**Verificado por:** equipo de QA.

## Pruebas realizadas y superadas
- Instalación de dependencias y compilación de better-sqlite3 12.2.0 en Node 24.
- Se añadió auto-seed al servidor (no auto-sembraba); verificado en arranque en frío: 6 expedientes demo cargados.
- Cálculo de intereses de demora verificado: 1.850 € × 13,5% × 31 días = 21,21 € + 70 € de indemnización por costes = 1.941,21 € totales (conforme a la Ley 3/2004 de morosidad).
- Panel: total reclamado activo 9.406,76 €, recuperado 280 €, escalera de 5 pasos y alertas de seguimiento.
- Generación de documento de reclamación por paso (WhatsApp/carta) con contenido real, no plantilla vacía.
- Render de la UI con los expedientes distribuidos por paso de escalada (Recordatorio → Reclamación firme → Carta formal → Burofax → Monitorio).
- Persistencia SQLite; la base de datos demo se auto-genera al primer arranque.

## Limpieza de la entrega
El ZIP no contiene bases de datos de prueba, dependencias instaladas (node_modules),
builds (dist), cachés, logs, ZIPs anidados ni archivos internos de producción
(prompts, metadatos). Los datos de demostración se cargan solos al primer arranque.

## Límites declarados
Producto local y monousuario. Los recordatorios/envíos no mandan mensajes reales
salvo que se conecte un proveedor. No sustituye a software fiscal homologado.
Consulta la Licencia, el Soporte y el Disclaimer incluidos.
