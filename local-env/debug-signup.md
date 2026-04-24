# Debugging Signup 400 Error

## Step 1: Check Backend Logs

Run this command to see the actual error:

```bash
cd /home/goknown/goknown_monorepo/local-env
sudo docker logs goknown-backend --tail=100 | grep -i -A 10 -B 5 "error\|400\|bad request\|users"
```

Or watch logs in real-time:
```bash
./watch-backend.sh
```

Then try to sign up again and watch for the error message.

## Step 2: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Clear the network log
4. Try to sign up again
5. Find the `POST /users` request (it will be red if it failed)
6. Click on it
7. Go to the **Response** tab - this will show the actual error message from the backend

## Step 3: Check Request Payload

In the Network tab, click on the failed `POST /users` request:
- Go to **Payload** or **Request** tab
- Verify the data being sent includes:
  - `name`
  - `email`
  - `password`

## Common Errors:

1. **"Email address already used"** - The email is already registered
2. **Missing required fields** - name, email, or password is missing
3. **Validation error** - Invalid email format or password requirements not met


