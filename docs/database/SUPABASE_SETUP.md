# Deshal ERP — Supabase Connection & Client Setup

> **Document Version**: 1.0.0  
> **Objective**: Production-grade Supabase client architecture, environment security, storage bucket rules, and connection diagnostics.

---

## 1. Environment Configuration & Security Rules

### 1.1 Environment Variable Template
Add to `.env` (never commit to Git):
```env
# Client-side Public Variables (Accessible in Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side Restricted Variables (Node Server / Express ONLY)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Non-Negotiable Security Rule
> **CRITICAL**: `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security (RLS) policies. It MUST NEVER be imported into React client components, exposed in `import.meta.env`, or bundled into browser assets.

---

## 2. Supabase Client Architecture

The Supabase connection layer is organized cleanly in `src/lib/supabase/`:

```text
src/lib/supabase/
├── client.ts      # Browser-safe Singleton Supabase Client (uses anon key)
├── server.ts      # Node.js Server Supabase Client (uses service role key)
└── types.ts       # Generated Database TypeScript Interfaces
```

### 2.1 Browser Client Singleton (`src/lib/supabase/client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);
```

### 2.2 Server Service Role Client (`src/lib/supabase/server.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const getSupabaseServerClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server Supabase environment variables are missing.');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
```

---

## 3. Storage Buckets & Access Policies

Deshal ERP uses Supabase Storage for binary attachments and assets:

| Bucket Name | Purpose | Visibility | Access Policy |
| :--- | :--- | :--- | :--- |
| `employee-documents` | Contracts, IDs, Civil cards | Private | HR_MANAGER, COMPANY_ADMIN, or document owner |
| `contracts` | Lease & customer signed contracts | Private | SALES_MANAGER, ACCOUNTANT, COMPANY_ADMIN |
| `attendance-photos` | Kiosk selfie verification photos | Private | HR_MANAGER, Kiosk service account |
| `request-attachments` | PDF request vouchers | Private | Request submitter, Approver, ADMIN |
| `company-logos` | Company branding & print headers | Public | Public Read |

---

## 4. Connection Diagnostics & Health Verification

A built-in diagnostic helper verifies Supabase connectivity:
```typescript
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Connected to Supabase PostgreSQL successfully.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
}
```
