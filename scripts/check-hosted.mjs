#!/usr/bin/env node
/**
 * Comprobador operativo de disponibilidad del sitio publicado de FARO.
 *
 * Alcance y limites:
 * - Solo Node (builtins y globales). Sin dependencias externas.
 * - Una unica peticion GET a la raiz del sitio. No sigue redirecciones.
 * - No envia credenciales ni cookies. No llama a endpoints de IA.
 * - No registra cuerpo de respuesta, errores crudos, secretos ni parametros de URL.
 * - No garantiza salud funcional de FARO ni un SLA: solo describe el transporte HTTP.
 */

import { pathToFileURL } from 'node:url';

export const DEFAULT_URL =
  'https://faro-revision-bienestar-2026.opalhinny8.chatgpt.site';

export const DEFAULT_TIMEOUT_MS = 15_000;

export const STATES = Object.freeze({
  REACHABLE: 'reachable',
  REDIRECT: 'reachable_redirect',
  RESTRICTED: 'restricted',
  ERROR: 'error',
});

/** Error de uso (argumentos o configuracion). No transporta datos sensibles. */
export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

/**
 * Valida y normaliza la URL objetivo.
 * - Solo admite HTTPS absoluta.
 * - Rechaza credenciales incrustadas (userinfo).
 * - Rechaza rutas distintas de "/".
 * - Descarta consulta y fragmento para no registrar parametros.
 * @param {unknown} rawUrl
 * @returns {string} origen + "/"
 */
export function buildTargetUrl(rawUrl) {
  if (rawUrl === undefined || rawUrl === null || rawUrl === '') {
    throw new UsageError('URL vacia: indica una URL HTTPS.');
  }
  if (typeof rawUrl !== 'string') {
    throw new UsageError('URL invalida: debe ser texto.');
  }
  if (/\s/.test(rawUrl)) {
    throw new UsageError('URL invalida: contiene espacios.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UsageError('URL invalida: no es una URL absoluta.');
  }

  if (parsed.protocol !== 'https:') {
    throw new UsageError('URL invalida: solo se admite HTTPS.');
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new UsageError('URL invalida: no se admiten credenciales en la URL.');
  }

  const path = parsed.pathname;
  if (path !== '' && path !== '/') {
    throw new UsageError('URL invalida: solo se admite la ruta raiz "/".');
  }

  // Se descartan consulta y fragmento deliberadamente.
  return `${parsed.origin}/`;
}

/**
 * Traduce un resultado HTTP a un estado operativo acotado.
 * @param {unknown} status
 * @param {unknown} type
 * @returns {string} uno de STATES
 */
export function classifyStatus(status, type) {
  if (type === 'opaqueredirect') {
    return STATES.REDIRECT;
  }
  if (typeof status !== 'number' || Number.isNaN(status)) {
    return STATES.ERROR;
  }
  if (status >= 200 && status <= 299) {
    return STATES.REACHABLE;
  }
  if (status >= 300 && status <= 399) {
    return STATES.REDIRECT;
  }
  if (status === 401 || status === 403) {
    return STATES.RESTRICTED;
  }
  return STATES.ERROR;
}

function messageFor(state) {
  switch (state) {
    case STATES.REACHABLE:
      return 'Respuesta accesible (2xx). No verifica la salud funcional de FARO ni el analisis de IA.';
    case STATES.REDIRECT:
      return 'Respuesta de redireccion (3xx). No es prueba de autenticacion ni de salud de la aplicacion.';
    case STATES.RESTRICTED:
      return 'Acceso restringido (401/403): el host responde, pero requiere autorizacion.';
    default:
      return 'Respuesta no concluyente (otros 4xx/5xx). Revisar segun el diagnostico.';
  }
}

function buildErrorResult(hostname, reason) {
  const message =
    reason === 'timeout'
      ? 'Sin respuesta dentro del tiempo limite. No se registro cuerpo ni detalle del error.'
      : 'Fallo la conexion HTTP. No se registro cuerpo ni detalle del error.';
  return {
    state: STATES.ERROR,
    status: null,
    hostname,
    reason,
    message,
    ok: false,
  };
}

/**
 * Realiza la comprobacion. Permite inyectar `fetch` y `timeoutMs` para pruebas.
 * @param {{ url?: string, timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<{state: string, status: number|null, hostname: string, reason?: string, message: string, ok: boolean}>}
 */
export async function checkHosted(options = {}) {
  const {
    url = DEFAULT_URL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = globalThis.fetch,
  } = options;

  const target = buildTargetUrl(url);
  const hostname = new URL(target).hostname;

  if (typeof fetchImpl !== 'function') {
    throw new UsageError('No hay implementacion de fetch disponible.');
  }

  const timeout = Number(timeoutMs);
  if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 2_147_483_647) {
    throw new UsageError('Timeout invalido: debe ser un numero positivo de milisegundos.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetchImpl(target, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      signal: controller.signal,
      headers: Object.freeze({
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
      }),
    });
    // No descargar el cuerpo: liberar el transporte incluso ante HTML grande.
    await response?.body?.cancel();
  } catch (error) {
    const timedOut = controller.signal.aborted || error?.name === 'AbortError';
    return buildErrorResult(hostname, timedOut ? 'timeout' : 'network_error');
  } finally {
    clearTimeout(timer);
  }

  const status =
    typeof response?.status === 'number' ? response.status : null;
  const state = classifyStatus(status, response?.type);

  return {
    state,
    status,
    hostname,
    message: messageFor(state),
    ok: state !== STATES.ERROR,
  };
}

