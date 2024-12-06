import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, updateUser, login, logout, isAuthenticated } = useAuthStore();

  return { user, updateUser, login, logout, isAuthenticated };
};
