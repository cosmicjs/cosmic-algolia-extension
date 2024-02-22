"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createBucketClient } from "@cosmicjs/sdk"
import { Cross1Icon } from "@radix-ui/react-icons"
import algoliasearch from "algoliasearch"
import { Loader2 } from "lucide-react"
import {
  Configure,
  Hits,
  InstantSearch,
  Pagination,
  SearchBox,
} from "react-instantsearch-hooks-web"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface MetadataObject {
  [key: string]: string | MetadataObject | undefined | string[] | null;
}

// Helpers
const makeObjectIds = (objects: any[]) => {
  const objectsWIds = objects.map((object) => {
    const { metadata, ...rest } = object;

    // make custom ID that contains slug and locale if available, defaults to just slug
    const customId = object.locale ? `${object.slug}-${object.locale}` : object.slug;

    return { objectID: customId, ...rest, ...metadata };
  }).map((item) => {
    const newItem: MetadataObject = { ...item };

    for (const [key, value] of Object.entries(newItem)) {
      if (typeof value === 'object' && value !== null) {
        // If the value is an object, and it has a value property, use that instead
        if (value.hasOwnProperty('value')) {
          newItem[key] = (value as { value: any }).value;
        }

        // If the value is an object, and it has an imgix_url property, use that instead
        if (value.hasOwnProperty('imgix_url')) {
          newItem[key] = (value as { imgix_url: any }).imgix_url;
        }
        
        // If the value is an object, and it has a title property, use that instead
        if (value.hasOwnProperty('title')) {
          newItem[key] = (value as { title: any }).title;
        }

        // If the value is an array, extract titles
        if (Array.isArray(value) && value.length > 0) {
          newItem[key] = value.map((item: any) => item?.title || item)
        }
      }
    }
    return newItem;
  });

  return objectsWIds;
};


// How many Objects to get at a time
const count = 10
const defaultProps = "id,slug,title,content,metadata,locale,type,created_at,modified_at,published_at"

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
  const [submitting, setSubmitting] = useState(false)
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

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      setSubmitting(true)
      let error = false
      const algoliaIndex = algoliaClient.initIndex(type)
      const data = await cosmic.objects
        .find({
          type: type,
        })
        .props(cosmicProps)
        .depth(1)
        .limit(count)
      // Add ObjectIDs
      const objects = makeObjectIds(data.objects);

      console.log('objects 1', objects);
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
          const data = await cosmic.objects
            .find({
              type: type,
            })
            .props(cosmicProps)
            .depth(1)
            .skip(skip)
            .limit(count)
            const objects = makeObjectIds(data.objects);

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
      setSubmitting(false)
    },
    [toast, type, cosmic, algoliaClient, cosmicProps, setSubmitting]
  )

  if (!props) return <></>
  return (
    <div className="mb-12 w-full">
      <div className="mb-4">
        <TypesSelect types={props.types} setType={setType} />
      </div>
      {type && (
        <>
          <div className="mb-2">
            <h3 className="font-bold">Set your props</h3>
            <p>
              Use the input field below to select which Object properties to
              include in your search (comma separated).
            </p>
          </div>
          <div className="mb-4">
            <p>
              * Note:
              <ol>
                <li className="ml-2">1. id is required.</li>
                <li className="ml-2">
                  2. If you get an Object size error, use props to limit your
                  payload size. See{" "}
                  <a
                    className="text-blue-700"
                    href="https://www.cosmicjs.com/docs/api/objects#get-objects"
                    target="_blank"
                    rel="noreferrer"
                  >
                    the Cosmic docs
                  </a>{" "}
                  for more info.
                </li>
              </ol>
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
            <div className="mr-2">
              <Button
                disabled={submitting}
                type="submit"
                variant="default"
                size={submitting ? "icon" : "default"}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
            <div>
              <Dialog>
                <DialogTrigger>
                  <Button variant="outline">Test in Search</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Index results for {type}</DialogTitle>
                    <DialogDescription>
                      <InstantSearch
                        searchClient={algoliaClient}
                        indexName={type}
                      >
                        <Configure hitsPerPage={10} />
                        <SearchBox autoFocus />
                        <Hits
                          hitComponent={Hit}
                          className="my-4 h-[400px] overflow-scroll rounded-xl bg-gray-600"
                        />
                        <Pagination />
                      </InstantSearch>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </>
      )}
      <Toaster />
    </div>
  )
}

export default TypesForm
