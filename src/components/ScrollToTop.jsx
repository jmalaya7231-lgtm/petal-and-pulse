import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Starts every new page at the top, which matters on phones
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}