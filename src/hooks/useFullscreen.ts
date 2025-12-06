import { useState, useEffect, useCallback, useMemo } from "react";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type DocumentWithFullscreen = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

const createFullscreenAPI = () => ({
  enter: (element: FullscreenElement | null) => {
    if (!element) {
      return Promise.resolve();
    }
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    }
    if (element.webkitRequestFullscreen) {
      return element.webkitRequestFullscreen();
    }
    if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen();
    }
    if (element.msRequestFullscreen) {
      return element.msRequestFullscreen();
    }
    return Promise.resolve();
  },
  exit: (doc: DocumentWithFullscreen) => {
    if (doc.exitFullscreen) {
      return doc.exitFullscreen();
    }
    if (doc.webkitExitFullscreen) {
      return doc.webkitExitFullscreen();
    }
    if (doc.mozCancelFullScreen) {
      return doc.mozCancelFullScreen();
    }
    if (doc.msExitFullscreen) {
      return doc.msExitFullscreen();
    }
    return Promise.resolve();
  },
  isActive: (doc: DocumentWithFullscreen) =>
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement,
});

export function useFullscreen(containerId: string) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenAPI = useMemo(() => createFullscreenAPI(), []);

  const toggleFullscreen = useCallback(async () => {
    const doc = document as DocumentWithFullscreen;
    const container = document.getElementById(
      containerId
    ) as FullscreenElement | null;

    try {
      if (!fullscreenAPI.isActive(doc)) {
        await fullscreenAPI.enter(container);
        setIsFullscreen(true);
      } else {
        await fullscreenAPI.exit(doc);
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Ошибка полноэкранного режима:", err);
    }
  }, [containerId, fullscreenAPI]);

  useEffect(() => {
    const doc = document as DocumentWithFullscreen;
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(fullscreenAPI.isActive(doc)));
    };

    doc.addEventListener("fullscreenchange", handleFullscreenChange);
    doc.addEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange as EventListener
    );
    doc.addEventListener(
      "mozfullscreenchange",
      handleFullscreenChange as EventListener
    );
    doc.addEventListener(
      "MSFullscreenChange",
      handleFullscreenChange as EventListener
    );

    return () => {
      doc.removeEventListener("fullscreenchange", handleFullscreenChange);
      doc.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange as EventListener
      );
      doc.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange as EventListener
      );
      doc.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange as EventListener
      );
    };
  }, [fullscreenAPI]);

  return { isFullscreen, toggleFullscreen };
}