function parseTimeout(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > 2_147_483_647) {
    throw new UsageError('Timeout invalido: usa milisegundos positivos.');
  }
  return n;
}

/**
 * Analiza argumentos de linea de comandos.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const args = { url: DEFAULT_URL, timeoutMs: DEFAULT_TIMEOUT_MS, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--url') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new UsageError('Falta el valor de --url.');
      }
      args.url = value;
      i += 1;
    } else if (arg.startsWith('--url=')) {
      args.url = arg.slice('--url='.length);
    } else if (arg === '--timeout-ms') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new UsageError('Falta el valor de --timeout-ms.');
      }
      args.timeoutMs = parseTimeout(value);
      i += 1;
    } else if (arg.startsWith('--timeout-ms=')) {
      args.timeoutMs = parseTimeout(arg.slice('--timeout-ms='.length));
    } else {
      throw new UsageError('Argumento no reconocido.');
    }
  }
  return args;
}

function helpText() {
  return [
    'Uso: node scripts/check-hosted.mjs [--url <URL HTTPS>] [--timeout-ms <ms>]',
    '',
    `URL por defecto: ${DEFAULT_URL}`,
    `Timeout por defecto: ${DEFAULT_TIMEOUT_MS} ms`,
    '',
    'Solo se admite HTTPS sin credenciales y la ruta raiz "/".',
    'No sigue redirecciones, no envia cookies y no llama a IA.',
    'Salida: JSON con state, status, hostname y message (sin cuerpo ni secretos).',
    '',
    'Codigos de salida:',
    '  0  respuesta alcanzable, redireccion o acceso restringido',
    '  1  error de red, timeout o respuesta 4xx/5xx no clasificada',
    '  2  argumentos o configuracion invalidos',
    '',
  ].join('\n');
}

/**
 * Punto de entrada CLI. Devuelve el codigo de salida y escribe JSON en stdout.
 * @param {string[]} [argv]
 * @param {{ stdout?: { write: Function }, stderr?: { write: Function }, fetchImpl?: typeof fetch }} [io]
 * @returns {Promise<number>}
 */
export async function main(argv = process.argv.slice(2), io = {}) {
  const {
    stdout = process.stdout,
    stderr = process.stderr,
    fetchImpl = globalThis.fetch,
  } = io;

  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    stderr.write(`Error de argumentos: ${error.message}\n`);
    return 2;
  }

  if (args.help) {
    stdout.write(helpText());
    return 0;
  }

  let result;
  try {
    result = await checkHosted({
      url: args.url,
      timeoutMs: args.timeoutMs,
      fetchImpl,
    });
  } catch (error) {
    stderr.write(`Error de uso: ${error instanceof UsageError ? error.message : 'No se pudo completar la comprobacion.'}\n`);
    return 2;
  }

  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

const isDirectRun = (() => {
  try {
    if (!process.argv[1]) return false;
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  process.exitCode = await main();
}
