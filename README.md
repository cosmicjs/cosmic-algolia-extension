# Wingspans.com custom Cosmic Algolia Extension

<img src="https://imgix.cosmicjs.com/cec9cdd0-265d-11ee-a19d-717742939f83-Algolia-logo-blue.png?w=1200&auto=compression,format" alt="Algolia Extension" width="600"/>

Add your Cosmic Objects to [Algolia](https://www.algolia.com). Connects to the Cosmic API v3 and new dashboard.

## Changes Made

*This plugin addresses the issue of Cosmics Algolia plugin saving all data fields as a single metadata object within an Algolia index and not extracting values from nested objects.* 

This plugin destructures the metadata and saves key / values as indexable fields in Algolia. 
This plugin extracts nested data within certain object types, objects with properties such as ```title```, ```imgix_url```, and ```value```, will be saved as those values alone. 
This plugin adds additional default props to each sync: ```id,slug,title,content,metadata,locale,type,created_at,modified_at,published_at```   


## Deploying Changes 

Any changes merged into the branch ``main`` will automatically be deployed through [Vercel](https://vercel.com/alexanderchiclanas-projects/cosmic-algolia-extension)

## Cosmic v2 Dashboard Installation 

1. Under extensions tab, click ``+`` add title (Wingspans Algolia Sync) and extension URL ```https://cosmic-algolia-extension-alexanderchiclanas-projects.vercel.app/```
2. Detailed instructions will be displayed about how to set query parameters for ``algolia_application_id`` and ``algolia_admin_key``

## Usage 

To use the plugin, objects must be synced individually. This may take a long time (10+ minutes) depending on the size of the collection. During this time, do not exit the page until the spinner stops. 
If there are old entries from an existing import that have different IDs, please clear the index on Algolia before re-syncing. 
