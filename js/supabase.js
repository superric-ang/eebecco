import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://hupiajaktgvilomucadg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cGlhamFrdGd2aWxvbXVjYWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjkyMzUsImV4cCI6MjA5MjU0NTIzNX0.Mv3DNg9r8ItOnr2uh1SAHGyTopH9XA3MNpQvPZiyPfE'
);

export default supabase;