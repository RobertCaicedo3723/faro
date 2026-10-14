from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT

ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://www.uis.edu.co/intranet/calidad/documentos/bienestar_estudiantil/instructivos/IBE.14.pdf'
URL='https://faro-revision-bienestar-2026.opalhinny8.chatgpt.site'
pdfmetrics.registerFont(TTFont('Calibri','C:/Windows/Fonts/calibri.ttf'))
pdfmetrics.registerFont(TTFont('CalibriB','C:/Windows/Fonts/calibrib.ttf'))
pdfmetrics.registerFont(TTFont('CalibriL','C:/Windows/Fonts/calibril.ttf'))
INK=colors.HexColor('#193b35');MUTED=colors.HexColor('#65756d')
styles={
 'title':ParagraphStyle('title',fontName='CalibriL',fontSize=29,leading=34,textColor=INK,spaceAfter=22),
 'h':ParagraphStyle('h',fontName='CalibriB',fontSize=14,leading=19,textColor=INK,spaceBefore=16,spaceAfter=8),
 'p':ParagraphStyle('p',fontName='Calibri',fontSize=11,leading=16,textColor=INK,spaceAfter=12),
 'small':ParagraphStyle('small',fontName='Calibri',fontSize=9,leading=13,textColor=MUTED,spaceAfter=10),
}
def p(text,style='p'):return Paragraph(escape(text).replace('\n','<br/>'),styles[style])
def refs():return [('Fuentes y trazabilidad',f'Universidad Industrial de Santander. IBE.14, Instructivo de semaforización de medicamentos y dispositivos médicos, versión 02. Control de cambios: 15 marzo 2024. Consulta: 14 octubre 2026. {SOURCE}'),('Documentación de integración','DeepSeek. Tool Calls, Thinking Mode y Models & Pricing. https://api-docs.deepseek.com/guides/tool_calls/ ; https://api-docs.deepseek.com/guides/thinking_mode/ ; https://api-docs.deepseek.com/quick_start/pricing/ . Consulta: 14 octubre 2026.')]
AV1=[
 ('Rutina de revisión mensual de vencimientos',[
  ('Identificación','Proceso elegido: Bienestar Estudiantil. Subproceso: Atención en Salud. Rutina: revisión mensual de fechas de vencimiento de medicamentos y dispositivos médicos, documentada en IBE.14. Este trabajo aborda una rutina administrativa, no una decisión clínica.'),
  ('Autores y asignatura','Robert Caicedo Sánchez y Cristian Salamanca. Sistemas de Información 2026-2. Docente: Leidy Guarín. Preparación: 14 de octubre de 2026. La consigna fija Avance 1 para el 25 de septiembre; este documento no afirma que se haya presentado en esa fecha.'),
  ('Propósito del análisis','Describir entradas, responsable, controles y salida de la rutina para diseñar una asistencia agéntica verificable. La fuente es un documento oficial publicado por UIS. No se realizaron entrevistas ni mediciones de carga laboral para este informe.'),
  ('Delimitación','Se utiliza un inventario creado exclusivamente para el proyecto. No se importan bases de estudiantes, inventarios reales o información clínica. No hay vínculo técnico con la plataforma operativa de farmacia.')]),
 ('Descripción de la rutina actual',[
  ('Entradas y responsable','El responsable funcional es el regente de farmacia. Las entradas comprenden la identificación de cada producto y lote, cantidades, unidades, laboratorio, registro INVIMA y fecha de vencimiento. La fecha de la revisión determina la comparación temporal.'),
  ('Secuencia de trabajo','1. Reunir el registro de lotes y contrastarlo con sus empaques.\n2. Verificar las fechas y detectar datos faltantes.\n3. Identificar prioridades y restricciones de uso.\n4. Documentar los hallazgos del mes.\n5. Remitir al responsable las acciones que requieran decisión.\n6. Conservar el registro y revisar el seguimiento.'),
  ('Salidas y controles','La salida esperada es un registro mensual verificable y una relación de lotes que requieren atención. El sistema propuesto ayuda a prepararlos, pero no coloca etiquetas físicas, traslada existencias, autoriza devoluciones ni sustituye la verificación de empaques.'),
  ('Oportunidad de mejora','La interpretación de los hallazgos puede separarse de los cálculos y quedar vinculada a evidencias. Se plantea reducir la consulta dispersa y facilitar la revisión de excepciones. Son beneficios esperados, no resultados medidos.')]),
 ('Problema y criterios para la solución',[
  ('Pregunta del proyecto','¿Cómo apoyar la preparación de la revisión mensual mediante un agente que utilice herramientas controladas, mantenga fuentes visibles y no ejecute movimientos de inventario?'),
  ('Riesgos identificados por análisis','Fechas faltantes o incorrectas pueden producir clasificaciones equivocadas. Un modelo puede inventar lotes o confundir una recomendación con una acción ya ejecutada. Un informe sin bitácora dificulta comprobar su fundamento. Estas posibilidades motivan controles, sin atribuir incidentes no demostrados al personal UIS.'),
  ('Criterios de aceptación','La solución debe distinguir datos sintéticos, mostrar la fecha utilizada, conservar exclusiones FEFO, identificar la fuente y página, rechazar herramientas desconocidas, informar errores del proveedor y exigir revisión humana. Ningún cálculo crítico depende de una respuesta libre del modelo.'),
  *refs()])]
