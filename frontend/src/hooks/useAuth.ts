import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, updateUser, login, logout, isAuthenticated, isSuperAdmin } = useAuthStore();

  return { 
    user, 
    updateUser, 
    login, 
    logout, 
    isAuthenticated,
    isSuperAdmin: isSuperAdmin()
  };
};
