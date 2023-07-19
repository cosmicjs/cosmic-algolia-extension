import TypesForm from "@/components/TypesForm"

import { createBucketClient } from '@cosmicjs/sdk'

export default async function IndexPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cosmic = createBucketClient({
    bucketSlug: searchParams.bucket_slug,
    readKey: searchParams.read_key
  })
  const types = (await cosmic.objectTypes.find()).object_types;
  
  const typesUpdated = types.map((type: { title: any, slug: any }) => { return { title: type.title, slug: type.slug } });
  
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <h1 className="bold text-2xl">Algolia Extension</h1>
      <div>
        <ol>
          <li>1. Check Algolia keys added.</li>
          <li>- Yes, next step.</li>
          <li>- No, alert and link to edit Extension params.</li>
          <li>2. List Object types with check boxes. Button to sync data to Algolia.</li>
          <div className="mb-4">
            <div className="mb-4">
              <TypesForm types={typesUpdated} />
            </div>
          </div>
          <li>3. Run script to add content to Algolia.</li>
        </ol>
      </div>
    </section>
  )
}