AV2=[
 ('Diseño del agente FARO',[
  ('Objetivo general','Construir una aplicación agéntica que prepare borradores de revisión mensual de vencimientos, sustentados en herramientas administrativas y una fuente documental verificable.'),
  ('Objetivos verificables','Representar doce lotes sintéticos con estados temporalmente reproducibles. Implementar tres herramientas acotadas. Mostrar la bitácora y exportar evidencia de cada ejecución completada. Comprobar umbrales, exclusiones, errores y límites mediante pruebas automatizadas. Mantener el uso de IA dentro de un presupuesto inicial de US$0,50 según las tarifas configuradas.'),
  ('Decisión tecnológica','Interfaz React sobre Vinext y servidor Cloudflare Worker mediante Sites. Base D1 para el contador global de gasto y metadatos mínimos de ejecución. Modelo deepseek-flash con razonamiento extendido desactivado. El proveedor admite invocación de herramientas. La clave queda como secreto de servidor, nunca en el cliente.'),
  ('Alcance de autonomía','El modelo selecciona herramientas, interpreta sus resultados y redacta. El servidor decide qué operaciones existen y valida sus argumentos. El responsable humano conserva toda decisión operacional. No se requieren agentes múltiples para este alcance.')]),
 ('Arquitectura y flujo de ejecución',[
  ('Componentes','Navegador: filtros, fecha, solicitud, borrador y bitácora. API de FARO: validación de origen, identidad, longitud y presupuesto. Motor determinista: clasificación de lotes y FEFO. Corpus curado: secciones de IBE.14 con identificadores y páginas. DeepSeek: selección de herramientas y redacción. D1: reservas y gasto estimado.'),
  ('Herramientas disponibles','analyze_lots(): analiza el conjunto sintético en la fecha escogida. search_reference(query): recupera secciones del corpus curado mediante coincidencias textuales normalizadas. prioritize_fefo(product): devuelve lotes aptos ordenados por vencimiento y exclusiones. No existe navegación arbitraria, SQL libre ni ejecución de comandos.'),
  ('Ciclo agéntico','1. Validar entrada y reservar presupuesto de forma atómica.\n2. Enviar solicitud y esquemas al modelo.\n3. Validar y ejecutar las herramientas seleccionadas.\n4. Devolver los resultados al modelo.\n5. Obtener una conclusión o terminar al alcanzar tres llamadas.\n6. Registrar consumo, mostrar bitácora y habilitar descarga.'),
  ('Memoria y recuperación','Cada ejecución es independiente. No se envía historial ilimitado al proveedor. El corpus es pequeño, curado y versionado: no se justifica una base vectorial. No se almacena la pregunta ni la respuesta en D1. La evidencia completa se descarga localmente cuando la persona lo solicita.')]),
 ('Controles y evaluación',[
  ('Seguridad y revisión','Sitio privado con autenticación de la plataforma. Las solicitudes de IA exigen identidad y mismo origen. La clave se configura fuera de Git. Las respuestas se muestran como texto, sin ejecutar HTML. Los datos recuperados no pueden ampliar el catálogo de herramientas. La validación de herramientas limita el daño, pero no garantiza que el modelo nunca produzca contenido incorrecto.'),
  ('Política académica explícita','Los meses se calculan como meses calendario. Se adoptan bandas excluyentes basadas en la gráfica del instructivo y se declara la diferencia con su descripción textual. A quince días o menos prevalece cuarentena. El día exacto de vencimiento se clasifica conservadoramente como vencido. No se presenta esta interpretación como aprobación UIS.'),
  ('Control de costos','Reserva por ejecución: US$0,03. Máximo tres llamadas, 700 tokens de salida por llamada y 24.000 bytes de contexto. Sin reintentos automáticos. El éxito liquida una estimación conservadora con tokens reportados. El fallo conserva la reserva completa. No hay reinicio de presupuesto desde el navegador.'),
  ('Plan de evaluación','Casos deterministas: fechas límite y meses cortos. Casos agénticos: herramienta correcta, argumentos inválidos, falta de clave, error externo y salida truncada. Ensayo humano propuesto: misma tarea manual y asistida, medir tiempo y omisiones, registrar desacuerdos. No se afirma ahorro antes de medir.'),
  *refs()])]
