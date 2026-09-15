const path = require('node:path');
const { OpenApiContract } = require('./openapi-contract.cjs');

// Unique BFF du front : BFF User. Son contrat est celui publié dans @mairie360/bff-user-openapi (version
// exacte de package.json) ; contracts/openapi.json en est la reconstruction par scripts/orval-contract.mjs,
// vérifiée par `npm run contracts:check` et tests/network-contract.test.cjs.
const BFF_USER_PACKAGE = '@mairie360/bff-user-openapi';
const CONTRACT_FILE = path.join(__dirname, '..', '..', 'contracts', 'openapi.json');

let contract;
function bffUserContract() {
  contract ??= OpenApiContract.load(CONTRACT_FILE);
  return contract;
}

/** Réponse d'erreur de BFF User : orval ne type que les succès, les erreurs sont donc hors contrat publié. */
function bffError(status, message = 'Erreur BFF') {
  return { status, body: { message }, outOfContract: true };
}

module.exports = { BFF_USER_PACKAGE, CONTRACT_FILE, bffError, bffUserContract };
