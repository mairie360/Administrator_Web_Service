import { createNonce } from '@mairie360/lib-components/shared';
import AdministrationPage from '../components/AdministrationPage';
import { readInitialAdministration } from '@/lib/initial-administration';
import { administrationSearch } from '@/lib/administration-query';

export default async function Home(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { searchParams } = props ?? {};
  const search = administrationSearch(await searchParams ?? {});
  return <AdministrationPage key={createNonce()} initialState={await readInitialAdministration(search)} initialSearch={search} />;
}
