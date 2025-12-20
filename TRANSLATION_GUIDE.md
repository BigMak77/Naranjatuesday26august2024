# Translation Guide

## How to Add Translations to Your Components

The translation system is now set up, but you need to update each component to use translations instead of hardcoded text.

## Quick Start

### 1. Import the hook in your component:

```tsx
import { useTranslation } from '@/context/TranslationContext';
```

### 2. Use it in your component:

```tsx
export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

## Example: Before and After

### Before (Hardcoded English):
```tsx
export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <input placeholder="Email" />
      <input placeholder="Password" type="password" />
      <button>Sign In</button>
      <a href="/forgot-password">Forgot Password?</a>
    </div>
  );
}
```

### After (Translatable):
```tsx
import { useTranslation } from '@/context/TranslationContext';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('auth.loginTitle')}</h1>
      <input placeholder={t('auth.email')} />
      <input placeholder={t('auth.password')} type="password" />
      <button>{t('auth.signIn')}</button>
      <a href="/forgot-password">{t('auth.forgotPassword')}</a>
    </div>
  );
}
```

## Translation Keys Available

Check `messages/en.json` and `messages/pl.json` for available keys:

- `common.*` - General UI elements (save, cancel, delete, etc.)
- `navigation.*` - Menu and navigation items
- `auth.*` - Login and authentication
- `dashboard.*` - Dashboard specific text
- `training.*` - Training module text
- `documents.*` - Document management
- `errors.*` - Error messages
- `messages.*` - Success/info messages

## Adding New Translation Keys

1. Add to both `messages/en.json` AND `messages/pl.json`:

**messages/en.json:**
```json
{
  "mySection": {
    "myNewKey": "My English Text"
  }
}
```

**messages/pl.json:**
```json
{
  "mySection": {
    "myNewKey": "Mój Polski Tekst"
  }
}
```

2. Use in component:
```tsx
{t('mySection.myNewKey')}
```

## Components to Update

You'll need to go through each component and replace hardcoded text with `t('key')`. Priority components:

1. **Login page** - `/src/app/login/page.tsx`
2. **Dashboard pages** - All dashboard components
3. **Training pages** - Training related components
4. **Document pages** - Document management
5. **Admin pages** - Admin interfaces
6. **Forms** - All form labels and placeholders
7. **Tables** - Column headers and table text
8. **Modals** - Modal titles and buttons
9. **Toolbars** - Toolbar buttons and labels

## Testing Translations

1. Run the app: `npm run dev`
2. Open `http://localhost:3000`
3. Click the language selector (globe icon) in the header
4. Switch between English and Polski
5. Verify translated text appears correctly

## Currently Translated

✅ GlobalHeader (partially):
- Search placeholder
- Login button
- User menu (Dashboard, Profile, Log out)
- Raise Issue button
- Checking session message

## Need Translation

❌ Everything else in the app needs to be updated manually by replacing hardcoded text with `t('key')` calls.

## Tips

- Use meaningful key names: `training.startModule` not `btn1`
- Group related keys: `auth.*`, `training.*`, `documents.*`
- Keep keys in English in the JSON for clarity
- Always add to BOTH en.json AND pl.json
- Test in both languages after adding translations
