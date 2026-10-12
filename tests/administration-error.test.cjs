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

test('MAIR-514: a 400 with field details names the refused fields in French', () => {
  const refused = new BffRequestError(400, { error: { code: 'BAD_REQUEST', message: 'Validation failed', details: [
    { path: 'body.first_name', message: 'Must not contain < or >' },
    { path: 'body.phone_number', message: 'Expected a phone number: digits, spaces, `.`, `-`, `(`, `)` and a leading `+`' },
    { path: 'body.name', message: 'String must contain at most 64 character(s)' },
    { path: 'body.description', message: 'Too big: expected string to have <=2000 characters' },
    { path: 'body.email', message: 'Invalid email' },
    { path: 'body.last_name', message: 'String must contain at least 1 character(s)' },
    { path: 'body.password', message: 'String must contain at least 8 character(s)' },
    { path: 'body.user_ids.1', message: 'Required' },
    { path: 'body.nickname', message: 'Unrecognized key' },
    { message: 'Context only' },
    { path: 'ignored' },
    'junk',
  ] } });
  assert.deepEqual(refused.details.length, 10);
  assert.equal(administrationErrorMessage(refused),
    'La demande n’a pas pu être traitée. Vérifiez les champs signalés : Prénom : ne doit pas contenir les caractères < ou > ; Téléphone : chiffres, espaces, points, tirets, parenthèses et un + initial seulement ; Nom : 64 caractères maximum ; Description : 2000 caractères maximum ; Adresse e-mail : adresse e-mail invalide ; Nom : ne doit pas être vide ; Mot de passe : 8 caractères minimum ; Membres : requis ; nickname : Unrecognized key ; Context only.');
  assert.equal(administrationErrorMessage(new BffRequestError(400, { error: { code: 'BAD_REQUEST', message: 'Validation failed', details: [] } })),
    'La demande n’a pas pu être traitée. Vérifiez les informations saisies puis réessayez.');
  assert.equal(administrationErrorMessage(new BffRequestError(400, 'not json')), 'La demande n’a pas pu être traitée. Vérifiez les informations saisies puis réessayez.');
  assert.equal(administrationErrorMessage(new BffRequestError(403, { error: { details: [{ path: 'body.name', message: 'x' }] } })), 'Votre compte ne possède pas les droits d’administration nécessaires.');
});
