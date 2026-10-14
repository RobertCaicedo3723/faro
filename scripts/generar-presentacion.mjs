import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Presentation,PresentationFile} from 'file:///C:/Users/SanchezJR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill='C:/Users/SanchezJR/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations';
const staging=path.join(root,'artifacts-build'),out=path.join(root,'entregas/final/presentacion');
await fs.mkdir(staging,{recursive:true});await fs.mkdir(out,{recursive:true});
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const source='https://www.uis.edu.co/intranet/calidad/documentos/bienestar_estudiantil/instructivos/IBE.14.pdf';
const slides=[
 ['FARO','Agente para la revisión mensual\nde vencimientos','Robert Caicedo Sánchez y Cristian Salamanca\nSistemas de Información 2026-2\nDocente Leidy Guarín','Proyecto académico independiente. Preparado el 14 octubre 2026. Introducir el problema, sin presentarlo como un servicio oficial UIS.'],
 ['La rutina seleccionada','Bienestar Estudiantil\nAtención en Salud','La revisión mensual reúne datos de lotes y criterios de vencimiento.\n\nFARO aborda la preparación del registro y su revisión administrativa.','Fuente: '+source+' página 2, paso 3. No se realizaron entrevistas ni se midieron tiempos del personal.'],
 ['Problema y objetivo','Evidencia dispersa\ny decisiones que deben explicarse','Objetivo: preparar un borrador verificable con herramientas controladas.\n\nLa reducción de tiempo es una hipótesis pendiente de medición.','El problema es una oportunidad inferida del análisis de la rutina. No atribuir errores no demostrados al personal.'],
 ['Diseño del agente','El modelo selecciona herramientas\nel servidor limita sus acciones','analyze_lots: clasificación determinista\nsearch_reference: criterios con página\nprioritize_fefo: lotes aptos y exclusiones','Herramientas implementadas en lib/faro.mjs. Fuente técnica: https://api-docs.deepseek.com/guides/tool_calls/ . Recuperación léxica sobre corpus curado, sin base vectorial.'],
 ['Ciclo de ejecución','Solicitud y reserva de presupuesto\nHerramientas y resultados\nBorrador y revisión humana','Máximo tres llamadas. Primera llamada con herramienta obligatoria.\n\nEl agente no dispensa ni cambia existencias.','El usuario elige fecha y tarea. Se valida origen e identidad. El servidor reserva presupuesto atómicamente. DeepSeek selecciona funciones, el servidor valida y devuelve resultados. Se liquida consumo estimado y se permite descargar evidencia.'],
 ['Interfaz funcional','Registro de lotes\ny cuaderno de revisión','Doce lotes sintéticos\nBúsqueda por categoría\nFecha reproducible','Captura real del navegador local. La API no está configurada en la captura. El inventario funciona sin consumo del modelo.','interfaz-escritorio.png'],
 ['Reglas y fuente','Cálculos fuera del modelo','Meses calendario y umbrales explícitos.\nCuarentena prevalece a quince días o menos.\nFEFO excluye vencidos, cuarentena, sin fecha y stock cero.','Fuente: '+source+' páginas 2 y 3. La gráfica y descripción textual tienen intervalos distintos. Se declara una interpretación académica sin aprobación institucional. El día de vencimiento se considera vencido por precaución.'],
 ['Control del gasto','US$0,50 de presupuesto inicial','US$0,03 de reserva preventiva por ejecución\nHasta 700 tokens de salida por llamada\nSin reintentos automáticos','Fuente precios: https://api-docs.deepseek.com/quick_start/pricing/ . Consulta 14 octubre 2026. Estimación con tarifa pico, no lectura del saldo. Una ejecución fallida conserva la reserva. Usos externos y cambios de tarifa quedan fuera del contador.'],
 ['Validación','30 pruebas iniciales aprobadas','Umbrales y fechas inválidas\nFEFO y búsqueda sin tildes\nHerramientas desconocidas y fallos externos','Resultado verificado con node --test tests/faro.test.mjs. Transporte del proveedor sustituido solo en pruebas. Build y TypeScript verificados. Conexión real con clave nueva pendiente: no presentarla como aprobada.'],
 ['Demostración y conclusión','Inspeccionar la evidencia\nantes de aceptar el borrador','1. Buscar aciclovir y revisar exclusiones.\n2. Solicitar una revisión al agente.\n3. Contrastar bitácora y fuente.\n4. Descargar la evidencia.','La demostración del proveedor requiere configurar y probar una credencial nueva. No afirmar mejoras porcentuales sin medir. Continuidad: validación con usuarios, revisión de criterios institucionales y tarifas. La aplicación académica no modifica farmacia.'],
];
function text(slide,value,x,y,w,h,size,color='#193b35',bold=false){const t=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});t.text=value;t.text.style={typeface:'Calibri',fontSize:size,color,bold};return t;}
for(let i=0;i<slides.length;i++){
 const [title,statement,body,notes,image]=slides[i],s=deck.slides.add();s.background.fill=i===0?'#163d34':'#f5f4ed';
 if(i===0){text(s,title,80,85,1120,90,76,'#e8efdc');text(s,statement,80,225,1110,185,54,'#e8efdc');text(s,body,80,530,1100,120,26,'#cbd8cb');}
 else if(image){text(s,title,70,48,1130,58,44);const bytes=await fs.readFile(path.join(root,'evidencias',image));s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',alt:'Vista real de FARO con inventario sintético',fit:'contain',position:{left:530,top:130,width:680,height:510}});text(s,statement,70,165,420,180,44);text(s,body,70,410,410,150,27,'#65756d');}
 else{text(s,title,70,48,1130,58,44);text(s,statement,70,165,1120,190,49);text(s,body,70,395,1110,235,29,'#526448');}
 s.speakerNotes.text=notes;
 const png=await deck.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(staging,`diapositiva-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));
}
const candidate=path.join(staging,'candidato.pptx');await (await PresentationFile.exportPptx(deck)).save(candidate);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(out,'FARO-presentacion.pptx'),pythonExecutable:'C:/Users/SanchezJR/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'design',families:['Calibri']},verifyArtifactToolImport:true,receiptPath:path.join(staging,'validacion.json')});
await fs.writeFile(path.join(out,'guion-exposicion.md'),slides.map((s,i)=>`## ${i+1}. ${s[0]}\n\n${s[3]}\n`).join('\n'));
console.log('presentation_finalized=ok');
