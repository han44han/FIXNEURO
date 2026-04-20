import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://bhjzkuqmsghjogioaika.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoanprdXFtc2doam9naW9haWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDg0MjYsImV4cCI6MjA4ODY4NDQyNn0.uSQC6RDvS5k9UJE9EIepFNWLqEC5Ngvrm-D09L132Bs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const ROBOFLOW_KEY = 'OjLfi8OCXSoi13dXSVS4'
export const ROBOFLOW_WORKFLOW = 'detect-and-classify'
export const ROBOFLOW_WORKSPACE = 'projects-workspace-jym4w'  