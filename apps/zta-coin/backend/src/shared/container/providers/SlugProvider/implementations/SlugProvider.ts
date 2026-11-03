/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import ISlugProvider from '../models/ISlugProvider';

class SlugProvider implements ISlugProvider {
  public slugify(categoria: string): string {
    const from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
    const to = 'aaaaaeeeeeiiiiooooouuuunc------';

    const newText = categoria
      .split('')
      .map((letter, i) =>
        letter.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i)),
      );

    return newText
      .toString() // Cast to string
      .toLowerCase() // Convert the string to lowercase letters
      .trim() // Remove whitespace from both sides of a string
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/&/g, '-y-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '_'); // Replace multiple - with single -
  }
}

export default SlugProvider;
