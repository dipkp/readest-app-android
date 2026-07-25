// Supabase client creation functions stubbed out

export const supabase = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    refreshSession: async () => {},
    signOut: async () => {},
  },
} as any;

export const createSupabaseClient = (_accessToken?: string) => {
  return supabase;
};

export const createSupabaseAdminClient = () => {
  return supabase;
};
