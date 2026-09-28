const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');

const [{ administrationErrorMessage }, { BffRequestError }] = loadTs([
  'src/lib/administration-error.ts',
  'src/lib/bff-client.ts',
]);

test('maps service failures to useful French guidance without leaking diagnostics', () => {
  const expected = new Map([
    [400, 'La demande n’a pas pu être traitée. Vérifiez les informations saisies puis réessayez.'],
    [401, 'Authentification requise. Reconnectez-vous au portail Mairie360.'],
    [403, 'Votre compte ne possède pas les droits d’administration nécessaires.'],
    [404, 'Ces informations ne sont plus disponibles. Actualisez la page puis réessayez.'],
    [409, 'Cette action entre en conflit avec une modification récente. Actualisez la page puis réessayez.'],
    [422, 'La demande n’a pas pu être traitée. Vérifiez les informations saisies puis réessayez.'],
    [429, 'Trop de demandes ont été envoyées. Patientez un instant puis réessayez.'],
    [503, 'Le service d’administration est momentanément indisponible. Réessayez plus tard.'],
  ]);

  for (const [status, message] of expected) {
    const actual = administrationErrorMessage(new BffRequestError(status));
    assert.equal(actual, message);
    assert.doesNotMatch(actual, /BFF|\b\d{3}\b/);
  }
});

test('hides network and unexpected error details', () => {
  assert.equal(
    administrationErrorMessage(new TypeError('fetch failed: internal.example')),
    'Impossible de joindre le service d’administration. Vérifiez votre connexion puis réessayez.',
  );
  assert.equal(
    administrationErrorMessage(new Error('private service token expired')),
    'L’opération n’a pas pu aboutir. Réessayez ou contactez votre administrateur.',
  );
  assert.equal(
    administrationErrorMessage('private service token expired'),
    'L’opération n’a pas pu aboutir. Réessayez ou contactez votre administrateur.',
  );
});
