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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
const defaultProps =
  "id,content,created_at,metadata,modified_at,published_at,slug,title,type,locale"

const addCosmicObjectsToAlgolia = async (
  cosmic: any,
  algoliaClient: any,
  index: any,
  toast: any,
  setSending: any,
  cosmicProps: string
) => {
  setSending(true)
  let error = false
  const algoliaIndex = algoliaClient.initIndex(index)
  const data = await getCosmicObjects(cosmic, index, count, 0, cosmicProps)
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
      const data = await getCosmicObjects(
        cosmic,
        index,
        index,
        skip,
        cosmicProps
      )
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
  setSending(false)
}

const getCosmicObjects = async (
  cosmic: any,
  type: string,
  limit: number,
  skip: number,
  cosmicProps: string
) => {
  const data = await cosmic.objects
    .find({
      type: type,
    })
    .props(cosmicProps)
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

const TypesSelect = (
  props: { types: { title: string; slug: string }[]; setType: any } | undefined
) => {
  return (
    <Select
      onValueChange={(data) => {
        props?.setType(data)
      }}
    >
      <SelectTrigger className="w-[260px]">
        <SelectValue
          placeholder="Select an Object type"
          className="cursor-pointer"
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {props?.types?.map((type: { title: string; slug: string }) => (
            <SelectItem
              value={type.slug}
              key={type.slug}
              className="cursor-pointer"
            >
              {type.title}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const TypesForm = (
  props: { types: { title: string; slug: string }[] } | undefined
): JSX.Element => {
  const [sending, setSending] = useState(false)
  const [cosmicProps, setCosmicProps] = useState(defaultProps)
  const [type, setType] = useState("")
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
  if (!props) return <></>
  return (
    <div className="mb-12 w-full">
      <div className="mb-4">
        <TypesSelect types={props.types} setType={setType} />
      </div>
      {type && (
        <>
          <div className="mb-4">
            <p>
              Use the input field to select which props to include (comma
              separated).
            </p>
            <p>
              Note: 1) id is required. 2) If you get an Object size error, use
              props to limit your payload size. See{" "}
              <a
                className="text-blue-700"
                href="https://www.cosmicjs.com/docs/api/objects#get-objects"
                target="_blank"
                rel="noreferrer"
              >
                the Cosmic docs
              </a>{" "}
              for more info.
            </p>
          </div>
          <div className="mb-2 flex w-[600px]">
            <Input
              type="text"
              placeholder="Props"
              value={cosmicProps}
              onChange={(data) => {
                setCosmicProps(data.target.value)
              }}
            />
          </div>
          <div className="mb-2 flex w-[600px]">
            <Button
              onClick={() =>
                addCosmicObjectsToAlgolia(
                  cosmic,
                  algoliaClient,
                  type,
                  toast,
                  setSending,
                  cosmicProps
                )
              }
              className="mr-3"
            >
              {sending ? "Sending... " : "Sync Objects"}
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
                  <AlertDialogTitle>Index results for {type}</AlertDialogTitle>
                  <InstantSearch searchClient={algoliaClient} indexName={type}>
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
          </div>
        </>
      )}
      <Toaster />
    </div>
  )
}

export default TypesForm
