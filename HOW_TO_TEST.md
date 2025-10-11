## 🧪 Testing Role Assignment API

Follow these steps to test your role assignment sync system:

### Step 1: Start Development Server
```bash
cd "/Users/bigmak/Documents/Naranja 4.3 copy"
npm run dev
```
Wait for it to show "Ready" and be available at http://localhost:3000

### Step 2: Run the Role Assignment Test
In a new terminal:
```bash
cd "/Users/bigmak/Documents/Naranja 4.3 copy"
node scripts/test-update-role-api.js
```

### Step 3: Alternative Tests
You can also run:
```bash
# Test the existing role change system
node scripts/test-role-change.js

# Check database state
npm run check-db

# Sync all roles
node scripts/auto-sync-all-roles.js
```

### What the Test Does:
1. ✅ **Finds test users** with different roles
2. ✅ **Checks initial assignments** for a user  
3. ✅ **Calls API** to move user from Role A → Role B
4. ✅ **Verifies removal** of old role assignments
5. ✅ **Verifies addition** of new role assignments
4. ✅ **Checks database consistency** 
5. ✅ **Verifies logging** of the role change
6. ✅ **Tests reverting** back to original role

### Expected Results:
```
🧪 Testing /api/update-user-role-assignments endpoint...
📋 Finding test users...
Found 5 users with 3 different roles:
   1. sales_rep
   2. sales_manager  
   3. admin

👤 Test User: John Doe (ID: 123)
🔄 Role Change: sales_rep → sales_manager
📊 Initial assignments: 8

🚀 Testing API endpoint...
⏱️  Response time: 250ms
📡 Status: 200 OK
✅ API call successful!
📊 Results:
   - Removed assignments: 8
   - Added assignments: 12
   - User ID: 123
   - Old role: sales_rep
   - New role: sales_manager

🔍 Verifying database changes...
📊 Final assignments: 12
✅ Assignment count matches API response
✅ Role change logged successfully

🔄 Testing revert to original role...
✅ Revert successful
   Back to sales_rep with 8 assignments

🎯 Test Summary:
================
✅ API endpoint responding: YES
✅ Assignments removed: 8
✅ Assignments added: 12
✅ Changes logged: YES
✅ Database consistent: YES

🎉 Role assignment sync test completed!
```

### If Tests Fail:
- ❌ **ECONNREFUSED**: Development server not running (`npm run dev`)
- ❌ **Missing credentials**: Check `.env.local` file
- ❌ **No users found**: Database might be empty
- ❌ **API errors**: Check console logs in dev server

### Manual API Test:
You can also test the API directly with curl:
```bash
curl -X POST http://localhost:3000/api/update-user-role-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "old_role_id": "sales_rep", 
    "new_role_id": "sales_manager"
  }'
```
