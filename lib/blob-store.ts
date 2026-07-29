import { getStore } from "@netlify/blobs";

// Netlify Blobs is supposed to auto-detect its environment when called from
// within a request handler, but that auto-detection has repeatedly been
// reported to fail specifically for Next.js Route Handlers on Netlify's Next
// Runtime (throws MissingBlobsEnvironmentError even though the code runs
// inside a deployed function). Passing siteID/token explicitly sidesteps
// that unreliable detection entirely.
export function getUploadsStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore({ name: "uploads", siteID, token });
  }

  return getStore("uploads");
}
