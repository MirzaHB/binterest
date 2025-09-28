# Azure Static Web Apps Deployment Guide

## Prerequisites

1. **Azure Account** with access to create Static Web Apps
2. **GitHub Repository** with your React code
3. **C# Backend** deployed separately (Azure App Service/Functions)

## Deployment Options

### Option 1: Static Web Apps + Separate Backend (Recommended)

Your current setup works best with this approach:

1. **Deploy React Frontend** to Azure Static Web Apps
2. **Deploy C# Backend** to Azure App Service or Container Apps
3. **Configure CORS** on backend to allow your static web app domain

### Option 2: Static Web Apps + Azure Functions

Convert your C# backend to Azure Functions and link it to Static Web Apps.

## Step-by-Step Deployment

### 1. Create Azure Static Web App

```bash
# Using Azure CLI
az staticwebapp create \
  --name your-app-name \
  --resource-group your-rg \
  --source https://github.com/yourusername/binterest \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --output-location "build"
```

### 2. Configure Environment Variables

In Azure Portal → Static Web Apps → Configuration:

```
REACT_APP_MSAL_CLIENT_ID=66619e58-2ae8-4228-ba4e-f3962c1d3ca7
REACT_APP_MSAL_TENANT_ID=common
REACT_APP_MSAL_REDIRECT_URI=https://your-app.azurestaticapps.net
REACT_APP_API_URL=https://your-backend.azurewebsites.net
```

### 3. Update Azure AD App Registration

1. Go to Azure AD → App registrations → Your app
2. Add redirect URI: `https://your-app.azurestaticapps.net`
3. Update logout URL if needed

### 4. Configure Backend CORS

If using separate backend, add CORS policy:

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowStaticWebApp",
        builder =>
        {
            builder.WithOrigins("https://your-app.azurestaticapps.net")
                   .AllowAnyHeader()
                   .AllowAnyMethod()
                   .AllowCredentials();
        });
});
```

### 5. Test Authentication Flow

1. Test login/logout functionality
2. Verify API calls work
3. Check photo upload and blog features
4. Test admin functionality

## Important Notes

### Proxy Configuration

- ❌ `package.json` proxy doesn't work in production
- ✅ Use environment-based API URLs
- ✅ Configure routing in `staticwebapp.config.json`

### API Routes

- Development: `/api/*` → `localhost:5078`
- Production: `/api/*` → Your backend URL

### Security

- All environment variables are public in React
- Sensitive config should be in backend only
- Use Azure Key Vault for backend secrets

## Troubleshooting

### Common Issues

1. **API calls failing**: Check CORS configuration
2. **Auth redirect errors**: Verify redirect URIs in Azure AD
3. **Environment variables**: Ensure they're set in Static Web Apps config
4. **Route handling**: Check `staticwebapp.config.json`

### Debugging

1. Check browser network tab for API calls
2. Verify environment variables in build logs
3. Test authentication flow step by step

## Files Created for Deployment

- ✅ `staticwebapp.config.json` - Static Web Apps configuration
- ✅ `.github/workflows/azure-static-web-apps.yml` - CI/CD workflow
- ✅ `.env.production` - Production environment template
- ✅ Updated API client with environment detection

## Next Steps

1. Push code to GitHub
2. Create Static Web App in Azure
3. Configure environment variables
4. Deploy backend separately
5. Test complete flow