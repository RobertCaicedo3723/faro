// Pruebas deterministicas del comprobador de disponibilidad.
// Usan transporte simulado (fetch inyectado): no consumen red, no llaman a IA
// y no leen saldo del proveedor.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_URL,
  STATES,
  UsageError,
  buildTargetUrl,
  checkHosted,
  classifyStatus,
  main,
  parseArgs,
} from '../scripts/check-hosted.mjs';

/** Respuesta de transporte simulada. Nunca expone cuerpo a la logica evaluada. */
function fakeResponse({ status, type = 'default' } = {}) {
  return {
    status,
    type,
    async text() {
      return 'cuerpo-no-debe-usarse';
    },
  };
}

/** Captura de flujo para CLI. */
function captureStream() {
  let data = '';
  return {
    write(chunk) {
      data += String(chunk);
      return true;
    },
    get output() {
      return data;
    },
  };
}

test('buildTargetUrl acepta la URL por defecto y normaliza a la raiz', () => {
  assert.equal(buildTargetUrl(DEFAULT_URL), `${DEFAULT_URL}/`);
  assert.equal(buildTargetUrl(`${DEFAULT_URL}/`), `${DEFAULT_URL}/`);
});

test('buildTargetUrl descarta consulta y fragmento sin filtrar parametros', () => {
  assert.equal(
    buildTargetUrl('https://example.com/?token=secreto#frag'),
    'https://example.com/',
  );
});

test('buildTargetUrl rechaza http, credenciales y rutas distintas de la raiz', () => {
  assert.throws(() => buildTargetUrl('http://example.com/'), UsageError);
  assert.throws(() => buildTargetUrl('https://user:pass@example.com/'), UsageError);
  assert.throws(() => buildTargetUrl('https://example.com/admin'), UsageError);
  assert.throws(() => buildTargetUrl('https://example.com/api?x=1'), UsageError);
  assert.throws(() => buildTargetUrl('no-es-url'), UsageError);
  assert.throws(() => buildTargetUrl(''), UsageError);
  assert.throws(() => buildTargetUrl('https://exa mple.com/'), UsageError);
});

test('classifyStatus cubre 2xx, 3xx, 401/403 y otros', () => {
  assert.equal(classifyStatus(200), STATES.REACHABLE);
  assert.equal(classifyStatus(204), STATES.REACHABLE);
  assert.equal(classifyStatus(301), STATES.REDIRECT);
  assert.equal(classifyStatus(308), STATES.REDIRECT);
  assert.equal(classifyStatus(0, 'opaqueredirect'), STATES.REDIRECT);
  assert.equal(classifyStatus(401), STATES.RESTRICTED);
  assert.equal(classifyStatus(403), STATES.RESTRICTED);
  assert.equal(classifyStatus(404), STATES.ERROR);
  assert.equal(classifyStatus(500), STATES.ERROR);
  assert.equal(classifyStatus(429), STATES.ERROR);
  assert.equal(classifyStatus(null), STATES.ERROR);
});

test('checkHosted clasifica 2xx como alcanzable sin implicar salud de IA', async () => {
  const result = await checkHosted({
    fetchImpl: async () => fakeResponse({ status: 200 }),
  });
  assert.equal(result.state, STATES.REACHABLE);
  assert.equal(result.status, 200);
  assert.equal(result.hostname, 'faro-revision-bienestar-2026.opalhinny8.chatgpt.site');
  assert.equal(result.ok, true);
  assert.match(result.message, /No verifica la salud funcional/);
});

test('checkHosted clasifica 3xx como redireccion, no como prueba de autenticacion', async () => {
  const result = await checkHosted({
    fetchImpl: async () => fakeResponse({ status: 302 }),
  });
  assert.equal(result.state, STATES.REDIRECT);
  assert.equal(result.status, 302);
  assert.equal(result.ok, true);
  assert.match(result.message, /No es prueba de autenticacion/);
});

test('checkHosted marca 401/403 como acceso restringido alcanzable', async () => {
  for (const status of [401, 403]) {
    const result = await checkHosted({
      fetchImpl: async () => fakeResponse({ status }),
    });
    assert.equal(result.state, STATES.RESTRICTED);
    assert.equal(result.status, status);
    assert.equal(result.ok, true);
  }
});

test('checkHosted marca otros 4xx/5xx como error no concluyente', async () => {
  for (const status of [404, 500]) {
    const result = await checkHosted({
      fetchImpl: async () => fakeResponse({ status }),
    });
    assert.equal(result.state, STATES.ERROR);
    assert.equal(result.ok, false);
  }
});

test('checkHosted usa GET, sin redirecciones ni credenciales, solo la raiz', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return fakeResponse({ status: 200 });
  };

  await checkHosted({ fetchImpl });

  assert.equal(calls.length, 1, 'debe existir una sola peticion');
  const { url, options } = calls[0];
  const parsed = new URL(url);
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.pathname, '/');
  assert.equal(parsed.search, '');
  assert.equal(parsed.hash, '');
  assert.equal(url, `${DEFAULT_URL}/`);
  assert.equal(options.method, 'GET');
  assert.equal(options.redirect, 'manual');
  assert.equal(options.credentials, 'omit');
  assert.ok(!('authorization' in options.headers));
  assert.ok(!('cookie' in options.headers));
});

test('checkHosted no realiza ninguna llamada a endpoints de IA', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return fakeResponse({ status: 200 });
  };

  await checkHosted({ fetchImpl });

  assert.equal(calls.length, 1);
  for (const url of calls) {
    assert.ok(!/deepseek|openai|anthropic|api\./i.test(url), `URL inesperada: ${url}`);
  }
});

