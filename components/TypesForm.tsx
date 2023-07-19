'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"

import { createBucketClient } from '@cosmicjs/sdk'

const addCosmicObjectsToAlgolia = async (cosmic: any, applicationId: any, adminApiKey: any, index: any) => {
  const client = algoliasearch(applicationId, adminApiKey);
  const algoliaIndex = client.initIndex(index);
  const data = await getCosmicObjects('posts', 1, 0);
  const addObjectsRes = await algoliaIndex.addObjects(data.objects);
  const { taskID } = addObjectsRes;
  await algoliaIndex.waitTask(taskID);
  // Pagination
  if (data.total > 10) {
    for (let skip = 10; skip < data.total; skip = skip + 10) {
      const data = await getCosmicObjects(cosmic, 'posts', index, skip);
      const addObjectsRes = await algoliaIndex.addObjects(data.objects);
      const { taskID } = addObjectsRes;
      await algoliaIndex.waitTask(taskID);
    }
  }
}

const getCosmicObjects = async (cosmic: any, type: string, limit: number, skip: number) => {
  const data = await cosmic.objects.find({
    "type": type
  })
  .props([
    'content',
    'created_at',
    'metadata',
    'modified_at',
    'published_at',
    'slug',
    'title',
    'type',
    'locale'
  ])
  .depth(0)
  .skip(skip)
  .limit(limit)
  return data;
}

async function sendToAlgolia(cosmic: any, type: string) {
  const data = await getCosmicObjects(cosmic, type, 10, 0)
  console.log(data)
}

const Form = (props: { types: { title: string; slug: string }[] } | undefined) => {
  const searchParams = useSearchParams()
  const cosmic = createBucketClient({
    bucketSlug: searchParams.get('bucket_slug'),
    readKey: searchParams.get('read_key')
  })
  if (!props)
    return
  const list = props.types.map((type: { title: string; slug: string; }) => {
    return <div className="mb-4 ml-3 w-full">
        <div className="w-[200px]">
          {type.title}
        </div>
        <Button onClick={() => sendToAlgolia(cosmic, type.slug)}>Sync with Algolia</Button>
    </div>
  })
  return <>
    {list}
  </>
}


export default Form;