import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";

import {
  isBuiltInExampleId,
  type BuiltInExampleId,
} from "@/src/utils/caseIntake";

export type AppRoute =
  | { name: "home"; path: "/" }
  | { name: "new"; path: string; editId?: string; exampleId?: BuiltInExampleId }
  | { name: "investigations"; path: "/investigations" }
  | { name: "help"; path: "/help" }
  | { name: "investigation_detail"; path: string; id: string }
  | { name: "not_found"; path: string };

export function normalizeHashPath(rawHash: string): string {
  const withoutHash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  if (!withoutHash || withoutHash === "/") {
    return "/";
  }
  const [rawPathname, rawSearch] = withoutHash.split("?");
  const withLeadingSlash = rawPathname.startsWith("/")
    ? rawPathname
    : `/${rawPathname}`;
  const cleanPathname =
    withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;
  return rawSearch ? `${cleanPathname}?${rawSearch}` : cleanPathname;
}

export function matchRoute(path: string): AppRoute {
  const [pathname, search = ""] = path.split("?");

  if (pathname === "/") {
    return { name: "home", path: "/" };
  }
  if (pathname === "/new") {
    const params = new URLSearchParams(search);
    const editId = params.get("edit") ?? undefined;
    const rawExample = params.get("example");
    const exampleId = isBuiltInExampleId(rawExample) ? rawExample : undefined;
    return { name: "new", path, editId, exampleId };
  }
  if (pathname === "/investigations") {
    return { name: "investigations", path: "/investigations" };
  }
  if (pathname === "/help") {
    return { name: "help", path: "/help" };
  }
  if (pathname.startsWith("/investigation/")) {
    const rawId = pathname.slice("/investigation/".length);
    const decodedId = decodeURIComponent(rawId);
    if (decodedId.length > 0) {
      return {
        name: "investigation_detail",
        path,
        id: decodedId,
      };
    }
  }
  return { name: "not_found", path };
}

export function navigateTo(path: string): void {
  const normalized = normalizeHashPath(path);
  const targetHash = `#${normalized}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

export function useHashRoute(): {
  currentPath: string;
  route: AppRoute;
  navigate: (path: string) => void;
} {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "/";
    }
    return normalizeHashPath(window.location.hash);
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(normalizeHashPath(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const route = useMemo(() => matchRoute(currentPath), [currentPath]);

  const navigate = useCallback((path: string) => {
    navigateTo(path);
  }, []);

  return { currentPath, route, navigate };
}

interface HashLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export function HashLink({ to, onClick, children, ...rest }: HashLinkProps) {
  const normalized = normalizeHashPath(to);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(event);
    }
    if (!event.defaultPrevented) {
      event.preventDefault();
      navigateTo(normalized);
    }
  };

  return (
    <a href={`#${normalized}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