test('checkHosted aborta por timeout y reporta error sin detalle crudo', async () => {
  let observedSignal;
  const fetchImpl = (url, options) => {
    observedSignal = options.signal;
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('operacion abortada');
        error.name = 'AbortError';
        reject(error);
      });
    });
  };

  const result = await checkHosted({ fetchImpl, timeoutMs: 40 });

  assert.equal(result.state, STATES.ERROR);
  assert.equal(result.status, null);
  assert.equal(result.reason, 'timeout');
  assert.equal(result.ok, false);
  assert.equal(observedSignal.aborted, true);
});

test('checkHosted reporta error de red sin filtrar el mensaje original', async () => {
  const fetchImpl = async () => {
    throw new Error('Bearer sk-LEAK-1234567890 en host interno');
  };
  const result = await checkHosted({ fetchImpl });
  assert.equal(result.state, STATES.ERROR);
  assert.equal(result.reason, 'network_error');
  assert.equal(result.ok, false);
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('sk-LEAK-1234567890'));
  assert.ok(!serialized.includes('Bearer'));
  assert.ok(!serialized.includes('host interno'));
});

test('checkHosted no expone cuerpo, cabeceras ni secretos de URL', async () => {
  const secret = 'token-secreto-abc';
  const fetchImpl = async () => fakeResponse({ status: 200 });
  const result = await checkHosted({
    fetchImpl,
    url: `https://example.com/?token=${secret}`,
  });

  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes(secret));
  assert.ok(!serialized.includes('cuerpo-no-debe-usarse'));
  assert.deepEqual(Object.keys(result).sort(), [
    'hostname',
    'message',
    'ok',
    'state',
    'status',
  ]);
});

test('checkHosted rechaza timeout invalido y falta de fetch', async () => {
  await assert.rejects(() => checkHosted({ timeoutMs: 0, fetchImpl: () => {} }), UsageError);
  await assert.rejects(() => checkHosted({ timeoutMs: -5, fetchImpl: () => {} }), UsageError);
  await assert.rejects(() => checkHosted({ fetchImpl: null }), UsageError);
});

test('parseArgs acepta --url y --timeout-ms en sus dos formas', () => {
  assert.deepEqual(parseArgs([]), {
    url: DEFAULT_URL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    help: false,
  });
  assert.equal(parseArgs(['--url', 'https://example.com']).url, 'https://example.com');
  assert.equal(parseArgs(['--url=https://example.com']).url, 'https://example.com');
  assert.equal(parseArgs(['--timeout-ms', '500']).timeoutMs, 500);
  assert.equal(parseArgs(['--timeout-ms=500']).timeoutMs, 500);
  assert.throws(() => parseArgs(['--url']), UsageError);
  assert.throws(() => parseArgs(['--timeout-ms']), UsageError);
  assert.throws(() => parseArgs(['--desconocido']), UsageError);
  assert.throws(() => parseArgs(['--timeout-ms=abc']), UsageError);
});

test('main devuelve codigos de salida correctos ante argumentos invalidos', async () => {
  const stdout = captureStream();
  const stderr = captureStream();
  const io = { stdout, stderr, fetchImpl: async () => fakeResponse({ status: 200 }) };

  assert.equal(await main(['--url'], io), 2);
  assert.equal(await main(['--desconocido'], io), 2);
  assert.equal(await main(['--url', 'http://example.com'], io), 2);
  assert.equal(stderr.output.length > 0, true);
});

test('main devuelve 0 para restringido y 1 para error, con JSON en stdout', async () => {
  const restrictedOut = captureStream();
  const restrictedCode = await main([], {
    stdout: restrictedOut,
    stderr: captureStream(),
    fetchImpl: async () => fakeResponse({ status: 403 }),
  });
  assert.equal(restrictedCode, 0);
  const restricted = JSON.parse(restrictedOut.output);
  assert.equal(restricted.state, STATES.RESTRICTED);
  assert.equal(restricted.status, 403);

  const errorOut = captureStream();
  const errorCode = await main([], {
    stdout: errorOut,
    stderr: captureStream(),
    fetchImpl: async () => fakeResponse({ status: 500 }),
  });
  assert.equal(errorCode, 1);
  const errored = JSON.parse(errorOut.output);
  assert.equal(errored.state, STATES.ERROR);
});

test('URL invalida y timeout fuera de rango no inician transporte', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return fakeResponse({status:200}); };
  for (const url of ['http://example.com/', 'https://user:secret@example.com/', 'https://example.com/api/faro']) {
    await assert.rejects(checkHosted({url, fetchImpl}), UsageError);
  }
  for (const timeoutMs of [0.5, 2_147_483_648, Infinity]) {
    await assert.rejects(checkHosted({timeoutMs, fetchImpl}), UsageError);
  }
  assert.equal(calls, 0);
});

test('descarta parametros antes de enviar y cancela el cuerpo sin leerlo', async () => {
  let cancelled = false;
  await checkHosted({url:'https://example.com/?token=secret#private', fetchImpl:async (url) => {
    assert.equal(url, 'https://example.com/');
    return {status:200, body:{cancel:async () => {cancelled=true;}}, text:() => {throw Error('No leer');}};
  }});
  assert.equal(cancelled, true);
});

test('main imprime ayuda y devuelve 0 con --help', async () => {
  const stdout = captureStream();
  const code = await main(['--help'], {
    stdout,
    stderr: captureStream(),
    fetchImpl: async () => {
      throw new Error('no debe llamarse');
    },
  });
  assert.equal(code, 0);
  assert.match(stdout.output, /check-hosted\.mjs/);
});
