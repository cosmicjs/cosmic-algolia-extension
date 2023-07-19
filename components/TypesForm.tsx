"use client"

import { useSearchParams } from "next/navigation"
import { createBucketClient } from "@cosmicjs/sdk"
import algoliasearch from "algoliasearch"

import { Button } from "@/components/ui/button"

// Helpers
const makeObjectIds = (objects: []) => {
  const objectsWIds = objects.map((object: any) => {
    return { objectID: object.id, ...object }
  })
  return objectsWIds
}

// Home many Objects to get
const count = 5

const addCosmicObjectsToAlgolia = async (
  cosmic: any,
  algoliaClient: any,
  index: any
) => {
  const algoliaIndex = algoliaClient.initIndex(index)
  const data = await getCosmicObjects(cosmic, index, count, 0)
  // Add ObjectIDs
  const objects = makeObjectIds(data.objects)
  const addObjectsRes = await algoliaIndex.saveObjects(objects)
  const { taskIDs } = addObjectsRes
  await algoliaIndex.waitTask(taskIDs[0])
  // Pagination
  if (data.total > count) {
    for (let skip = count; skip < Number(data.total); skip = skip + count) {
      const data = await getCosmicObjects(cosmic, index, index, skip)
      const objects = makeObjectIds(data.objects)
      const addObjectsRes = await algoliaIndex.saveObjects(objects)
      const { taskIDs } = addObjectsRes
      await algoliaIndex.waitTask(taskIDs[0])
    }
  }
}

const getCosmicObjects = async (
  cosmic: any,
  type: string,
  limit: number,
  skip: number
) => {
  const data = await cosmic.objects
    .find({
      type: type,
    })
    .props([
      "id",
      "content",
      "created_at",
      "metadata",
      "modified_at",
      "published_at",
      "slug",
      "title",
      "type",
      "locale",
    ])
    .depth(0)
    .skip(skip)
    .limit(limit)
  return data
}

const Form = (
  props: { types: { title: string; slug: string }[] } | undefined
) => {
  // Get API keys from URL
  const searchParams = useSearchParams()
  const bucketSlug = searchParams.get("bucket_slug") ?? ""
  const readKey = searchParams.get("read_key") ?? ""
  const algoliaId = searchParams.get("algolia_application_id") ?? ""
  const algoliaAdminKey = searchParams.get("algolia_admin_key") ?? ""
  const cosmic = createBucketClient({
    bucketSlug,
    readKey,
  })
  const algoliaClient = algoliasearch(algoliaId, algoliaAdminKey)
  if (!props) return
  const list = props.types.map((type: { title: string; slug: string }) => {
    return (
      <div className="mb-4 w-full" key={type.slug}>
        <div className="w-[200px]">{type.title}</div>
        <Button
          onClick={() =>
            addCosmicObjectsToAlgolia(cosmic, algoliaClient, type.slug)
          }
        >
          Sync with Algolia
        </Button>
      </div>
    )
  })
  return list
}

export default Form
