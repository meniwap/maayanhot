import { updateSpringCommandSchema } from '@maayanhot/contracts';
import {
  generateSpringSlugFromTitle,
  normalizeSpringSlug,
  resolveSpringSlugConflict,
  type SpringRepository,
} from '@maayanhot/domain';

export class UpdateSpringFlow {
  constructor(private readonly springRepository: SpringRepository) {}

  async resolveSuggestedSlug(titleOrSlug: string, springId: string) {
    const baseSlug = normalizeSpringSlug(generateSpringSlugFromTitle(titleOrSlug));
    const existingSlugs = await this.springRepository.findExistingSlugs(baseSlug, springId);

    return resolveSpringSlugConflict(baseSlug, existingSlugs);
  }

  async submit(input: Parameters<typeof updateSpringCommandSchema.parse>[0]) {
    const command = updateSpringCommandSchema.parse(input);

    return this.springRepository.update({
      alternateNames: command.alternateNames,
      location: command.location,
      slug: command.slug,
      springId: command.springId,
      title: command.title,
      ...(command.accessNotes !== undefined ? { accessNotes: command.accessNotes } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.isPublished !== undefined ? { isPublished: command.isPublished } : {}),
      ...(command.regionCode !== undefined ? { regionCode: command.regionCode } : {}),
    });
  }
}
