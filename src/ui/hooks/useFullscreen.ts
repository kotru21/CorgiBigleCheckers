import { useCallback, useEffect, useState } from "react";
import { logger } from "@/shared/logger";

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type WebkitDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};

const doc = () => document as WebkitDocument;

const currentFullscreenElement = () =>
  doc().fullscreenElement ?? doc().webkitFullscreenElement ?? null;

export const isFullscreenSupported = () =>
  typeof document !== "undefined" &&
  Boolean(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);

export function useFullscreen(containerId: string) {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && currentFullscreenElement() !== null
  );

  useEffect(() => {
    const handleChange = () =>
      setIsFullscreen(currentFullscreenElement() !== null);
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (currentFullscreenElement()) {
        await (doc().exitFullscreen?.() ?? doc().webkitExitFullscreen?.());
        return;
      }
      const element = document.getElementById(
        containerId
      ) as WebkitElement | null;
      if (element) {
        await (element.requestFullscreen?.() ??
          element.webkitRequestFullscreen?.());
      }
    } catch (error) {
      logger.warn("Полноэкранный режим недоступен:", error);
    }
  }, [containerId]);

  return { isFullscreen, toggleFullscreen };
}
