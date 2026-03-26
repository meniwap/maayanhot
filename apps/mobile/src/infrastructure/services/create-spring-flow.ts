import { createSpringCommandSchema } from '@maayanhot/contracts';
import {
  generateSpringSlugFromTitle,
  normalizeSpringSlug,
  resolveSpringSlugConflict,
  type SpringRepository,
} from '@maayanhot/domain';

export class CreateSpringFlow {
  constructor(private readonly springRepository: SpringRepository) {}

  async resolveSuggestedSlug(titleOrSlug: string) {
    const baseSlug = normalizeSpringSlug(generateSpringSlugFromTitle(titleOrSlug));
    const existingSlugs = await this.springRepository.findExistingSlugs(baseSlug);

    return resolveSpringSlugConflict(baseSlug, existingSlugs);
  }

  async submit(input: Parameters<typeof createSpringCommandSchema.parse>[0]) {
    const command = createSpringCommandSchema.parse(input);

    return this.springRepository.create({
      alternateNames: command.alternateNames,
      location: command.location,
      slug: command.slug,
      title: command.title,
      ...(command.accessNotes !== undefined ? { accessNotes: command.accessNotes } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.isPublished !== undefined ? { isPublished: command.isPublished } : {}),
      ...(command.regionCode !== undefined ? { regionCode: command.regionCode } : {}),
    });
  }
}
