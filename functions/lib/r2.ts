/** R2 can return fewer than the requested objects; only `truncated` ends a listing. */
export async function listR2Objects(
  bucket: R2Bucket,
  options: R2ListOptions
): Promise<{ objects: R2Object[]; delimitedPrefixes: string[] }> {
  const objects: R2Object[] = [];
  const prefixes = new Set<string>();
  let cursor: string | undefined;
  // Bound memory and subrequests. Fail visibly instead of returning an incomplete archive.
  for (let page = 0; page < 50; page++) {
    const result = await bucket.list({ ...options, cursor });
    objects.push(...result.objects);
    for (const prefix of result.delimitedPrefixes ?? []) prefixes.add(prefix);
    if (objects.length > 10_000) throw new Error('R2 listing exceeds archive limit');
    if (!result.truncated) return { objects, delimitedPrefixes: [...prefixes] };
    if (!result.cursor || result.cursor === cursor) throw new Error('R2 listing cursor did not advance');
    cursor = result.cursor;
  }
  throw new Error('R2 listing exceeds page limit');
}

/** Conditional R2 writes prevent simultaneous uploads from replacing the same filename. */
export async function putNewR2Object(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer,
  options: R2PutOptions
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await bucket.put(key, body, { ...options, onlyIf: { etagDoesNotMatch: '*' } });
    if (result !== null) return key;
    const slash = key.lastIndexOf('/');
    key = `${key.slice(0, slash + 1)}${crypto.randomUUID()}-${key.slice(slash + 1)}`;
  }
  throw new Error('R2 filename collision');
}