FINAL=[
 ('FARO agente para revisión mensual de vencimientos',[
  ('Resumen','FARO implementa una asistencia administrativa acotada para la preparación de revisiones de vencimientos. Su interfaz permite explorar doce lotes sintéticos sin consumir API y solicitar a DeepSeek un borrador basado en herramientas. Los cálculos críticos son deterministas y la bitácora permite inspeccionar el fundamento de una ejecución.'),
  ('Autores','Robert Caicedo Sánchez y Cristian Salamanca. Sistemas de Información 2026-2. Docente: Leidy Guarín. Universidad Industrial de Santander. Fecha de preparación: 14 octubre 2026.'),
  ('Estado verificable de esta edición','La aplicación compila y supera 30 pruebas automatizadas sin consumo de API. Se comprobaron dos consultas reales a DeepSeek: recuperación documental y revisión FEFO con tres herramientas. Costos estimados: US$0,000669 y US$0,002450. La evidencia FEFO se conserva en JSON. La fecha final del aula es 25 noviembre 2026 a las 23:55, según la consigna suministrada.'),
  ('Aporte','El producto académico conecta una rutina institucional documentada con un agente limitado, una interfaz utilizable y criterios de aceptación reproducibles. Es independiente del producto operativo de farmacia y no constituye una aprobación institucional.')]),
 ('Problema método y alcance',[
  ('Problema','Preparar una revisión mensual requiere combinar registros de lotes, fechas y criterios de actuación. El problema escogido es organizar esa evidencia y redactar un borrador trazable. El proyecto no evalúa tratamientos ni decide el acceso de estudiantes a servicios.'),
  ('Método','Revisión de la consigna y del instructivo público IBE.14. Delimitación de entradas y salidas. Creación de un conjunto sintético. Diseño de herramientas y límites. Implementación de interfaz y API. Pruebas automatizadas, compilación y revisión visual. Documentación de resultados y restricciones pendientes.'),
  ('Alcance implementado','Clasificación por fecha, búsqueda sin tildes, filtros de excepción, recuperación documental, FEFO, ciclo de herramientas, exportación JSON de evidencia y control persistente del presupuesto. Se muestra ausencia de configuración de API de manera explícita.'),
  ('Fuera del alcance','Inventario real, identidad de estudiantes, historias clínicas, dispensación, recepción, reportes oficiales, integración SIMSIS, correo institucional y Digiturno. Las fichas INV-DEMO y los laboratorios ficticios no son registros sanitarios reales.')]),
 ('Diseño e implementación',[
  ('Separación de responsabilidades','El motor clasifica con fechas UTC a medianoche para evitar cambios por zona horaria en comparaciones de días. La función de meses limita el día al último día válido del mes destino. El modelo no puede modificar esos cálculos. La interfaz presenta las cifras deterministas junto al espacio de análisis.'),
  ('Agencia y límites','DeepSeek recibe esquemas de herramientas y una tarea. La primera llamada exige una herramienta y la segunda permite elegir otra o concluir. La tercera solo puede redactar. El servidor rechaza herramientas desconocidas o argumentos adicionales. El máximo de llamadas evita ciclos indefinidos.'),
  ('Trazabilidad','La evidencia descargable incluye identificador de ejecución, autores, fecha, respuesta, herramientas con argumentos y resultados, fuente y costo estimado. D1 conserva únicamente metadatos y control de gasto. La descarga permanece bajo control del usuario y no se sube al aula automáticamente.'),
  ('Decisiones de diseño','Se utiliza un cuaderno de revisión junto a una tabla, en vez de depender de una conversación sin datos visibles. La paleta verde oscuro y papel, tipografía editorial y jerarquía de estados distinguen evidencia y borrador. El sitio declara su carácter académico y evita aparentar un servicio oficial.')]),
 ('Validación y limitaciones',[
  ('Pruebas reproducibles','La suite inicial contiene 30 pruebas aprobadas. Cubre fechas inválidas, año bisiesto, fin de mes, umbrales, existencias cero, FEFO, búsqueda, corpus con páginas y rechazo de operaciones desconocidas. Las pruebas del agente sustituyen el transporte HTTP del proveedor de forma explícita.'),
  ('Errores comprobados','Falta de clave o presupuesto impide una llamada. El rechazo externo no genera reintentos. La salida truncada o una respuesta sin herramienta se rechazan. Una herramienta no autorizada no se ejecuta. Los fallos posteriores a la reserva conservan el importe reservado por precaución.'),
  ('Revisión visual','La interfaz fue inspeccionada en navegador local y se conservaron capturas de escritorio y móvil. La búsqueda de condón sin tilde recupera ambos lotes sintéticos. Las secciones de fuentes y proyecto son accesibles desde la navegación.'),
  ('Lo que no demuestran las pruebas','Las pruebas automatizadas no sustituyen una auditoría de seguridad. Las consultas reales comprueban el ciclo de integración, pero no demuestran un ahorro de tiempo en farmacia, aceptación del personal, vigencia institucional de todas las reglas ni confiabilidad absoluta del modelo. La evaluación con personas queda pendiente. Una explicación sobre recepción motivó reforzar la instrucción: no inferir vida útil al ingreso con la fecha actual de un lote existente.')]),
 ('Operación evaluación futura y conclusiones',[
  ('Uso y mantenimiento','Consultar el manual, configurar una clave privada nueva y verificar una ejecución breve. Revisar consumo en DeepSeek. Mantener un acceso privado y conceder acceso al docente o compañero solo mediante permisos previstos. Revalidar tarifas y fuente documental antes de cambiar versiones. No subir secretos ni la base de ejecución al aula.'),
  ('Medición propuesta','Comparar una tarea manual y una asistida sobre el mismo conjunto sintético. Registrar duración, omisiones, concordancia de clasificación y correcciones del borrador. Alternar el orden de tareas para reducir aprendizaje. Informar tamaño de muestra y limitaciones. Un ahorro porcentual solo se calculará con tiempos medidos.'),
  ('Conclusión','FARO ejecuta un ciclo agéntico real con herramientas controladas para una rutina administrativa, sin modificar sistemas operativos ni asumir funciones clínicas. La separación entre cálculo, recuperación documental y redacción facilita contrastar los resultados. La comprobación con DeepSeek y la evidencia descargada permiten una demostración técnica reproducible. La utilidad para el personal requiere evaluación posterior.'),
  *refs()])]
