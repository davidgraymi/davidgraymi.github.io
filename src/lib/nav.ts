import { getCollection } from 'astro:content';
import { nav } from '~/site.config';

/** Sections that only appear in navigation once they have something to show. */
const hasPhotos = async () => (await getCollection('photos', ({ data }) => !data.draft)).length > 0;

/** The site nav, minus any section that would lead to an empty page. */
export async function visibleNav() {
  const showPhotos = await hasPhotos();
  return nav.filter((item) => item.href !== '/photos' || showPhotos);
}
