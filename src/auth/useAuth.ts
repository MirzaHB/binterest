import React from 'react';
import { useIsAuthenticated, useMsal, useAccount } from '@azure/msal-react';

export const useAuth = () => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const account = useAccount();
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = React.useState(false);


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
  const getAccessToken = async (): Promise<string | null> => {
    if (!account) return null;

    try {
      const response = await instance.acquireTokenSilent({
        scopes: [`api://${process.env.REACT_APP_MSAL_CLIENT_ID}/access_as_user`],
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire access token:', error);
      return null;
    }
  };


  // Define getUserInfoFromAPI
  const getUserInfoFromAPI = React.useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return null;
      }

      const response = await fetch('/api/user/info', {
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
  }, [account, instance]);

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
    // For backwards compatibility, now just delegates to isAdmin
    // since backend uses OID-based authorization
    return isAdmin();
  };

  return {
    isAuthenticated,
    currentUser: getCurrentUser(),
    userInfo,
    isLoadingUserInfo,
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