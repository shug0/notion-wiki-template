import Cookies from "js-cookie";
import { useCallback, useState } from "react";

type CookieOptions = {
  expires?: number | Date;
  path?: string;
  domain?: string;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
};

export const useCookie = (key: string, initialValue: string) => {
  const [item, setItem] = useState(() => {
    return Cookies.get(key) ?? initialValue;
  });

  const updateItem = useCallback(
    (value: string, options?: CookieOptions) => {
      setItem(value);
      Cookies.set(key, value, options);
    },
    [key],
  );

  return [item, updateItem] as const;
};
