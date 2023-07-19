import { createBucketClient } from "@cosmicjs/sdk"

import TypesForm from "@/components/TypesForm"

export default async function IndexPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { bucket_slug, read_key, algolia_application_id, algolia_admin_key } =
    searchParams
  let hasCosmicContent = true
  let typesTrimmed
  try {
    const cosmic = createBucketClient({
      bucketSlug: bucket_slug,
      readKey: read_key,
    })
    const types = (await cosmic.objectTypes.find()).object_types
    // Only get title and slug
    typesTrimmed = types.map((type: { title: any; slug: any }) => {
      return { title: type.title, slug: type.slug }
    })
  } catch (e) {
    hasCosmicContent = false
  }
  // Check for algolia keys
  let algoliaKeysAvailable = true
  if (!algolia_application_id || !algolia_admin_key) {
    algoliaKeysAvailable = false
  }

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <h1 className="bold text-2xl">Algolia Extension</h1>
      {!hasCosmicContent && (
        <div>
          You don't have any Object types yet. You need to add content to your
          Bucket first before using this extension.
        </div>
      )}
      {hasCosmicContent && algoliaKeysAvailable && (
        <>
          <h2>Object types</h2>
          <p>Add the following Object types to Algolia:</p>
          <div className="mb-4">
            <div className="mb-4">
              <TypesForm types={typesTrimmed} />
            </div>
          </div>
        </>
      )}
      {!algoliaKeysAvailable && (
        <>
          <div>Add your Algolia keys:</div>
          <div>1. Log in to your Algolia account</div>
          <div>2. Go to Application / Settings / API keys</div>
          <div>3. Copy your `Application ID`` and `Admin API key`</div>
          <div>
            4. Go to this Extension / Settings and add the following query
            parameters:
          </div>
          <div>
            <code>algolia_application_id</code>
          </div>
          <div>
            <code>algolia_admin_key</code>
          </div>
          <div>
            After doing this, come back to this page to add your Objects to
            Algolia.
          </div>
        </>
      )}
    </section>
  )
}
