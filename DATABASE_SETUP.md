# Database Setup Instructions

## Setting up the Supabase Database

1. **Go to your Supabase project dashboard**
   - Navigate to the SQL Editor in your Supabase project

2. **Run the schema migration**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Set up Storage Buckets**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `portal-files`
   - Set it to private (authenticated users only)
   - Create another bucket called `avatars`
   - Set it to public

4. **Configure Storage Policies**
   
   For `portal-files` bucket:
   ```sql
   -- Users can upload files to portals they have access to
   CREATE POLICY "Users can upload files" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'portal-files' AND
     auth.uid() IN (
       SELECT u.id FROM users u
       JOIN portals p ON p.account_id = u.account_id
       WHERE p.id = (storage.foldername(name))[1]
     )
   );

   -- Users can view files in portals they have access to
   CREATE POLICY "Users can view files" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'portal-files' AND
     auth.uid() IN (
       SELECT u.id FROM users u
       JOIN portals p ON p.account_id = u.account_id
       WHERE p.id = (storage.foldername(name))[1]
     )
   );
   ```

5. **Test the setup**
   - Try creating a new account through the signup page
   - Check that a user record is created in the `users` table
   - The trigger should automatically create the user profile

## Important Notes

- The schema uses Supabase Auth for authentication
- Row Level Security (RLS) is enabled on all tables
- Users are automatically linked to the `auth.users` table
- Files are stored in Supabase Storage, not S3
- The schema is optimized for multi-tenant SaaS architecture

## Next Steps

After setting up the database:
1. Test authentication flow
2. Create your first account and portal
3. Set up Stripe webhooks for payment processing
4. Configure email service for notifications