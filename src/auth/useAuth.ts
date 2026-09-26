import React from 'react';
import { useIsAuthenticated, useMsal, useAccount } from '@azure/msal-react';
import { apiScopes } from './auth-config';
import { API_BASE_URL } from '../api/api-client';

export const useAuth = () => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const account = useAccount();
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = React.useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string | null>(null);


  // Fix: Ensure active account is set if we have accounts but no active account
  React.useEffect(() => {
    if (isAuthenticated && !account) {
      const accounts = instance.getAllAccounts();

      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
      }
    }
  }, [isAuthenticated, account, instance]);

  // Define getAccessToken first
  const getAccessToken = React.useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      const response = await instance.acquireTokenSilent({
        scopes: apiScopes,
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire access token:', error);
      return null;
    }
  }, [account, instance]);

  // Fetch Microsoft profile photo via Graph API
  const getProfilePhoto = React.useCallback(async (): Promise<string | null> => {
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account,
      });
      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: { Authorization: `Bearer ${response.accessToken}` },
      });
      if (!graphResponse.ok) return null;
      const blob = await graphResponse.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [account, instance]);


  // Define getUserInfoFromAPI
  const getUserInfoFromAPI = React.useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/user/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch user info:', response.statusText);
        return null;
      }

      const userInfo = await response.json();
      return userInfo;
    } catch (error) {
      console.error('Error calling user info API:', error);
      return null;
    }
  }, [getAccessToken]);

  // Clear stale state when user logs out (handles bfcache restore after incomplete logout)
  React.useEffect(() => {
    if (!isAuthenticated) {
      setUserInfo(null);
      setIsLoadingUserInfo(false);
      setProfilePhotoUrl(null);
    }
  }, [isAuthenticated]);

  // Fetch user info from API when authenticated
  React.useEffect(() => {
    if (isAuthenticated && account && !isLoadingUserInfo && !userInfo) {
      setIsLoadingUserInfo(true);
      getUserInfoFromAPI()
        .then((info) => {
          setUserInfo(info);
        })
        .catch((error) => {
          console.error('Failed to load user info:', error);
        })
        .finally(() => {
          setIsLoadingUserInfo(false);
        });
    }
  }, [isAuthenticated, account, isLoadingUserInfo, userInfo, getUserInfoFromAPI]);

  // Fetch profile photo when authenticated
  React.useEffect(() => {
    if (isAuthenticated && account && !profilePhotoUrl) {
      getProfilePhoto().then(url => {
        if (url) setProfilePhotoUrl(url);
      });
    }
  }, [isAuthenticated, account, profilePhotoUrl, getProfilePhoto]);

  const getCurrentUser = () => {
    if (!account) {
      return null;
    }

    return {
      email: account.username,
      name: account.name || account.username,
      id: account.homeAccountId
    };
  };


  const isAdmin = (): boolean => {
    if (!userInfo) {
      return false;
    }
    return userInfo.isAdmin === true;
  };

  const hasCrudRole = (): boolean => {
    return isAuthenticated && isAdmin();
  };

  return {
    isAuthenticated,
    currentUser: getCurrentUser(),
    userInfo,
    isLoadingUserInfo,
    profilePhotoUrl,
    instance,
    isAdmin,
    hasCrudRole,
    getAccessToken,
    getUserInfoFromAPI,
    refreshUserInfo: () => {
      setUserInfo(null);
      setIsLoadingUserInfo(false);
    }
  };
};
