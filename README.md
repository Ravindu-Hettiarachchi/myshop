This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase Storage setup (required for product/shop image uploads)

This app uploads product, logo, and banner images to a single bucket:

- Bucket name: `shop-assets`

If this bucket is missing, uploads will fail with a clear error in the dashboard.

### 1) Create bucket

In Supabase Dashboard → Storage, create:

- Name: `shop-assets`
- Public bucket: `true` (recommended, so storefront images can be rendered directly)

### 2) Storage policies (SQL)

Run in Supabase SQL editor (adjust if your security model differs):

```sql
-- Public read for storefront image rendering
create policy "shop-assets public read"
on storage.objects
for select
to public
using (bucket_id = 'shop-assets');

-- Authenticated users can upload into shop-assets
create policy "shop-assets authenticated insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'shop-assets');

-- Authenticated users can update/delete objects in shop-assets
create policy "shop-assets authenticated update"
on storage.objects
for update
to authenticated
using (bucket_id = 'shop-assets')
with check (bucket_id = 'shop-assets');

create policy "shop-assets authenticated delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'shop-assets');
```

### 3) How the app stores images

- Files are uploaded to paths like: `<shop_id>/products/<generated-file-name>`
- Product rows store `image_urls` (public URLs) for rendering in dashboard/storefront.
