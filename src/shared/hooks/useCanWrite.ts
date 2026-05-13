import { useAppSelector } from "./useAppSelector";

export const useCanWrite = () => {
  const user = useAppSelector((state) => state.auth.user);
  return user?.role === "ADMIN" || user?.permission === "WRITE";
};
