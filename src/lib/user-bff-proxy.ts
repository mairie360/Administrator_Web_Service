import { NextRequest } from 'next/server';
import { configuredBffUrl, forwardToBff } from './bff-proxy';

// Les adaptateurs de session visent le même et unique BFF (BFF User) que le proxy générique.
export function userBffRequest(request: NextRequest, path: string) {
  return forwardToBff(request, configuredBffUrl(), path);
}
