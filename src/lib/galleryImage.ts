/** Address of the full-size picture, following the pattern the gallery's own entry pages use. */
export function fullImageUrl(thumbnail: string): string {
  return thumbnail.replace('/files_thumbnail/', '/files/').replace(/\/\d+\.(jpe?g|png|webp)$/i, '')
}
