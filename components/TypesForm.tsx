"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createBucketClient } from "@cosmicjs/sdk"
import { Cross1Icon } from "@radix-ui/react-icons"
import algoliasearch from "algoliasearch"
import {
  Configure,
  Hits,
  InstantSearch,
  Pagination,
  SearchBox,
} from "react-instantsearch-hooks-web"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

// Helpers
const makeObjectIds = (objects: []) => {
  const objectsWIds = objects.map((object: any) => {
    return { objectID: object.id, ...object }
  })
  return objectsWIds
}

// Home many Objects to get
const count = 10

const addCosmicObjectsToAlgolia = async (
  cosmic: any,
  algoliaClient: any,
  index: any,
  toast: any,
  setTypeSending: any
) => {
  setTypeSending(index)
  let error = false
  const algoliaIndex = algoliaClient.initIndex(index)
  const data = await getCosmicObjects(cosmic, index, count, 0)
  // Add ObjectIDs
  const objects = makeObjectIds(data.objects)
  try {
    const addObjectsRes = await algoliaIndex.saveObjects(objects)
    const { taskIDs } = addObjectsRes
    await algoliaIndex.waitTask(taskIDs[0])
  } catch (e: any) {
    toast({
      variant: "destructive",
      title: "Something went wrong saving to Algolia",
      description: e.message,
    })
    error = true
  }
  // Pagination
  if (data.total > count) {
    for (let skip = count; skip < Number(data.total); skip = skip + count) {
      const data = await getCosmicObjects(cosmic, index, index, skip)
      const objects = makeObjectIds(data.objects)
      try {
        const addObjectsRes = await algoliaIndex.saveObjects(objects)
        const { taskIDs } = addObjectsRes
        await algoliaIndex.waitTask(taskIDs[0])
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Something went wrong saving to Algolia",
          description: e.message,
        })
        error = true
        break
      }
    }
  }
  if (!error) {
    toast({
      title: "Index successfully added to Algolia!",
    })
  }
  setTypeSending("")
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

type HitProps = {
  hit: {
    title: string
  }
}

const Hit: React.FunctionComponent<HitProps> = ({ hit }) => {
  return (
    <article>
      <p>{hit.title}</p>
    </article>
  )
}

const TypesForm = (
  props: { types: { title: string; slug: string }[] } | undefined
): JSX.Element => {
  const [sending, setTypeSending] = useState()
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
  const { toast } = useToast()
  const list = props?.types.map((type: { title: string; slug: string }) => {
    return (
      <div className="mb-4 w-full" key={type.slug}>
        <div>{type.title}</div>
        <Button
          onClick={() =>
            addCosmicObjectsToAlgolia(
              cosmic,
              algoliaClient,
              type.slug,
              toast,
              setTypeSending
            )
          }
          className="mr-3"
        >
          {sending === type.slug ? "Sending... " : "Sync Objects"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Test in Search</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogCancel className="absolute right-1 top-1 border-0">
              <Cross1Icon />
            </AlertDialogCancel>
            <AlertDialogHeader>
              <AlertDialogTitle>Index Results</AlertDialogTitle>
              <InstantSearch searchClient={algoliaClient} indexName={type.slug}>
                <Configure hitsPerPage={10} />
                <SearchBox autoFocus />
                <Hits
                  hitComponent={Hit}
                  className="h-[400px] overflow-scroll"
                />
                <Pagination />
              </InstantSearch>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                Close <span className="ml-2 text-gray-300">(esc)</span>
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Toaster />
      </div>
    )
  })
  return <>{list}</>
}

export default TypesForm
