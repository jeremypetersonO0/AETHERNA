import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = "https://lorstscngadpfwhhsdiy.supabase.co";
const supabaseKey = "sb_publishable_d8tnRyAnFTFPJAsFu2Bdtw_FIameOw5";

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);