MANUAL=[
 ('Manual de uso de FARO',[
  ('Antes de comenzar','FARO es un proyecto académico independiente con doce lotes sintéticos. No introduzcas nombres de estudiantes, historias clínicas ni claves en el cuadro de consulta. Abre el sitio privado con tu cuenta autorizada. La dirección prevista es '+URL+'. La disponibilidad efectiva depende del resultado de publicación.'),
  ('Lectura de la revisión','Selecciona una fecha. El escenario inicial utiliza 14 octubre 2026. Los contadores y estados cambian con esa fecha. La tabla funciona sin modelo y no consume saldo. Busca por producto, categoría o lote. Los filtros combinan con la búsqueda, por lo que un producto puede quedar oculto por el estado seleccionado.'),
  ('Interpretación de estados','Vencido, cuarentena y sin fecha requieren atención antes de priorizar cualquier lote. El color nunca es el único indicador: cada estado tiene texto. El stock cero se conserva en el registro pero no se considera apto en FEFO. Los resultados son de práctica, no autorizaciones de entrega.'),
  ('Vista de trabajo','La tabla permite inspeccionar la evidencia antes de pedir una interpretación. El cuaderno del agente aparece al lado en escritorio y debajo en móvil.'),
  ('@image','interfaz-escritorio.png')]),
 ('Consulta al agente y evidencia',[
  ('Solicitudes recomendadas','Ejemplo 1: Revisa el inventario y prepara las acciones prioritarias, consultando el criterio de cuarentena.\nEjemplo 2: ¿Qué lotes de aciclovir prioriza FEFO y cuáles excluye?\nEjemplo 3: Consulta la fuente y explica la rutina mensual.'),
  ('Ejecución','Escribe una solicitud de hasta 1.000 caracteres y pulsa Ejecutar análisis. Espera a que termine. No existe reintento automático. El borrador aparece solo si el proveedor devuelve una conclusión válida respaldada por herramientas. Mientras procesa, la interfaz informa su estado.'),
  ('Revisión humana','Contrasta la conclusión con las cifras de la tabla y el documento oficial. Abre Bitácora de herramientas para leer argumentos y resultados. Una recomendación del agente no confirma que alguien haya realizado una devolución, movimiento o entrega.'),
  ('Descarga','Tras una ejecución completada, Descargar evidencia JSON guarda el borrador con fecha, fuente, bitácora y costo estimado. Es un archivo de evidencia técnica, no el formato institucional oficial. La aplicación no guarda automáticamente ese informe ni lo envía al docente.'),
  ('Fuentes','En Criterios y fuentes puedes revisar las secciones documentales y abrir IBE.14. La política académica y la diferencia entre texto y gráfica permanecen visibles.')]),
 ('Configuración y solución de problemas',[
  ('API sin configurar','El administrador debe revocar cualquier clave expuesta y configurar una nueva como secreto DEEPSEEK_API_KEY en Sites. En local puede ejecutar scripts/configurar-clave.ps1 en PowerShell; la entrada permanece oculta y genera un archivo ignorado con acceso restringido. Nunca adjuntar ese archivo a la entrega.'),
  ('Sesión y permisos','Si aparece Inicia sesión, utiliza el enlace de autenticación. El sitio inicial es privado para su propietario; el acceso del compañero o docente se configura por separado. La identidad simulada del desarrollo local sirve solo para pruebas.'),
  ('Presupuesto','El proyecto dispone de US$0,50 según su contador. Cada ejecución reserva US$0,03. Un error conserva la reserva porque el proveedor pudo facturar. El contador no es el saldo de la cuenta y no incluye consumo externo. Si se agota, el sistema rechaza solicitudes antes de consultar el modelo. No borrar la base para reiniciarlo.'),
  ('Respuestas y fallos','Credencial rechazada: revisar la clave privada. Saldo insuficiente: consultar DeepSeek antes de recargar. Contexto extenso o respuesta incompleta: reducir la pregunta. Sin coincidencias: quitar filtros y buscar por parte del nombre. Error de base: revisar migraciones, sin desactivar el control de presupuesto.'),
  ('Límites de soporte','No publicar el sitio con una clave financiada sin acceso controlado. No conectar esta edición a datos reales. Registrar los errores sin capturar claves. Revalidar fuente, precios y pruebas antes de actualizar.')])]

