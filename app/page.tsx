/* eslint-disable @next/next/no-img-element */
import { createBucketClient } from "@cosmicjs/sdk"

import TypesForm from "@/components/TypesForm"

export default async function IndexPage({
  searchParams,
}: {
  params: { slug: string }
  searchParams: {
    bucket_slug: string
    read_key: string
    algolia_application_id: string
    algolia_admin_key: string
  }
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
    <section className="flex w-full max-w-3xl flex-col items-start gap-4 py-6 pb-8">
      <h1 className="bold text-3xl">Algolia Extension</h1>
      {!hasCosmicContent && (
        <div>
          You do not have any Object types yet. You need to add content to your
          Bucket first before using this extension.
        </div>
      )}
      {hasCosmicContent && algoliaKeysAvailable && (
        <>
          <div>
            <h3 className="font-bold">Select your Object type</h3>
            <div>
              Select which Object types to add to Algolia. Existing Objects will
              be updated.
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-8">
              <TypesForm types={typesTrimmed} />
            </div>
            <h3 className="font-bold">More options</h3>
            <div>
              If you would like to add / edit facets and other search settings,
              you can do this in your{" "}
              <a
                href="https://dashboard.algolia.com/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cosmic-blue-link dark:text-cosmic-bright-blue"
              >
                Algolia dashboard
              </a>
              .
            </div>
          </div>
        </>
      )}
      {!algoliaKeysAvailable && (
        <>
          <div>
            You will need to add your Algolia keys to extension settings before
            using this extension. Follow these steps:
          </div>
          <div className="mt-4">
            Log in to your{" "}
            <a
              href="https://dashboard.algolia.com/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cosmic-blue-link dark:text-cosmic-bright-blue"
            >
              Algolia dashboard
            </a>
            .
          </div>
          <div>
            <img
              src="https://imgix.cosmicjs.com/c49a5970-266b-11ee-a19d-717742939f83-algolia-step-1.png?w=2000&auto=compression,format"
              alt="Algolia step 1"
              className="w-[800px]"
            />
          </div>
          <div className="mt-4">Go to Application / Settings / API keys.</div>
          <div>
            <img
              src="https://imgix.cosmicjs.com/c4a15e50-266b-11ee-a19d-717742939f83-algolia-step-2.png?w=2000&auto=compression,format"
              alt="Algolia step 2"
              className="w-[800px]"
            />
          </div>
          <div className="mt-4">
            Copy your <span className="font-bold">Application ID</span> and{" "}
            <span className="font-bold">Admin API key</span>
          </div>
          <div className="mt-4">
            In your Cosmic dashboard, go to the settings page for this Extension
            (hover over the sidebar link and click the cog icon), and add the
            following query parameters:
          </div>
          <div>
            <img
              src="https://imgix.cosmicjs.com/94cee540-266a-11ee-a19d-717742939f83-algolia-step-3.png?w=2000&auto=compression,format"
              alt="Algolia step 3"
              className="w-[800px]"
            />
          </div>
          <div>Here are the exact keys to add, for you to copy/paste:</div>
          <div>
            <code>algolia_application_id</code>
          </div>
          <div>
            <code>algolia_admin_key</code>
          </div>
          <div className="pb-10">
            5. After doing this, come back to this page to add your Objects to
            Algolia.
          </div>
        </>
      )}
    </section>
  )
}
