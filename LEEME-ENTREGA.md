# FARO

Proyecto académico independiente para Sistemas de Información 2026-2.
Autores: Robert Caicedo Sánchez y Cristian Salamanca. Docente: Leidy Guarín.

## Aplicación

Interfaz de revisión mensual basada en IBE.14. Doce lotes sintéticos y tres herramientas administrativas: análisis, recuperación documental y priorización FEFO. No existe conexión con sistemas o datos UIS. La IA solo prepara borradores. El análisis determinista funciona sin credencial. Si falta la clave, la aplicación lo indica y no inventa respuestas.

El sitio se prepara privado. La publicación no otorga automáticamente acceso al compañero o docente. Compartirlo exige configurar el acceso correspondiente; no convertir en público un endpoint de IA financiado con esta cuenta.

## Desarrollo local

Requiere Node >=22.13. Ejecutar `npm run install:ci`, `npm run db:generate` únicamente para nuevos cambios de esquema, y `npm run build`. Aplicar las migraciones pendientes a la base local con Wrangler siguiendo README.md. Después `npm run dev`. Acceso local en la dirección que imprima la consola. Iniciar sesión mediante el enlace `/signin-with-chatgpt?return_to=/` en desarrollo. Esa identidad local es simulada por el starter, no equivale a autenticación institucional.

Configurar una clave nueva de DeepSeek en `.dev.vars` (archivo privado ignorado) o mediante los secretos de Sites para publicación. El script `scripts/configurar-clave.ps1` solicita la clave con entrada oculta para uso local. No reutilizar claves expuestas en chats. No incluir archivos de secretos en entregas.

## Pruebas

`node --test tests/faro.test.mjs`. Las pruebas sustituyen únicamente el transporte del proveedor: no consumen saldo y no prueban conectividad real. La integración real exige la clave privada y una consulta verificada.

## Gasto

Tope global inicial US$0,50, reserva US$0,03 por ejecución, hasta tres solicitudes de 700 tokens de salida y 24.000 bytes de contexto cada una. No hay reintentos automáticos. Al completar, el contador usa tokens reportados y tarifa conservadora pico (entrada US$0,30 y salida US$1,20 por millón, consultada el 14-10-2026). Si falla, conserva la reserva completa. El cálculo es una estimación con tarifas configuradas, no una lectura del saldo del proveedor ni garantía frente a cambios de precio o usos externos de la clave.

Los errores de infraestructura conservan reservas por seguridad. No borrar la base para recuperar presupuesto. Revisar la bitácora con el proveedor antes de un ajuste administrativo. Ningún endpoint de reinicio de presupuesto se expone al navegador.

## Entregables

`entregas/avance-1`: rutina seleccionada y análisis del proceso.
`entregas/avance-2`: propuesta y arquitectura agéntica.
`entregas/final`: informe, presentación y manual.
`evidencias`: pruebas técnicas verificables, sin claves.

La entrega de Avance 1 tiene fecha de preparación real del 14 de octubre, no se presenta como una entrega efectuada en septiembre. La evaluación con personas y cualquier ahorro de tiempo siguen siendo hipótesis hasta medirlos. No se inventan entrevistas ni aprobaciones institucionales.
