# Component Translation Helper

This guide shows you patterns to quickly translate your components.

## Common Translation Patterns

### Page Titles
```tsx
// Before:
<h1>Admin Dashboard</h1>

// After:
const { t } = useTranslation();
<h1>{t('admin.title')}</h1>
```

### Buttons
```tsx
// Before:
<button>Save</button>
<button>Cancel</button>
<button>Delete</button>

// After:
<button>{t('common.save')}</button>
<button>{t('common.cancel')}</button>
<button>{t('common.delete')}</button>
```

### Form Labels
```tsx
// Before:
<label>First Name</label>
<label>Last Name</label>
<label>Email</label>

// After:
<label>{t('user.firstName')}</label>
<label>{t('user.lastName')}</label>
<label>{t('auth.email')}</label>
```

### Table Headers
```tsx
// Before:
<th>Actions</th>
<th>Status</th>
<th>View</th>

// After:
<th>{t('table.actions')}</th>
<th>{t('user.status')}</th>
<th>{t('table.view')}</th>
```

### Navigation Links
```tsx
// Before:
<Link href="/admin">Admin</Link>
<Link href="/training">Training</Link>
<Link href="/reports">Reports</Link>

// After:
<Link href="/admin">{t('navigation.admin')}</Link>
<Link href="/training">{t('navigation.training')}</Link>
<Link href="/reports">{t('navigation.reports')}</Link>
```

### Loading States
```tsx
// Before:
{loading && <p>Loading...</p>}

// After:
{loading && <p>{t('common.loading')}</p>}
```

### Error Messages
```tsx
// Before:
<p className="error">An error occurred</p>

// After:
<p className="error">{t('errors.generic')}</p>
```

## Quick Search & Replace Patterns

Use your IDE's find & replace feature:

1. **Find:** `>Save</`
   **Replace:** `>{t('common.save')}</`

2. **Find:** `>Cancel</`
   **Replace:** `>{t('common.cancel')}</`

3. **Find:** `>Delete</`
   **Replace:** `>{t('common.delete')}</`

4. **Find:** `>Edit</`
   **Replace:** `>{t('common.edit')}</`

5. **Find:** `>Add</`
   **Replace:** `>{t('common.add')}</`

6. **Find:** `>Loading...</`
   **Replace:** `>{t('common.loading')}</`

## Remember to:
1. Add `import { useTranslation } from '@/context/TranslationContext';`
2. Add `const { t } = useTranslation();` in the component
3. Test both languages after translating