def footer(canvas,doc):
 canvas.setFillColor(colors.HexColor('#f5f4ed'));canvas.rect(0,0,595.28,841.89,fill=1,stroke=0)
 canvas.setFont('Calibri',9);canvas.setFillColor(MUTED)
 canvas.drawString(48,809,'FARO   /   SISTEMAS DE INFORMACIÓN 2026-2')
 canvas.drawString(48,29,'Robert Caicedo Sánchez y Cristian Salamanca')
 canvas.drawRightString(547,29,str(doc.page))

def build(name,pages):
 out=ROOT/'entregas'/name;out.mkdir(parents=True,exist_ok=True)
 story=[];md=[]
 for i,(title,sections) in enumerate(pages):
  if i:story.append(PageBreak())
  story.append(p(title,'title'));md.append('# '+title+'\n')
  for h,text in sections:
   if h=='@image':
    image=Image(str(ROOT/'evidencias'/text));ratio=image.imageHeight/image.imageWidth;image.drawWidth=490;image.drawHeight=min(235,490*ratio);image.drawWidth=image.drawHeight/ratio;story.append(image);continue
   story.extend([p(h,'h'),p(text,'small' if h.startswith('Fuentes') or h=='Documentación de integración' else 'p')]);md.extend(['## '+h+'\n',text+'\n'])
 doc=SimpleDocTemplate(str(out/('FARO-'+name.split('/')[-1]+'.pdf')),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=57,bottomMargin=48,title=pages[0][0],author='Robert Caicedo Sánchez y Cristian Salamanca')
 doc.build(story,onFirstPage=footer,onLaterPages=footer)
 (out/'contenido-editable.md').write_text('\n'.join(md),encoding='utf-8')
 print(str(out.relative_to(ROOT)))
for name,pages in [('avance-1',AV1),('avance-2',AV2),('final/informe',FINAL),('final/manual',MANUAL)]:build(name,pages)
