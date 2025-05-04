import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuidscjvuwckndqpqnpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWRzY2p2dXdja25kcXBxbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNjEyNjEsImV4cCI6MjA2MDkzNzI2MX0.6s11zh1LaXN_61OYzcPmmH27m-4TSthH16VtaXsNSew';

export const supabase = createClient(supabaseUrl, supabaseKey);