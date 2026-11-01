import { Component, type ReactNode } from "react";
import { logger } from "@/shared/logger";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

export class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    logger.warn("3D-сцена недоступна, показываем 2D-доску:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
